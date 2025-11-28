/**
 * Property-based tests for layer constraint utilities
 * Uses fast-check for property testing with 100 iterations
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  clampScale,
  clampRotation,
  clampOpacity,
  clampBorderWidth,
  clampShadowParams,
} from '../layerConstraints';
import { LAYER_CONSTRAINTS } from '@/types';

const testConfig = { numRuns: 100 };

describe('Layer Constraints Property Tests', () => {
  /**
   * **Feature: 3d-layer-effect, Property 7: 缩放范围约束**
   * **Validates: Requirements 3.2**
   */
  it('Property 7: clampScale should constrain values to 10-300% range', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1000, max: 1000 }), (inputScale) => {
        const result = clampScale(inputScale);
        expect(result).toBeGreaterThanOrEqual(LAYER_CONSTRAINTS.scale.min);
        expect(result).toBeLessThanOrEqual(LAYER_CONSTRAINTS.scale.max);
      }),
      testConfig
    );
  });

  /**
   * **Feature: 3d-layer-effect, Property 8: 旋转范围约束**
   * **Validates: Requirements 3.3**
   */
  it('Property 8: clampRotation should constrain values to -180 to 180 degrees', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1000, max: 1000 }), (inputRotation) => {
        const result = clampRotation(inputRotation);
        expect(result).toBeGreaterThanOrEqual(LAYER_CONSTRAINTS.rotation.min);
        expect(result).toBeLessThanOrEqual(LAYER_CONSTRAINTS.rotation.max);
      }),
      testConfig
    );
  });

  /**
   * **Feature: 3d-layer-effect, Property 14: 透明度范围约束**
   * **Validates: Requirements 6.1**
   */
  it('Property 14: clampOpacity should constrain values to 0-100% range', () => {
    fc.assert(
      fc.property(fc.integer({ min: -200, max: 200 }), (inputOpacity) => {
        const result = clampOpacity(inputOpacity);
        expect(result).toBeGreaterThanOrEqual(LAYER_CONSTRAINTS.opacity.min);
        expect(result).toBeLessThanOrEqual(LAYER_CONSTRAINTS.opacity.max);
      }),
      testConfig
    );
  });

  /**
   * **Feature: 3d-layer-effect, Property 3: 边框宽度范围约束**
   * **Validates: Requirements 1.4**
   */
  it('Property 3: clampBorderWidth should constrain values to 1-10px range', () => {
    fc.assert(
      fc.property(fc.integer({ min: -100, max: 100 }), (inputWidth) => {
        const result = clampBorderWidth(inputWidth);
        expect(result).toBeGreaterThanOrEqual(LAYER_CONSTRAINTS.borderWidth.min);
        expect(result).toBeLessThanOrEqual(LAYER_CONSTRAINTS.borderWidth.max);
      }),
      testConfig
    );
  });

  /**
   * **Feature: 3d-layer-effect, Property 10: 阴影参数范围约束**
   * **Validates: Requirements 4.2, 4.3, 4.4**
   */
  it('Property 10: clampShadowParams should constrain all shadow parameters', () => {
    fc.assert(
      fc.property(
        fc.record({
          enabled: fc.boolean(),
          blur: fc.integer({ min: -100, max: 100 }),
          offsetX: fc.integer({ min: -200, max: 200 }),
          offsetY: fc.integer({ min: -200, max: 200 }),
          opacity: fc.integer({ min: -100, max: 200 }),
          color: fc.hexaString({ minLength: 6, maxLength: 6 }).map((s) => `#${s}`),
        }),
        (inputShadow) => {
          const result = clampShadowParams(inputShadow);

          // Blur should be in range
          expect(result.blur).toBeGreaterThanOrEqual(LAYER_CONSTRAINTS.shadowBlur.min);
          expect(result.blur).toBeLessThanOrEqual(LAYER_CONSTRAINTS.shadowBlur.max);

          // OffsetX should be in range
          expect(result.offsetX).toBeGreaterThanOrEqual(LAYER_CONSTRAINTS.shadowOffset.min);
          expect(result.offsetX).toBeLessThanOrEqual(LAYER_CONSTRAINTS.shadowOffset.max);

          // OffsetY should be in range
          expect(result.offsetY).toBeGreaterThanOrEqual(LAYER_CONSTRAINTS.shadowOffset.min);
          expect(result.offsetY).toBeLessThanOrEqual(LAYER_CONSTRAINTS.shadowOffset.max);

          // Opacity should be in range
          expect(result.opacity).toBeGreaterThanOrEqual(LAYER_CONSTRAINTS.opacity.min);
          expect(result.opacity).toBeLessThanOrEqual(LAYER_CONSTRAINTS.opacity.max);
        }
      ),
      testConfig
    );
  });

  // Unit tests for edge cases
  describe('Edge Cases', () => {
    it('clampScale preserves values within range', () => {
      expect(clampScale(50)).toBe(50);
      expect(clampScale(100)).toBe(100);
      expect(clampScale(200)).toBe(200);
    });

    it('clampScale clamps values outside range', () => {
      expect(clampScale(5)).toBe(10);
      expect(clampScale(0)).toBe(10);
      expect(clampScale(-100)).toBe(10);
      expect(clampScale(400)).toBe(300);
      expect(clampScale(1000)).toBe(300);
    });

    it('clampRotation preserves values within range', () => {
      expect(clampRotation(0)).toBe(0);
      expect(clampRotation(90)).toBe(90);
      expect(clampRotation(-90)).toBe(-90);
    });

    it('clampRotation clamps values outside range', () => {
      expect(clampRotation(-200)).toBe(-180);
      expect(clampRotation(200)).toBe(180);
    });

    it('clampOpacity handles boundary values', () => {
      expect(clampOpacity(0)).toBe(0);
      expect(clampOpacity(100)).toBe(100);
      expect(clampOpacity(-10)).toBe(0);
      expect(clampOpacity(150)).toBe(100);
    });

    it('clampBorderWidth handles boundary values', () => {
      expect(clampBorderWidth(1)).toBe(1);
      expect(clampBorderWidth(10)).toBe(10);
      expect(clampBorderWidth(0)).toBe(1);
      expect(clampBorderWidth(20)).toBe(10);
    });

    it('clampShadowParams provides defaults for missing values', () => {
      const result = clampShadowParams({});
      expect(result.enabled).toBe(false);
      expect(result.blur).toBe(10);
      expect(result.offsetX).toBe(5);
      expect(result.offsetY).toBe(5);
      expect(result.opacity).toBe(50);
      expect(result.color).toBe('#000000');
    });
  });
});
