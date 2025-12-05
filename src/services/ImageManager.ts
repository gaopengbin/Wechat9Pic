/**
 * ImageManager - 负责图片的上传、验证、压缩和存储
 * Validates: Requirements 1.2, 1.3, 1.5, 5.2, 5.3, 10.1
 */

import type { ImageData, UploadResult, ContentType } from '@/types';
import {
  MAX_IMAGES,
  MAX_IMAGE_DIMENSION,
  ERROR_MESSAGES,
} from '@/types/constants';
import {
  isValidImageFile,
  isValidFileSize,
  isValidPosition,
} from '@/utils/validation';
import { generateId, fileToBase64, getImageDimensions, processFileForUpload } from '@/utils/helpers';
import { compressImage, createThumbnail } from '@/utils/imageProcessing';

export class ImageManager {
  private images: Map<number, ImageData> = new Map();

  /**
   * 上传图片
   * Validates: Requirements 1.2, 1.3, 1.5
   */
  async uploadImage(file: File, position: number): Promise<UploadResult> {
    try {
      // 验证位置
      if (!isValidPosition(position)) {
        return {
          success: false,
          error: '无效的位置',
        };
      }

      // 验证图片数量
      if (this.images.size >= MAX_IMAGES && !this.images.has(position)) {
        return {
          success: false,
          error: ERROR_MESSAGES.MAX_IMAGES_EXCEEDED,
        };
      }

      // 验证文件格式
      if (!isValidImageFile(file)) {
        return {
          success: false,
          error: ERROR_MESSAGES.INVALID_FILE_FORMAT,
        };
      }

      // 验证文件大小
      if (!isValidFileSize(file)) {
        return {
          success: false,
          error: ERROR_MESSAGES.FILE_TOO_LARGE,
        };
      }

      // 处理 HEIC 格式转换
      const convertedFile = await processFileForUpload(file);

      // 获取图片尺寸
      const dimensions = await getImageDimensions(convertedFile);

      // 压缩图片（如果需要）
      let processedFile = convertedFile;
      if (
        dimensions.width > MAX_IMAGE_DIMENSION ||
        dimensions.height > MAX_IMAGE_DIMENSION
      ) {
        const compressedBlob = await this.compressImage(convertedFile, MAX_IMAGE_DIMENSION);
        processedFile = new File([compressedBlob], convertedFile.name, { type: convertedFile.type });
      }

      // 生成缩略图
      const thumbnail = await createThumbnail(processedFile, 200);

      // 转换为 Base64
      const fullSize = await fileToBase64(processedFile);

      // 创建 ImageData
      const imageData: ImageData = {
        id: generateId(),
        position,
        originalFile: processedFile,
        thumbnail,
        fullSize,
        width: dimensions.width,
        height: dimensions.height,
        contentType: 'unknown' as ContentType, // 将在内容识别后更新
        metadata: {
          fileSize: processedFile.size,
          format: file.type,
          uploadedAt: new Date(),
        },
      };

      // 存储图片
      this.images.set(position, imageData);

      return {
        success: true,
        imageData,
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: ERROR_MESSAGES.FILE_UPLOAD_FAILED,
      };
    }
  }

  /**
   * 删除图片
   * Validates: Requirements 5.3
   */
  removeImage(position: number): void {
    if (!isValidPosition(position)) {
      throw new Error('无效的位置');
    }

    this.images.delete(position);
  }

  /**
   * 重新排列图片
   * Validates: Requirements 5.2
   */
  reorderImages(fromPosition: number, toPosition: number): void {
    if (!isValidPosition(fromPosition) || !isValidPosition(toPosition)) {
      throw new Error('无效的位置');
    }

    const fromImage = this.images.get(fromPosition);
    const toImage = this.images.get(toPosition);

    if (!fromImage) {
      throw new Error('源位置没有图片');
    }

    // 交换位置
    if (toImage) {
      // 两个位置都有图片，交换它们
      this.images.set(fromPosition, { ...toImage, position: fromPosition });
      this.images.set(toPosition, { ...fromImage, position: toPosition });
    } else {
      // 目标位置为空，移动图片
      this.images.delete(fromPosition);
      this.images.set(toPosition, { ...fromImage, position: toPosition });
    }
  }

  /**
   * 获取所有图片
   */
  getAllImages(): ImageData[] {
    return Array.from(this.images.values()).sort((a, b) => a.position - b.position);
  }

  /**
   * 获取指定位置的图片
   */
  getImage(position: number): ImageData | undefined {
    return this.images.get(position);
  }

  /**
   * 获取图片数量
   */
  getImageCount(): number {
    return this.images.size;
  }

  /**
   * 清空所有图片
   */
  clear(): void {
    this.images.clear();
  }

  /**
   * 更新图片的内容类型
   */
  updateContentType(position: number, contentType: ContentType): void {
    const image = this.images.get(position);
    if (image) {
      this.images.set(position, { ...image, contentType });
    }
  }

  /**
   * 压缩图片
   * Validates: Requirements 10.1
   */
  async compressImage(file: File, maxSize: number): Promise<Blob> {
    return compressImage(file, maxSize);
  }

  /**
   * 检查位置是否已有图片
   */
  hasImage(position: number): boolean {
    return this.images.has(position);
  }

  /**
   * 获取所有已占用的位置
   */
  getOccupiedPositions(): number[] {
    return Array.from(this.images.keys()).sort((a, b) => a - b);
  }

  /**
   * 获取第一个空位置
   */
  getFirstEmptyPosition(): number | null {
    for (let i = 0; i < MAX_IMAGES; i++) {
      if (!this.images.has(i)) {
        return i;
      }
    }
    return null;
  }
}

// 导出单例实例
export const imageManager = new ImageManager();
