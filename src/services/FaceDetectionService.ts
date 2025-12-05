/**
 * FaceDetectionService - 人脸检测服务
 * 使用 face-api.js 进行专业的人脸检测
 */

import * as faceapi from 'face-api.js';

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface DetectionResult {
  isPortrait: boolean;
  faces: FaceBox[];
  mainFace: FaceBox | null;
  suggestion: 'ok' | 'adjust' | 'no-face';
  message: string;
  gridCrop?: { x: number; y: number; size: number };
}

export interface CropSuggestion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 人脸检测服务类
 */
export class FaceDetectionService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private modelLoaded = false;
  private modelLoading = false;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  /**
   * 加载人脸检测模型
   */
  private async loadModels(): Promise<boolean> {
    if (this.modelLoaded) return true;
    if (this.modelLoading) {
      while (this.modelLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.modelLoaded;
    }

    this.modelLoading = true;

    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      ]);

      this.modelLoaded = true;
      console.log('Face detection models loaded');
      return true;
    } catch (error) {
      console.error('Failed to load face detection models:', error);
      return false;
    } finally {
      this.modelLoading = false;
    }
  }

  /**
   * 从图片数据加载图像
   */
  private async loadImage(imageData: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageData;
    });
  }

  /**
   * 检测图片中的人脸
   */
  async detectFaces(imageData: string): Promise<DetectionResult> {
    try {
      const loaded = await this.loadModels();
      const img = await this.loadImage(imageData);

      let faces: FaceBox[] = [];

      if (loaded) {
        try {
          // 先尝试 SSD MobileNet（更准确）
          let detections = await faceapi.detectAllFaces(
            img,
            new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 })
          );

          // 如果没检测到，尝试 TinyFaceDetector
          if (detections.length === 0) {
            detections = await faceapi.detectAllFaces(
              img,
              new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 })
            );
          }

          faces = detections.map(d => ({
            x: Math.round(d.box.x),
            y: Math.round(d.box.y),
            width: Math.round(d.box.width),
            height: Math.round(d.box.height),
            confidence: d.score,
          })).sort((a, b) => (b.width * b.height) - (a.width * a.height));
        } catch (e) {
          console.error('Face detection error:', e);
        }
      }

      const mainFace = faces.length > 0 ? faces[0] : null;
      const isPortrait = faces.length > 0;

      // 计算九宫格显示区域
      const cropSize = Math.min(img.width, img.height);
      const cropX = (img.width - cropSize) / 2;
      const cropY = (img.height - cropSize) / 2;

      // 生成建议
      let suggestion: 'ok' | 'adjust' | 'no-face' = 'no-face';
      let message = '未检测到人脸';

      if (mainFace) {
        const faceCenterX = mainFace.x + mainFace.width / 2;
        const faceCenterY = mainFace.y + mainFace.height / 2;

        const gridCenterX = cropX + cropSize / 2;
        const gridCenterY = cropY + cropSize / 2;

        const faceInGrid = mainFace.x >= cropX &&
          mainFace.y >= cropY &&
          mainFace.x + mainFace.width <= cropX + cropSize &&
          mainFace.y + mainFace.height <= cropY + cropSize;

        const offsetX = Math.abs(faceCenterX - gridCenterX) / cropSize;
        const offsetY = Math.abs(faceCenterY - gridCenterY * 0.85) / cropSize;

        if (!faceInGrid) {
          suggestion = 'adjust';
          message = '人脸超出九宫格显示区域，建议调整';
        } else if (offsetX > 0.2 || offsetY > 0.2) {
          suggestion = 'adjust';
          message = '人脸位置偏离中心，建议调整';
        } else {
          suggestion = 'ok';
          message = `检测到 ${faces.length} 个人脸，位置合适`;
        }
      }

      return {
        isPortrait,
        faces,
        mainFace,
        suggestion,
        message,
        gridCrop: { x: cropX, y: cropY, size: cropSize },
      };
    } catch (error) {
      console.error('Face detection error:', error);
      return {
        isPortrait: false,
        faces: [],
        mainFace: null,
        suggestion: 'no-face',
        message: '检测失败',
      };
    }
  }

  /**
   * 计算智能裁剪区域
   */
  calculateSmartCrop(
    imageWidth: number,
    imageHeight: number,
    face: FaceBox | null,
    targetRatio: number = 1 // 默认正方形
  ): CropSuggestion {
    if (!face) {
      // 没有人脸，居中裁剪
      return this.getCenterCrop(imageWidth, imageHeight, targetRatio);
    }

    // 人脸中心点
    const faceCenterX = face.x + face.width / 2;
    const faceCenterY = face.y + face.height / 2;

    // 给人脸留出足够空间（人脸上方留更多空间）
    const faceMarginTop = face.height * 0.8;
    const faceMarginBottom = face.height * 0.5;
    const faceMarginSide = face.width * 0.6;

    // 计算理想的裁剪大小（确保人脸周围有足够空间）
    const idealHeight = face.height + faceMarginTop + faceMarginBottom;
    const idealWidth = idealHeight * targetRatio;

    // 调整裁剪大小以适应图片
    let cropWidth = Math.max(idealWidth, face.width + faceMarginSide * 2);
    let cropHeight = cropWidth / targetRatio;

    // 确保不超出图片边界
    cropWidth = Math.min(cropWidth, imageWidth);
    cropHeight = Math.min(cropHeight, imageHeight);

    // 重新调整比例
    if (cropWidth / cropHeight > targetRatio) {
      cropWidth = cropHeight * targetRatio;
    } else {
      cropHeight = cropWidth / targetRatio;
    }

    // 计算裁剪位置（使人脸在黄金分割点附近）
    let cropX = faceCenterX - cropWidth / 2;
    let cropY = faceCenterY - cropHeight * 0.4; // 人脸偏上

    // 边界检查
    cropX = Math.max(0, Math.min(cropX, imageWidth - cropWidth));
    cropY = Math.max(0, Math.min(cropY, imageHeight - cropHeight));

    return {
      x: Math.round(cropX),
      y: Math.round(cropY),
      width: Math.round(cropWidth),
      height: Math.round(cropHeight),
    };
  }

  /**
   * 居中裁剪
   */
  private getCenterCrop(
    imageWidth: number,
    imageHeight: number,
    targetRatio: number
  ): CropSuggestion {
    let cropWidth: number, cropHeight: number;

    if (imageWidth / imageHeight > targetRatio) {
      cropHeight = imageHeight;
      cropWidth = cropHeight * targetRatio;
    } else {
      cropWidth = imageWidth;
      cropHeight = cropWidth / targetRatio;
    }

    return {
      x: Math.round((imageWidth - cropWidth) / 2),
      y: Math.round((imageHeight - cropHeight) / 2),
      width: Math.round(cropWidth),
      height: Math.round(cropHeight),
    };
  }

  /**
   * 应用裁剪
   */
  async applyCrop(imageData: string, crop: CropSuggestion): Promise<string> {
    const img = await this.loadImage(imageData);

    this.canvas.width = crop.width;
    this.canvas.height = crop.height;

    this.ctx.drawImage(
      img,
      crop.x, crop.y, crop.width, crop.height,
      0, 0, crop.width, crop.height
    );

    return this.canvas.toDataURL('image/jpeg', 0.95);
  }
}

// 导出单例
export const faceDetectionService = new FaceDetectionService();
