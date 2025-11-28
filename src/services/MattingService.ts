/**
 * MattingService - AI抠图服务
 * Validates: Requirements 2.1, 2.2, 2.5
 */

import { MattingResult, LayerErrorType } from '@/types';

// Dynamic import for background removal library
let removeBackground: ((image: ImageData | Blob | string) => Promise<Blob>) | null = null;

/**
 * MattingService class for AI-powered background removal
 * **Feature: 3d-layer-effect, Property 4: 抠图输出格式有效性**
 * **Feature: 3d-layer-effect, Property 5: 抠图错误处理完整性**
 */
export class MattingService {
  private isModelLoaded = false;
  private isLoading = false;
  private loadError: string | null = null;

  /**
   * Load the AI model
   * **Validates: Requirements 2.1**
   */
  async loadModel(): Promise<boolean> {
    if (this.isModelLoaded) return true;
    if (this.isLoading) return false;

    this.isLoading = true;
    this.loadError = null;

    try {
      // Dynamic import to avoid loading the large library until needed
      const bgRemoval = await import('@imgly/background-removal');
      removeBackground = bgRemoval.removeBackground;
      this.isModelLoaded = true;
      return true;
    } catch (error) {
      this.loadError = error instanceof Error ? error.message : 'Failed to load model';
      console.error('Failed to load background removal model:', error);
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return this.isModelLoaded && removeBackground !== null;
  }

  /**
   * Check if the model is currently loading
   */
  isModelLoading(): boolean {
    return this.isLoading;
  }

  /**
   * Get the last load error
   */
  getLoadError(): string | null {
    return this.loadError;
  }

  /**
   * Remove background from an image
   * **Feature: 3d-layer-effect, Property 4: 抠图输出格式有效性**
   * **Feature: 3d-layer-effect, Property 5: 抠图错误处理完整性**
   * **Validates: Requirements 2.1, 2.2, 2.5**
   */
  async removeBackground(imageData: string, timeout = 30000): Promise<MattingResult> {
    // Ensure model is loaded
    if (!this.isAvailable()) {
      const loaded = await this.loadModel();
      if (!loaded) {
        return {
          success: false,
          error: this.loadError || 'Model not available',
        };
      }
    }

    if (!removeBackground) {
      return {
        success: false,
        error: 'Background removal function not available',
      };
    }

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('MATTING_TIMEOUT')), timeout);
      });

      // Convert base64 to blob for processing
      const blob = await this.base64ToBlob(imageData);

      // Race between the actual operation and timeout
      const resultBlob = await Promise.race([removeBackground(blob), timeoutPromise]);

      // Convert result blob to base64 PNG
      const resultBase64 = await this.blobToBase64(resultBlob);

      return {
        success: true,
        imageData: resultBase64,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage === 'MATTING_TIMEOUT') {
        return {
          success: false,
          error: LayerErrorType.MATTING_TIMEOUT,
        };
      }

      return {
        success: false,
        error: `${LayerErrorType.MATTING_FAILED}: ${errorMessage}`,
      };
    }
  }

  /**
   * Convert base64 data URL to Blob
   */
  private async base64ToBlob(base64: string): Promise<Blob> {
    const response = await fetch(base64);
    return response.blob();
  }

  /**
   * Convert Blob to base64 data URL
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Check if an image has alpha channel (transparent background)
   * **Feature: 3d-layer-effect, Property 4: 抠图输出格式有效性**
   */
  async hasAlphaChannel(imageData: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(false);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        // Check if any pixel has alpha < 255
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 255) {
            resolve(true);
            return;
          }
        }

        resolve(false);
      };
      img.onerror = () => resolve(false);
      img.src = imageData;
    });
  }
}

// Export singleton instance
export const mattingService = new MattingService();
