/**
 * LayerRenderer - Canvas图层渲染器
 * Validates: Requirements 3.1, 3.2, 3.3, 4.1-4.5, 6.1, 6.5, 7.2
 */

import { Layer, LayerTransformConfig, LayerShadowConfig, LAYER_CONSTRAINTS } from '@/types';

/**
 * Render options for layer rendering
 */
export interface RenderOptions {
  width: number;
  height: number;
  quality: number; // 0-1
}

/**
 * Load an image from Base64 data
 */
function loadImage(imageData: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageData;
  });
}

/**
 * LayerRenderer class for rendering layers to canvas
 * **Feature: 3d-layer-effect, Property 16: 导出图层顺序正确性**
 */
export class LayerRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(width: number = LAYER_CONSTRAINTS.outputSize, height: number = LAYER_CONSTRAINTS.outputSize) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
  }

  /**
   * Apply transform to canvas context
   * **Validates: Requirements 3.1, 3.2, 3.3**
   */
  applyTransform(transform: LayerTransformConfig, imageWidth: number, imageHeight: number): void {
    const { x, y, scale, rotation } = transform;

    // Calculate scaled dimensions
    const scaleFactor = scale / 100;
    const scaledWidth = imageWidth * scaleFactor;
    const scaledHeight = imageHeight * scaleFactor;

    // Move to position (center of image)
    const centerX = x + scaledWidth / 2;
    const centerY = y + scaledHeight / 2;

    this.ctx.translate(centerX, centerY);
    this.ctx.rotate((rotation * Math.PI) / 180);
    this.ctx.translate(-centerX, -centerY);
  }

  /**
   * Draw shadow for a layer
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
   */
  drawShadow(
    shadow: LayerShadowConfig,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    if (!shadow.enabled) return;

    this.ctx.save();

    // Set shadow properties
    this.ctx.shadowColor = this.hexToRgba(shadow.color, shadow.opacity / 100);
    this.ctx.shadowBlur = shadow.blur;
    this.ctx.shadowOffsetX = shadow.offsetX;
    this.ctx.shadowOffsetY = shadow.offsetY;

    // Draw a rectangle to cast shadow (will be covered by the actual image)
    this.ctx.fillStyle = 'rgba(0,0,0,0.01)';
    this.ctx.fillRect(x, y, width, height);

    this.ctx.restore();
  }

  /**
   * Render a single layer
   * **Validates: Requirements 6.1, 6.5**
   */
  async renderLayer(layer: Layer): Promise<void> {
    if (!layer.visible || layer.opacity === 0) return;

    const img = await loadImage(layer.imageData);
    const { transform, shadow, opacity } = layer;

    // Calculate scaled dimensions
    const scaleFactor = transform.scale / 100;
    const scaledWidth = img.width * scaleFactor;
    const scaledHeight = img.height * scaleFactor;

    this.ctx.save();

    // Apply opacity
    this.ctx.globalAlpha = opacity / 100;

    // Apply transform
    this.applyTransform(transform, img.width, img.height);

    // Draw shadow first (behind the image)
    if (shadow.enabled) {
      this.ctx.shadowColor = this.hexToRgba(shadow.color, shadow.opacity / 100);
      this.ctx.shadowBlur = shadow.blur;
      this.ctx.shadowOffsetX = shadow.offsetX;
      this.ctx.shadowOffsetY = shadow.offsetY;
    }

    // Draw the image
    this.ctx.drawImage(img, transform.x, transform.y, scaledWidth, scaledHeight);

    this.ctx.restore();
  }

  /**
   * Render all layers in order
   * **Feature: 3d-layer-effect, Property 16: 导出图层顺序正确性**
   * **Validates: Requirements 7.2**
   */
  async render(layers: Layer[]): Promise<HTMLCanvasElement> {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Sort layers by zIndex (ascending - lower zIndex rendered first)
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

    // Render each layer in order
    for (const layer of sortedLayers) {
      await this.renderLayer(layer);
    }

    return this.canvas;
  }

  /**
   * Get the canvas element
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Get canvas as data URL
   */
  toDataURL(format: 'image/png' | 'image/jpeg' = 'image/png', quality = 0.92): string {
    return this.canvas.toDataURL(format, quality);
  }

  /**
   * Get canvas as Blob
   */
  toBlob(format: 'image/png' | 'image/jpeg' = 'image/png', quality = 0.92): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        format,
        quality
      );
    });
  }

  /**
   * Resize the canvas
   */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    // Re-acquire context after resize (canvas resize clears context state)
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context after resize');
    this.ctx = ctx;
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Fill canvas with a color
   */
  fill(color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Convert hex color to rgba
   */
  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Render layers with clipping to output size
   * **Feature: 3d-layer-effect, Property 9: 导出裁剪正方形保持**
   * **Validates: Requirements 3.5, 7.4**
   */
  async renderWithClipping(layers: Layer[], options: RenderOptions): Promise<HTMLCanvasElement> {
    // Resize canvas to target size
    this.resize(options.width, options.height);
    
    // Render all layers
    await this.render(layers);
    
    return this.canvas;
  }

  /**
   * Create a preview render (lower quality for performance)
   * **Feature: 3d-layer-effect, Property 18: 预览与导出一致性**
   * **Validates: Requirements 8.5**
   */
  async renderPreview(layers: Layer[], maxSize = 400): Promise<HTMLCanvasElement> {
    // Resize canvas to preview size
    this.resize(maxSize, maxSize);
    
    // Render all layers
    await this.render(layers);
    
    return this.canvas;
  }
}

// Export singleton instance
export const layerRenderer = new LayerRenderer();
