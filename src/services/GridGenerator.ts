/**
 * GridGenerator - 九宫格底图生成器
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { GridConfig, LAYER_CONSTRAINTS, DEFAULT_GRID_CONFIG } from '@/types';
import { clampBorderWidth } from '@/utils/layerConstraints';

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
 * Crop an image to a square (center crop)
 * **Feature: 3d-layer-effect, Property 2: 图片裁剪正方形保持**
 * **Validates: Requirements 1.3**
 */
export async function cropToSquare(imageData: string): Promise<string> {
  const img = await loadImage(imageData);
  const size = Math.min(img.width, img.height);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Center crop
  const offsetX = (img.width - size) / 2;
  const offsetY = (img.height - size) / 2;

  ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);

  return canvas.toDataURL('image/png');
}

/**
 * Get image dimensions from Base64 data
 */
export async function getImageDimensions(
  imageData: string
): Promise<{ width: number; height: number }> {
  const img = await loadImage(imageData);
  return { width: img.width, height: img.height };
}

/**
 * Generate a 1080x1080 grid background from 9 images
 * **Feature: 3d-layer-effect, Property 1: 九宫格底图尺寸一致性**
 * **Validates: Requirements 1.1, 1.2**
 */
export async function generateGridBackground(config: Partial<GridConfig>): Promise<string> {
  const {
    images = [],
    borderWidth = DEFAULT_GRID_CONFIG.borderWidth,
    borderColor = DEFAULT_GRID_CONFIG.borderColor,
    outputSize = LAYER_CONSTRAINTS.outputSize,
  } = config;

  // Validate and clamp border width
  const clampedBorderWidth = clampBorderWidth(borderWidth);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Fill background with border color
  ctx.fillStyle = borderColor;
  ctx.fillRect(0, 0, outputSize, outputSize);

  // Calculate cell size (accounting for borders)
  // Total border space: 4 borders (outer + 2 inner) = 4 * borderWidth
  const totalBorderSpace = clampedBorderWidth * 4;
  const cellSize = (outputSize - totalBorderSpace) / 3;

  // Draw each image in the grid
  for (let i = 0; i < 9; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;

    // Calculate position (with border offset)
    const x = clampedBorderWidth + col * (cellSize + clampedBorderWidth);
    const y = clampedBorderWidth + row * (cellSize + clampedBorderWidth);

    if (images[i]) {
      try {
        // Crop image to square first
        const squareImage = await cropToSquare(images[i]);
        const img = await loadImage(squareImage);

        // Draw image scaled to cell size
        ctx.drawImage(img, x, y, cellSize, cellSize);
      } catch (error) {
        // If image fails to load, fill with placeholder color
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    } else {
      // Empty cell - fill with light gray
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(x, y, cellSize, cellSize);
    }
  }

  return canvas.toDataURL('image/png');
}

/**
 * GridGenerator class for managing grid generation
 */
export class GridGenerator {
  private config: GridConfig;

  constructor(config?: Partial<GridConfig>) {
    this.config = {
      images: config?.images || [],
      borderWidth: clampBorderWidth(config?.borderWidth ?? DEFAULT_GRID_CONFIG.borderWidth),
      borderColor: config?.borderColor || DEFAULT_GRID_CONFIG.borderColor,
      outputSize: config?.outputSize || LAYER_CONSTRAINTS.outputSize,
    };
  }

  /**
   * Set images for the grid
   */
  setImages(images: string[]): void {
    this.config.images = images.slice(0, 9);
  }

  /**
   * Set border width
   */
  setBorderWidth(width: number): void {
    this.config.borderWidth = clampBorderWidth(width);
  }

  /**
   * Set border color
   */
  setBorderColor(color: string): void {
    this.config.borderColor = color;
  }

  /**
   * Get current configuration
   */
  getConfig(): GridConfig {
    return { ...this.config };
  }

  /**
   * Generate the grid background
   */
  async generate(): Promise<string> {
    return generateGridBackground(this.config);
  }

  /**
   * Generate grid background with images and options
   * Convenience method that accepts images array and options separately
   */
  async generateGridBackground(
    images: string[],
    options?: { borderWidth?: number; borderColor?: string }
  ): Promise<{ success: boolean; imageData?: string; error?: string }> {
    try {
      this.setImages(images);
      if (options?.borderWidth !== undefined) {
        this.setBorderWidth(options.borderWidth);
      }
      if (options?.borderColor !== undefined) {
        this.setBorderColor(options.borderColor);
      }
      const imageData = await this.generate();
      return { success: true, imageData };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate grid',
      };
    }
  }

  /**
   * Crop a single image to square
   */
  async cropToSquare(imageData: string): Promise<string> {
    return cropToSquare(imageData);
  }
}

// Export singleton instance
export const gridGenerator = new GridGenerator();
