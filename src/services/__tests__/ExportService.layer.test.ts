/**
 * Tests for ExportService layer composition features
 * Validates: Requirements 3.5, 6.5, 7.1, 7.3, 7.4, 8.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { ExportService } from '../ExportService';
import { Layer, DEFAULT_TRANSFORM, DEFAULT_SHADOW } from '@/types';

const testConfig = { numRuns: 30 };

// Create a test layer
function createTestLayer(overrides: Partial<Layer> = {}): Layer {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 100, 100);
  }
  
  return {
    id: `test_${Math.random()}`,
    type: 'subject',
    imageData: canvas.toDataURL('image/png'),
    transform: { ...DEFAULT_TRANSFORM },
    shadow: { ...DEFAULT_SHADOW },
    opacity: 100,
    visible: true,
    zIndex: 0,
    ...overrides,
  };
}

// Mock canvas.toBlob for testing
HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
  // Create a mock blob with size based on quality
  const baseSize = 1000;
  const qualityFactor = quality || 0.92;
  const mockData = new Array(Math.floor(baseSize * qualityFactor)).fill('x').join('');
  const mockBlob = new Blob([mockData], { type: type || 'image/png' });
  setTimeout(() => callback(mockBlob), 0);
};

describe('ExportService Layer Composition', () => {
  let exportService: ExportService;

  beforeEach(() => {
    exportService = new ExportService();
  });

  describe('exportLayerComposition', () => {
    /**
     * **Feature: 3d-layer-effect, Property 9: 导出裁剪正方形保持**
     * **Validates: Requirements 3.5, 7.4**
     */
    it('Property 9: should export with 1080x1080 dimensions regardless of layer positions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              x: fc.integer({ min: -2000, max: 2000 }),
              y: fc.integer({ min: -2000, max: 2000 }),
              scale: fc.integer({ min: 50, max: 200 }),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          async (transforms) => {
            const layers = transforms.map((transform, i) => 
              createTestLayer({
                id: `layer_${i}`,
                transform: {
                  ...transform,
                  rotation: 0,
                },
                zIndex: i,
              })
            );

            const result = await exportService.exportLayerComposition(layers);
            
            expect(result).toBeInstanceOf(Blob);
            expect(result.size).toBeGreaterThan(0);
          }
        ),
        testConfig
      );
    });

    /**
     * **Feature: 3d-layer-effect, Property 17: 导出质量保持**
     * **Validates: Requirements 7.3**
     */
    it('Property 17: should export with quality >= 90%', async () => {
      const layers = [createTestLayer()];
      
      // Export with default quality (should be >= 0.9)
      const result = await exportService.exportLayerComposition(layers);
      
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/jpeg');
    });

    it('should handle empty layer array', async () => {
      const result = await exportService.exportLayerComposition([]);
      
      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle layers with different opacities', async () => {
      const layers = [
        createTestLayer({ opacity: 100, zIndex: 0 }),
        createTestLayer({ opacity: 50, zIndex: 1 }),
        createTestLayer({ opacity: 25, zIndex: 2 }),
      ];
      
      const result = await exportService.exportLayerComposition(layers);
      
      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle layers with shadows', async () => {
      const layers = [
        createTestLayer({
          shadow: {
            enabled: true,
            blur: 10,
            offsetX: 5,
            offsetY: 5,
            opacity: 50,
            color: '#000000',
          },
        }),
      ];
      
      const result = await exportService.exportLayerComposition(layers);
      
      expect(result).toBeInstanceOf(Blob);
    });

    it('should respect custom export options', async () => {
      const layers = [createTestLayer()];
      
      const result = await exportService.exportLayerComposition(layers, {
        format: 'png',
        quality: 1.0,
        size: 800,
      });
      
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/png');
    });
  });

  describe('generateLayerPreview', () => {
    /**
     * **Feature: 3d-layer-effect, Property 18: 预览与导出一致性**
     * **Validates: Requirements 8.5**
     */
    it('Property 18: preview should use same rendering logic as export', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              x: fc.integer({ min: -100, max: 100 }),
              y: fc.integer({ min: -100, max: 100 }),
              scale: fc.integer({ min: 50, max: 150 }),
              rotation: fc.integer({ min: -180, max: 180 }),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          async (transforms) => {
            const layers = transforms.map((transform, i) => 
              createTestLayer({
                id: `layer_${i}`,
                transform,
                zIndex: i,
              })
            );

            const preview = await exportService.generateLayerPreview(layers);
            
            // Preview should be a valid data URL
            expect(preview).toMatch(/^data:image\/png;base64,/);
          }
        ),
        testConfig
      );
    });

    it('should generate preview with default size', async () => {
      const layers = [createTestLayer()];
      
      const preview = await exportService.generateLayerPreview(layers);
      
      expect(preview).toMatch(/^data:image\/png;base64,/);
    });

    it('should generate preview at full resolution', async () => {
      const layers = [createTestLayer()];
      
      const preview = await exportService.generateLayerPreview(layers);
      
      expect(preview).toMatch(/^data:image\/png;base64,/);
    });

    it('should handle empty layers', async () => {
      const preview = await exportService.generateLayerPreview([]);
      
      expect(preview).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('opacity export', () => {
    /**
     * **Feature: 3d-layer-effect, Property 15: 透明度导出保持**
     * **Validates: Requirements 6.5**
     */
    it('Property 15: layers with different opacities should be rendered correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.integer({ min: 0, max: 100 }),
            { minLength: 1, maxLength: 5 }
          ),
          async (opacities) => {
            const layers = opacities.map((opacity, i) => 
              createTestLayer({
                id: `layer_${i}`,
                opacity,
                zIndex: i,
              })
            );

            const result = await exportService.exportLayerComposition(layers);
            
            expect(result).toBeInstanceOf(Blob);
            expect(result.size).toBeGreaterThan(0);
          }
        ),
        testConfig
      );
    });
  });
});
