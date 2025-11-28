/**
 * CanvasRenderer - Canvas渲染和效果应用
 * Validates: Requirements 3.3, 4.4, 8.2, 8.3, 8.4
 */

import type { ImageData, EffectConfig, FilterConfig, BorderConfig } from '@/types';
import { loadImage } from '@/utils/helpers';
import { applyFilter } from '@/utils/imageProcessing';

export class CanvasRenderer {
  /**
   * 应用效果到图片
   * Validates: Requirements 3.3, 3.4
   */
  async applyEffects(imageData: ImageData, effects: EffectConfig): Promise<string> {
    // 加载图片
    const img = await loadImage(imageData.fullSize);

    // 创建canvas
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法创建canvas上下文');

    // 绘制原图
    ctx.drawImage(img, 0, 0);

    // 应用滤镜
    if (effects.filter) {
      this.applyFilterToCanvas(canvas, effects.filter);
    }

    // 应用边框
    if (effects.border?.enabled) {
      this.applyBorderToCanvas(canvas, effects.border);
    }

    // 应用3D变换（简化版：添加阴影效果）
    if (effects.transform3D?.enabled && effects.transform3D.shadows.enabled) {
      this.applyShadowEffect(canvas, effects.transform3D.shadows);
    }

    return canvas.toDataURL('image/png');
  }

  /**
   * 应用滤镜到Canvas
   * Validates: Requirements 8.2
   */
  private applyFilterToCanvas(canvas: HTMLCanvasElement, filter: FilterConfig): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 应用预设滤镜
    if (filter.preset) {
      this.applyPresetFilter(ctx, canvas.width, canvas.height, filter.preset);
    }

    // 应用自定义滤镜参数
    applyFilter(canvas, {
      brightness: filter.brightness,
      contrast: filter.contrast,
      saturation: filter.saturation,
    });
  }

  /**
   * 应用预设滤镜
   */
  private applyPresetFilter(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    preset: string
  ): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    switch (preset) {
      case 'vintage':
        // 复古效果：降低饱和度，增加棕色调
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = avg * 1.1; // R
          data[i + 1] = avg * 0.95; // G
          data[i + 2] = avg * 0.8; // B
        }
        break;

      case 'blackwhite':
        // 黑白效果
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = avg;
          data[i + 1] = avg;
          data[i + 2] = avg;
        }
        break;

      case 'sepia':
        // 棕褐色效果
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
          data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
          data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
        }
        break;

      case 'warm':
        // 暖色调
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.1); // 增加红色
          data[i + 1] = Math.min(255, data[i + 1] * 1.05); // 略增绿色
          data[i + 2] = Math.max(0, data[i + 2] * 0.9); // 减少蓝色
        }
        break;

      case 'cool':
        // 冷色调
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.max(0, data[i] * 0.9); // 减少红色
          data[i + 1] = Math.min(255, data[i + 1] * 1.05); // 略增绿色
          data[i + 2] = Math.min(255, data[i + 2] * 1.1); // 增加蓝色
        }
        break;

      case 'vivid':
        // 鲜艳效果：增加饱和度
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const avg = (r + g + b) / 3;
          data[i] = Math.min(255, avg + (r - avg) * 1.5);
          data[i + 1] = Math.min(255, avg + (g - avg) * 1.5);
          data[i + 2] = Math.min(255, avg + (b - avg) * 1.5);
        }
        break;

      case 'soft':
        // 柔和效果：轻微模糊
        this.applySoftEffect(ctx, width, height);
        return; // 已经应用了效果，直接返回

      case 'dramatic':
        // 戏剧效果：高对比度
        for (let i = 0; i < data.length; i += 4) {
          data[i] = data[i] < 128 ? data[i] * 0.7 : Math.min(255, data[i] * 1.3);
          data[i + 1] = data[i + 1] < 128 ? data[i + 1] * 0.7 : Math.min(255, data[i + 1] * 1.3);
          data[i + 2] = data[i + 2] < 128 ? data[i + 2] * 0.7 : Math.min(255, data[i + 2] * 1.3);
        }
        break;

      case 'fresh':
        // 清新效果：增加亮度和绿色
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.05);
          data[i + 1] = Math.min(255, data[i + 1] * 1.15);
          data[i + 2] = Math.min(255, data[i + 2] * 1.05);
        }
        break;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * 应用柔和效果（简单模糊）
   */
  private applySoftEffect(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const tempData = new Uint8ClampedArray(data);

    // 简单的3x3盒式模糊
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const idx = ((y + dy) * width + (x + dx)) * 4 + c;
              sum += tempData[idx];
            }
          }
          const idx = (y * width + x) * 4 + c;
          data[idx] = sum / 9;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * 应用边框到Canvas
   * Validates: Requirements 8.4
   */
  private applyBorderToCanvas(canvas: HTMLCanvasElement, border: BorderConfig): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = border.color;
    ctx.lineWidth = border.width;

    switch (border.style) {
      case 'solid':
        ctx.strokeRect(
          border.width / 2,
          border.width / 2,
          canvas.width - border.width,
          canvas.height - border.width
        );
        break;

      case 'gradient':
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, border.color);
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(1, border.color);
        ctx.strokeStyle = gradient;
        ctx.strokeRect(
          border.width / 2,
          border.width / 2,
          canvas.width - border.width,
          canvas.height - border.width
        );
        break;

      case 'pattern':
        // 虚线边框
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(
          border.width / 2,
          border.width / 2,
          canvas.width - border.width,
          canvas.height - border.width
        );
        ctx.setLineDash([]);
        break;
    }
  }

  /**
   * 应用阴影效果（模拟3D深度）
   */
  private applyShadowEffect(
    canvas: HTMLCanvasElement,
    shadowConfig: { blur: number; opacity: number; offsetX: number; offsetY: number }
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 创建临时canvas保存原图
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(canvas, 0, 0);

    // 清空原canvas并绘制阴影
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.shadowColor = `rgba(0, 0, 0, ${shadowConfig.opacity})`;
    ctx.shadowBlur = shadowConfig.blur;
    ctx.shadowOffsetX = shadowConfig.offsetX;
    ctx.shadowOffsetY = shadowConfig.offsetY;

    // 绘制图片（带阴影）
    ctx.drawImage(tempCanvas, 0, 0);

    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  /**
   * 批量应用效果
   */
  async applyEffectsBatch(
    images: ImageData[],
    effects: EffectConfig,
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      try {
        const processed = await this.applyEffects(image, effects);
        results.set(image.id, processed);
      } catch (error) {
        console.error(`Failed to process image ${image.id}:`, error);
        // 失败时使用原图
        results.set(image.id, image.fullSize);
      }

      if (onProgress) {
        onProgress(i + 1, images.length);
      }
    }

    return results;
  }
}

// 导出单例实例
export const canvasRenderer = new CanvasRenderer();
