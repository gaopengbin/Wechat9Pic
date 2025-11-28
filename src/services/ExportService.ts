/**
 * ExportService - 导出服务，处理图片导出和打包
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import JSZip from 'jszip';
import type { ProcessedImage, ExportFormat, Layer } from '@/types';
import { LAYER_CONSTRAINTS } from '@/types';
import { base64ToBlob, downloadBlob } from '@/utils/helpers';
import { LayerRenderer, RenderOptions } from './LayerRenderer';

interface LayerExportOptions {
  format: 'png' | 'jpeg';
  quality: number; // 0.9-1.0
  size: number; // Output size
}

export class ExportService {
  /**
   * 导出单张图片
   * Validates: Requirements 6.1
   */
  async exportSingle(image: ProcessedImage, format: ExportFormat = 'png'): Promise<Blob> {
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    return base64ToBlob(image.processedData, mimeType);
  }

  /**
   * 导出所有图片为ZIP
   * Validates: Requirements 6.3
   */
  async exportAll(
    images: ProcessedImage[],
    format: ExportFormat = 'png',
    onProgress?: (current: number, total: number) => void
  ): Promise<Blob> {
    const zip = new JSZip();
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const extension = format === 'png' ? 'png' : 'jpg';

    // 按位置排序
    const sortedImages = [...images].sort((a, b) => a.position - b.position);

    // 添加每张图片到ZIP
    for (let i = 0; i < sortedImages.length; i++) {
      const image = sortedImages[i];
      const blob = base64ToBlob(image.processedData, mimeType);
      const filename = `image-${image.position + 1}.${extension}`;

      zip.file(filename, blob);

      // 报告进度
      if (onProgress) {
        onProgress(i + 1, sortedImages.length);
      }
    }

    // 生成ZIP文件
    return await zip.generateAsync({ type: 'blob' });
  }

  /**
   * 下载单张图片
   * Validates: Requirements 6.1, 6.4
   */
  async downloadSingle(
    image: ProcessedImage,
    format: ExportFormat = 'png',
    filename?: string
  ): Promise<void> {
    const blob = await this.exportSingle(image, format);
    const extension = format === 'png' ? 'png' : 'jpg';
    const name = filename || `wechat-grid-${image.position + 1}.${extension}`;
    downloadBlob(blob, name);
  }

  /**
   * 下载所有图片为ZIP
   * Validates: Requirements 6.2, 6.3, 6.4
   */
  async downloadAll(
    images: ProcessedImage[],
    format: ExportFormat = 'png',
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    const zipBlob = await this.exportAll(images, format, onProgress);
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `wechat-grid-${timestamp}.zip`;
    downloadBlob(zipBlob, filename);
  }

  /**
   * 生成预览（合成九宫格大图）
   * Validates: Requirements 6.1
   */
  async generatePreview(images: ProcessedImage[]): Promise<string> {
    // 创建一个3x3的canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法创建canvas上下文');

    // 假设每张图片是正方形，计算合适的尺寸
    const imageSize = 400; // 每张图片的尺寸
    const gap = 10; // 图片间隙
    canvas.width = imageSize * 3 + gap * 2;
    canvas.height = imageSize * 3 + gap * 2;

    // 填充背景
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 按位置排序
    const sortedImages = [...images].sort((a, b) => a.position - b.position);

    // 绘制每张图片
    for (const image of sortedImages) {
      const row = Math.floor(image.position / 3);
      const col = image.position % 3;
      const x = col * (imageSize + gap);
      const y = row * (imageSize + gap);

      try {
        const img = await this.loadImageFromBase64(image.processedData);
        ctx.drawImage(img, x, y, imageSize, imageSize);
      } catch (error) {
        console.error(`Failed to load image at position ${image.position}:`, error);
        // 绘制占位符
        ctx.fillStyle = '#ddd';
        ctx.fillRect(x, y, imageSize, imageSize);
        ctx.fillStyle = '#999';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`图片 ${image.position + 1}`, x + imageSize / 2, y + imageSize / 2);
      }
    }

    return canvas.toDataURL('image/png');
  }

  /**
   * 从Base64加载图片
   */
  private loadImageFromBase64(base64: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = base64;
    });
  }

  /**
   * 批量导出到移动设备相册（仅移动端）
   * Validates: Requirements 9.5
   */
  async exportToMobileAlbum(images: ProcessedImage[], format: ExportFormat = 'png'): Promise<void> {
    // 检查是否支持 Web Share API
    if (!navigator.share) {
      throw new Error('当前浏览器不支持分享功能');
    }

    // 导出所有图片
    const files: File[] = [];
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const extension = format === 'png' ? 'png' : 'jpg';

    for (const image of images) {
      const blob = await this.exportSingle(image, format);
      const file = new File([blob], `image-${image.position + 1}.${extension}`, {
        type: mimeType,
      });
      files.push(file);
    }

    // 使用 Web Share API 分享
    await navigator.share({
      files,
      title: '九宫格图片',
      text: '我的九宫格作品',
    });
  }

  /**
   * 估算导出文件大小
   */
  estimateFileSize(images: ProcessedImage[]): number {
    let totalSize = 0;
    for (const image of images) {
      // Base64 编码会增加约 33% 的大小
      // 去掉 data:image/xxx;base64, 前缀
      const base64Data = image.processedData.split(',')[1] || '';
      const bytes = (base64Data.length * 3) / 4;
      totalSize += bytes;
    }
    return totalSize;
  }

  /**
   * Export layers as a composed image
   * **Feature: 3d-layer-effect, Property 9: 导出裁剪正方形保持**
   * **Feature: 3d-layer-effect, Property 17: 导出质量保持**
   * **Validates: Requirements 7.1, 7.3, 7.4**
   */
  async exportLayerComposition(
    layers: Layer[],
    options?: Partial<LayerExportOptions>
  ): Promise<Blob> {
    const exportOptions: LayerExportOptions = {
      format: 'jpeg',
      quality: 0.95, // ≥90% as per requirement
      size: LAYER_CONSTRAINTS.outputSize,
      ...options,
    };

    try {
      // Create a new renderer instance for this export
      const renderer = new LayerRenderer(exportOptions.size, exportOptions.size);
      
      // Render all layers to canvas
      const renderOptions: RenderOptions = {
        width: exportOptions.size,
        height: exportOptions.size,
        quality: exportOptions.quality,
      };

      const canvas = await renderer.renderWithClipping(layers, renderOptions);

      // Convert to blob with specified format and quality
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          `image/${exportOptions.format}`,
          exportOptions.quality
        );
      });
    } catch (error) {
      console.error('Layer composition export failed:', error);
      throw new Error('Failed to export layer composition');
    }
  }

  /**
   * Generate preview of layer composition
   * **Feature: 3d-layer-effect, Property 18: 预览与导出一致性**
   * **Validates: Requirements 8.5**
   */
  async generateLayerPreview(layers: Layer[]): Promise<string> {
    try {
      // Use full size for preview to avoid scaling issues
      // The UI will handle the display scaling
      const renderer = new LayerRenderer(LAYER_CONSTRAINTS.outputSize, LAYER_CONSTRAINTS.outputSize);
      const canvas = await renderer.render(layers);
      return canvas.toDataURL('image/png', 0.8);
    } catch (error) {
      console.error('Preview generation failed:', error);
      throw new Error('Failed to generate preview');
    }
  }
}

// 导出单例实例
export const exportService = new ExportService();
