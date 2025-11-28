/**
 * LayerManager - 图层管理器
 * Validates: Requirements 3.1, 3.2, 3.3, 4.1-4.5, 5.1, 5.4, 5.5, 6.1
 */

import {
  Layer,
  LayerType,
  LAYER_CONSTRAINTS,
  DEFAULT_TRANSFORM,
  DEFAULT_SHADOW,
} from '@/types';
import { clampScale, clampRotation, clampOpacity, clampShadowParams } from '@/utils/layerConstraints';

/**
 * Generate a unique ID for layers
 */
function generateId(): string {
  return `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * LayerManager class for managing layers
 * **Feature: 3d-layer-effect, Property 11: 图层数量限制**
 * **Feature: 3d-layer-effect, Property 12: 图层删除完整性**
 * **Feature: 3d-layer-effect, Property 13: 图层顺序调整一致性**
 */
export class LayerManager {
  private layers: Layer[] = [];

  /**
   * Add a new layer
   * **Feature: 3d-layer-effect, Property 11: 图层数量限制**
   * **Validates: Requirements 5.1**
   */
  addLayer(imageData: string, type: LayerType): Layer | null {
    // Check max layers limit
    if (this.layers.length >= LAYER_CONSTRAINTS.maxLayers) {
      console.warn(`Cannot add layer: maximum ${LAYER_CONSTRAINTS.maxLayers} layers reached`);
      return null;
    }

    const newLayer: Layer = {
      id: generateId(),
      type,
      imageData,
      transform: { ...DEFAULT_TRANSFORM },
      shadow: { ...DEFAULT_SHADOW },
      opacity: 100,
      visible: true,
      zIndex: this.layers.length,
    };

    this.layers.push(newLayer);
    return newLayer;
  }

  /**
   * Remove a layer by ID
   * **Feature: 3d-layer-effect, Property 12: 图层删除完整性**
   * **Validates: Requirements 5.4**
   */
  removeLayer(layerId: string): boolean {
    const index = this.layers.findIndex((l) => l.id === layerId);
    if (index === -1) return false;

    this.layers.splice(index, 1);

    // Update zIndex for remaining layers
    this.layers.forEach((layer, i) => {
      layer.zIndex = i;
    });

    return true;
  }

  /**
   * Reorder layers
   * **Feature: 3d-layer-effect, Property 13: 图层顺序调整一致性**
   * **Validates: Requirements 5.5**
   */
  reorderLayers(fromIndex: number, toIndex: number): boolean {
    if (
      fromIndex < 0 ||
      fromIndex >= this.layers.length ||
      toIndex < 0 ||
      toIndex >= this.layers.length
    ) {
      return false;
    }

    const [movedLayer] = this.layers.splice(fromIndex, 1);
    this.layers.splice(toIndex, 0, movedLayer);

    // Update zIndex for all layers
    this.layers.forEach((layer, i) => {
      layer.zIndex = i;
    });

    return true;
  }

  /**
   * Update a layer's properties
   * **Feature: 3d-layer-effect, Property 6: 主体位置无边界限制**
   * **Validates: Requirements 3.1, 3.2, 3.3, 4.1-4.5, 6.1**
   */
  updateLayer(layerId: string, updates: Partial<Layer>): Layer | null {
    const layer = this.layers.find((l) => l.id === layerId);
    if (!layer) return null;

    // Apply updates with constraints
    if (updates.transform) {
      layer.transform = {
        // Position has no boundary limits (Property 6)
        x: updates.transform.x ?? layer.transform.x,
        y: updates.transform.y ?? layer.transform.y,
        // Scale and rotation are clamped
        scale: clampScale(updates.transform.scale ?? layer.transform.scale),
        rotation: clampRotation(updates.transform.rotation ?? layer.transform.rotation),
      };
    }

    if (updates.shadow !== undefined) {
      layer.shadow = clampShadowParams(updates.shadow);
    }

    if (updates.opacity !== undefined) {
      layer.opacity = clampOpacity(updates.opacity);
    }

    if (updates.visible !== undefined) {
      layer.visible = updates.visible;
    }

    if (updates.imageData !== undefined) {
      layer.imageData = updates.imageData;
    }

    return layer;
  }

  /**
   * Get all layers
   */
  getLayers(): Layer[] {
    return [...this.layers];
  }

  /**
   * Get layers sorted by zIndex (for rendering)
   */
  getLayersSortedByZIndex(): Layer[] {
    return [...this.layers].sort((a, b) => a.zIndex - b.zIndex);
  }

  /**
   * Get a layer by ID
   */
  getLayerById(layerId: string): Layer | null {
    return this.layers.find((l) => l.id === layerId) || null;
  }

  /**
   * Get layer count
   */
  getLayerCount(): number {
    return this.layers.length;
  }

  /**
   * Check if can add more layers
   */
  canAddLayer(): boolean {
    return this.layers.length < LAYER_CONSTRAINTS.maxLayers;
  }

  /**
   * Clear all layers
   */
  clearLayers(): void {
    this.layers = [];
  }

  /**
   * Move layer up (increase zIndex)
   */
  moveLayerUp(layerId: string): boolean {
    const index = this.layers.findIndex((l) => l.id === layerId);
    if (index === -1 || index >= this.layers.length - 1) return false;
    return this.reorderLayers(index, index + 1);
  }

  /**
   * Move layer down (decrease zIndex)
   */
  moveLayerDown(layerId: string): boolean {
    const index = this.layers.findIndex((l) => l.id === layerId);
    if (index <= 0) return false;
    return this.reorderLayers(index, index - 1);
  }

  /**
   * Duplicate a layer
   */
  duplicateLayer(layerId: string): Layer | null {
    const layer = this.getLayerById(layerId);
    if (!layer) return null;

    if (!this.canAddLayer()) return null;

    const newLayer: Layer = {
      ...layer,
      id: generateId(),
      transform: { ...layer.transform },
      shadow: { ...layer.shadow },
      zIndex: this.layers.length,
    };

    this.layers.push(newLayer);
    return newLayer;
  }
}

// Export singleton instance
export const layerManager = new LayerManager();
