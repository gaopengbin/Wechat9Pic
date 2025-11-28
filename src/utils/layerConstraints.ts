/**
 * Layer parameter constraint utilities
 * Validates: Requirements 1.4, 3.2, 3.3, 4.2, 4.3, 4.4, 6.1
 */

import { LAYER_CONSTRAINTS, LayerShadowConfig } from '@/types';

/**
 * Clamp a value to a specified range
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Clamp scale value to 10-300% range
 * **Feature: 3d-layer-effect, Property 7: 缩放范围约束**
 * **Validates: Requirements 3.2**
 */
export function clampScale(value: number): number {
  return clamp(value, LAYER_CONSTRAINTS.scale.min, LAYER_CONSTRAINTS.scale.max);
}

/**
 * Clamp rotation value to -180 to 180 degrees
 * **Feature: 3d-layer-effect, Property 8: 旋转范围约束**
 * **Validates: Requirements 3.3**
 */
export function clampRotation(value: number): number {
  return clamp(value, LAYER_CONSTRAINTS.rotation.min, LAYER_CONSTRAINTS.rotation.max);
}

/**
 * Clamp opacity value to 0-100%
 * **Feature: 3d-layer-effect, Property 14: 透明度范围约束**
 * **Validates: Requirements 6.1**
 */
export function clampOpacity(value: number): number {
  return clamp(value, LAYER_CONSTRAINTS.opacity.min, LAYER_CONSTRAINTS.opacity.max);
}

/**
 * Clamp border width to 1-10px
 * **Feature: 3d-layer-effect, Property 3: 边框宽度范围约束**
 * **Validates: Requirements 1.4**
 */
export function clampBorderWidth(value: number): number {
  return clamp(value, LAYER_CONSTRAINTS.borderWidth.min, LAYER_CONSTRAINTS.borderWidth.max);
}

/**
 * Clamp shadow parameters to valid ranges
 * **Feature: 3d-layer-effect, Property 10: 阴影参数范围约束**
 * **Validates: Requirements 4.2, 4.3, 4.4**
 */
export function clampShadowParams(shadow: Partial<LayerShadowConfig>): LayerShadowConfig {
  return {
    enabled: shadow.enabled ?? false,
    blur: clamp(shadow.blur ?? 10, LAYER_CONSTRAINTS.shadowBlur.min, LAYER_CONSTRAINTS.shadowBlur.max),
    offsetX: clamp(shadow.offsetX ?? 5, LAYER_CONSTRAINTS.shadowOffset.min, LAYER_CONSTRAINTS.shadowOffset.max),
    offsetY: clamp(shadow.offsetY ?? 5, LAYER_CONSTRAINTS.shadowOffset.min, LAYER_CONSTRAINTS.shadowOffset.max),
    opacity: clamp(shadow.opacity ?? 50, LAYER_CONSTRAINTS.opacity.min, LAYER_CONSTRAINTS.opacity.max),
    color: shadow.color ?? '#000000',
  };
}

/**
 * Validate if a value is within scale range
 */
export function isValidScale(value: number): boolean {
  return value >= LAYER_CONSTRAINTS.scale.min && value <= LAYER_CONSTRAINTS.scale.max;
}

/**
 * Validate if a value is within rotation range
 */
export function isValidRotation(value: number): boolean {
  return value >= LAYER_CONSTRAINTS.rotation.min && value <= LAYER_CONSTRAINTS.rotation.max;
}

/**
 * Validate if a value is within opacity range
 */
export function isValidOpacity(value: number): boolean {
  return value >= LAYER_CONSTRAINTS.opacity.min && value <= LAYER_CONSTRAINTS.opacity.max;
}

/**
 * Validate if a value is within border width range
 */
export function isValidBorderWidth(value: number): boolean {
  return value >= LAYER_CONSTRAINTS.borderWidth.min && value <= LAYER_CONSTRAINTS.borderWidth.max;
}
