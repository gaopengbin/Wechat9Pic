/**
 * Tests for LayerManager
 * Validates: Requirements 3.1, 3.2, 3.3, 5.1, 5.4, 5.5, 6.1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { LayerManager } from '../LayerManager';
import { LAYER_CONSTRAINTS } from '@/types';

const testConfig = { numRuns: 100 };

describe('LayerManager', () => {
  let manager: LayerManager;

  beforeEach(() => {
    manager = new LayerManager();
  });

  describe('addLayer', () => {
    /**
     * **Feature: 3d-layer-effect, Property 11: 图层数量限制**
     * **Validates: Requirements 5.1**
     */
    it('Property 11: should limit layers to maximum 5', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), (numLayers) => {
          const mgr = new LayerManager();

          for (let i = 0; i < numLayers; i++) {
            mgr.addLayer('data:image/png;base64,mock', 'subject');
          }

          expect(mgr.getLayerCount()).toBeLessThanOrEqual(LAYER_CONSTRAINTS.maxLayers);
        }),
        testConfig
      );
    });

    it('should add layer successfully when under limit', () => {
      const layer = manager.addLayer('data:image/png;base64,mock', 'subject');

      expect(layer).not.toBeNull();
      expect(layer?.type).toBe('subject');
      expect(manager.getLayerCount()).toBe(1);
    });

    it('should return null when max layers reached', () => {
      // Add 5 layers
      for (let i = 0; i < 5; i++) {
        manager.addLayer('data:image/png;base64,mock', 'subject');
      }

      // Try to add 6th layer
      const result = manager.addLayer('data:image/png;base64,mock', 'subject');

      expect(result).toBeNull();
      expect(manager.getLayerCount()).toBe(5);
    });

    it('should assign correct zIndex to new layers', () => {
      manager.addLayer('data:image/png;base64,mock1', 'background');
      manager.addLayer('data:image/png;base64,mock2', 'subject');
      manager.addLayer('data:image/png;base64,mock3', 'subject');

      const layers = manager.getLayers();
      expect(layers[0].zIndex).toBe(0);
      expect(layers[1].zIndex).toBe(1);
      expect(layers[2].zIndex).toBe(2);
    });
  });

  describe('removeLayer', () => {
    /**
     * **Feature: 3d-layer-effect, Property 12: 图层删除完整性**
     * **Validates: Requirements 5.4**
     */
    it('Property 12: should decrease layer count by 1 after removal', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 5 }), (numLayers) => {
          const mgr = new LayerManager();
          const layerIds: string[] = [];

          // Add layers
          for (let i = 0; i < numLayers; i++) {
            const layer = mgr.addLayer('data:image/png;base64,mock', 'subject');
            if (layer) layerIds.push(layer.id);
          }

          const initialCount = mgr.getLayerCount();

          // Remove first layer
          if (layerIds.length > 0) {
            mgr.removeLayer(layerIds[0]);
            expect(mgr.getLayerCount()).toBe(initialCount - 1);
          }
        }),
        testConfig
      );
    });

    it('should remove layer and update zIndex', () => {
      manager.addLayer('data:image/png;base64,mock1', 'subject');
      const layer2 = manager.addLayer('data:image/png;base64,mock2', 'subject');
      manager.addLayer('data:image/png;base64,mock3', 'subject');

      manager.removeLayer(layer2!.id);

      const layers = manager.getLayers();
      expect(layers.length).toBe(2);
      expect(layers[0].zIndex).toBe(0);
      expect(layers[1].zIndex).toBe(1);
    });

    it('should return false for non-existent layer', () => {
      const result = manager.removeLayer('non-existent-id');
      expect(result).toBe(false);
    });

    it('should preserve other layers after removal', () => {
      const layer1 = manager.addLayer('data:image/png;base64,mock1', 'subject');
      const layer2 = manager.addLayer('data:image/png;base64,mock2', 'subject');
      const layer3 = manager.addLayer('data:image/png;base64,mock3', 'subject');

      manager.removeLayer(layer2!.id);

      const layers = manager.getLayers();
      expect(layers.find((l) => l.id === layer1!.id)).toBeDefined();
      expect(layers.find((l) => l.id === layer2!.id)).toBeUndefined();
      expect(layers.find((l) => l.id === layer3!.id)).toBeDefined();
    });
  });

  describe('reorderLayers', () => {
    /**
     * **Feature: 3d-layer-effect, Property 13: 图层顺序调整一致性**
     * **Validates: Requirements 5.5**
     */
    it('Property 13: should preserve all layers after reordering', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          fc.integer({ min: 0, max: 4 }),
          fc.integer({ min: 0, max: 4 }),
          (numLayers, from, to) => {
            const mgr = new LayerManager();
            const layerIds: string[] = [];

            // Add layers
            for (let i = 0; i < numLayers; i++) {
              const layer = mgr.addLayer('data:image/png;base64,mock', 'subject');
              if (layer) layerIds.push(layer.id);
            }

            const initialCount = mgr.getLayerCount();
            const validFrom = from % numLayers;
            const validTo = to % numLayers;

            mgr.reorderLayers(validFrom, validTo);

            // Count should remain the same
            expect(mgr.getLayerCount()).toBe(initialCount);

            // All original layers should still exist
            for (const id of layerIds) {
              expect(mgr.getLayerById(id)).not.toBeNull();
            }
          }
        ),
        testConfig
      );
    });

    it('should reorder layers correctly', () => {
      const layer1 = manager.addLayer('data:image/png;base64,mock1', 'subject');
      const layer2 = manager.addLayer('data:image/png;base64,mock2', 'subject');
      const layer3 = manager.addLayer('data:image/png;base64,mock3', 'subject');

      manager.reorderLayers(0, 2);

      const layers = manager.getLayers();
      expect(layers[0].id).toBe(layer2!.id);
      expect(layers[1].id).toBe(layer3!.id);
      expect(layers[2].id).toBe(layer1!.id);
    });

    it('should return false for invalid indices', () => {
      manager.addLayer('data:image/png;base64,mock', 'subject');

      expect(manager.reorderLayers(-1, 0)).toBe(false);
      expect(manager.reorderLayers(0, 10)).toBe(false);
    });
  });

  describe('updateLayer', () => {
    /**
     * **Feature: 3d-layer-effect, Property 6: 主体位置无边界限制**
     * **Validates: Requirements 3.1**
     */
    it('Property 6: should allow any position values including negative', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10000, max: 10000 }),
          fc.integer({ min: -10000, max: 10000 }),
          (x, y) => {
            const mgr = new LayerManager();
            const layer = mgr.addLayer('data:image/png;base64,mock', 'subject');

            mgr.updateLayer(layer!.id, {
              transform: { x, y, scale: 100, rotation: 0 },
            });

            const updated = mgr.getLayerById(layer!.id);
            expect(updated?.transform.x).toBe(x);
            expect(updated?.transform.y).toBe(y);
          }
        ),
        testConfig
      );
    });

    it('should clamp scale values', () => {
      const layer = manager.addLayer('data:image/png;base64,mock', 'subject');

      manager.updateLayer(layer!.id, {
        transform: { x: 0, y: 0, scale: 500, rotation: 0 },
      });

      const updated = manager.getLayerById(layer!.id);
      expect(updated?.transform.scale).toBe(300);
    });

    it('should clamp rotation values', () => {
      const layer = manager.addLayer('data:image/png;base64,mock', 'subject');

      manager.updateLayer(layer!.id, {
        transform: { x: 0, y: 0, scale: 100, rotation: 360 },
      });

      const updated = manager.getLayerById(layer!.id);
      expect(updated?.transform.rotation).toBe(180);
    });

    it('should clamp opacity values', () => {
      const layer = manager.addLayer('data:image/png;base64,mock', 'subject');

      manager.updateLayer(layer!.id, { opacity: 150 });

      const updated = manager.getLayerById(layer!.id);
      expect(updated?.opacity).toBe(100);
    });

    it('should return null for non-existent layer', () => {
      const result = manager.updateLayer('non-existent', { opacity: 50 });
      expect(result).toBeNull();
    });
  });

  describe('utility methods', () => {
    it('canAddLayer should return correct value', () => {
      expect(manager.canAddLayer()).toBe(true);

      for (let i = 0; i < 5; i++) {
        manager.addLayer('data:image/png;base64,mock', 'subject');
      }

      expect(manager.canAddLayer()).toBe(false);
    });

    it('clearLayers should remove all layers', () => {
      manager.addLayer('data:image/png;base64,mock1', 'subject');
      manager.addLayer('data:image/png;base64,mock2', 'subject');

      manager.clearLayers();

      expect(manager.getLayerCount()).toBe(0);
    });

    it('getLayersSortedByZIndex should return sorted layers', () => {
      manager.addLayer('data:image/png;base64,mock1', 'subject');
      manager.addLayer('data:image/png;base64,mock2', 'subject');
      manager.addLayer('data:image/png;base64,mock3', 'subject');

      const sorted = manager.getLayersSortedByZIndex();

      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].zIndex).toBeLessThan(sorted[i + 1].zIndex);
      }
    });

    it('duplicateLayer should create a copy', () => {
      const layer = manager.addLayer('data:image/png;base64,mock', 'subject');
      manager.updateLayer(layer!.id, { opacity: 75 });

      const duplicate = manager.duplicateLayer(layer!.id);

      expect(duplicate).not.toBeNull();
      expect(duplicate?.id).not.toBe(layer!.id);
      expect(duplicate?.opacity).toBe(75);
      expect(manager.getLayerCount()).toBe(2);
    });
  });
});
