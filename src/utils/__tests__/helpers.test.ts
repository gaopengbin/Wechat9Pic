import { describe, it, expect, vi } from 'vitest';
import {
  generateId,
  formatFileSize,
  formatDate,
  debounce,
  deepClone,
  calculateAspectRatio,
  calculateFitDimensions,
} from '../helpers';

describe('Helper Utils', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with correct format', () => {
      const id = generateId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('formatDate', () => {
    it('should format date to Chinese locale', () => {
      const date = new Date('2024-01-15T10:30:00');
      const formatted = formatDate(date);

      expect(formatted).toContain('2024');
      expect(formatted).toContain('01');
      expect(formatted).toContain('15');
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('deepClone', () => {
    it('should create a deep copy of an object', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });
  });

  describe('calculateAspectRatio', () => {
    it('should calculate aspect ratio correctly', () => {
      expect(calculateAspectRatio(1920, 1080)).toBeCloseTo(16 / 9);
      expect(calculateAspectRatio(1000, 1000)).toBe(1);
      expect(calculateAspectRatio(800, 600)).toBeCloseTo(4 / 3);
    });
  });

  describe('calculateFitDimensions', () => {
    it('should not change dimensions if already within max size', () => {
      const result = calculateFitDimensions(800, 600, 1000);
      expect(result).toEqual({ width: 800, height: 600 });
    });

    it('should scale down width when it exceeds max size', () => {
      const result = calculateFitDimensions(2000, 1000, 1000);
      expect(result.width).toBe(1000);
      expect(result.height).toBe(500);
    });

    it('should scale down height when it exceeds max size', () => {
      const result = calculateFitDimensions(1000, 2000, 1000);
      expect(result.width).toBe(500);
      expect(result.height).toBe(1000);
    });

    it('should maintain aspect ratio', () => {
      const result = calculateFitDimensions(1920, 1080, 960);
      const originalRatio = 1920 / 1080;
      const newRatio = result.width / result.height;
      expect(newRatio).toBeCloseTo(originalRatio, 1);
    });
  });
});
