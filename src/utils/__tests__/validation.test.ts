import { describe, it, expect } from 'vitest';
import {
  isValidImageFile,
  isValidFileSize,
  isValidPosition,
  isValidContentType,
  clampEffectValue,
  isInRange,
  isValidDimensions,
  hasValidExtension,
  getFileExtension,
  isValidProjectName,
} from '../validation';
import { MAX_FILE_SIZE } from '@/types/constants';

describe('Validation Utils', () => {
  describe('isValidImageFile', () => {
    it('should accept valid image formats', () => {
      const jpgFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File([''], 'test.png', { type: 'image/png' });
      const webpFile = new File([''], 'test.webp', { type: 'image/webp' });

      expect(isValidImageFile(jpgFile)).toBe(true);
      expect(isValidImageFile(pngFile)).toBe(true);
      expect(isValidImageFile(webpFile)).toBe(true);
    });

    it('should reject invalid formats', () => {
      const txtFile = new File([''], 'test.txt', { type: 'text/plain' });
      const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });

      expect(isValidImageFile(txtFile)).toBe(false);
      expect(isValidImageFile(pdfFile)).toBe(false);
    });
  });

  describe('isValidFileSize', () => {
    it('should accept files within size limit', () => {
      const smallFile = new File(['x'.repeat(1000)], 'small.jpg', { type: 'image/jpeg' });
      expect(isValidFileSize(smallFile)).toBe(true);
    });

    it('should reject files exceeding size limit', () => {
      const largeFile = new File(['x'.repeat(MAX_FILE_SIZE + 1)], 'large.jpg', {
        type: 'image/jpeg',
      });
      expect(isValidFileSize(largeFile)).toBe(false);
    });
  });

  describe('isValidPosition', () => {
    it('should accept valid positions (0-8)', () => {
      expect(isValidPosition(0)).toBe(true);
      expect(isValidPosition(4)).toBe(true);
      expect(isValidPosition(8)).toBe(true);
    });

    it('should reject invalid positions', () => {
      expect(isValidPosition(-1)).toBe(false);
      expect(isValidPosition(9)).toBe(false);
      expect(isValidPosition(1.5)).toBe(false);
    });
  });

  describe('isValidContentType', () => {
    it('should accept valid content types', () => {
      expect(isValidContentType('portrait')).toBe(true);
      expect(isValidContentType('landscape')).toBe(true);
      expect(isValidContentType('food')).toBe(true);
      expect(isValidContentType('unknown')).toBe(true);
    });

    it('should reject invalid content types', () => {
      expect(isValidContentType('invalid')).toBe(false);
      expect(isValidContentType('')).toBe(false);
    });
  });

  describe('clampEffectValue', () => {
    it('should clamp brightness values to -100 to 100', () => {
      expect(clampEffectValue(150, 'brightness')).toBe(100);
      expect(clampEffectValue(-150, 'brightness')).toBe(-100);
      expect(clampEffectValue(50, 'brightness')).toBe(50);
    });

    it('should clamp intensity values to 0 to 100', () => {
      expect(clampEffectValue(150, 'intensity')).toBe(100);
      expect(clampEffectValue(-10, 'intensity')).toBe(0);
      expect(clampEffectValue(50, 'intensity')).toBe(50);
    });
  });

  describe('isInRange', () => {
    it('should check if value is within range', () => {
      expect(isInRange(50, 0, 100)).toBe(true);
      expect(isInRange(0, 0, 100)).toBe(true);
      expect(isInRange(100, 0, 100)).toBe(true);
      expect(isInRange(-1, 0, 100)).toBe(false);
      expect(isInRange(101, 0, 100)).toBe(false);
    });
  });

  describe('isValidDimensions', () => {
    it('should accept valid dimensions', () => {
      expect(isValidDimensions(1920, 1080)).toBe(true);
      expect(isValidDimensions(100, 100)).toBe(true);
    });

    it('should reject invalid dimensions', () => {
      expect(isValidDimensions(0, 100)).toBe(false);
      expect(isValidDimensions(100, 0)).toBe(false);
      expect(isValidDimensions(-100, 100)).toBe(false);
      expect(isValidDimensions(20000, 100)).toBe(false);
    });
  });

  describe('hasValidExtension', () => {
    it('should accept valid extensions', () => {
      expect(hasValidExtension('photo.jpg')).toBe(true);
      expect(hasValidExtension('photo.jpeg')).toBe(true);
      expect(hasValidExtension('photo.png')).toBe(true);
      expect(hasValidExtension('photo.webp')).toBe(true);
      expect(hasValidExtension('PHOTO.JPG')).toBe(true);
    });

    it('should reject invalid extensions', () => {
      expect(hasValidExtension('document.pdf')).toBe(false);
      expect(hasValidExtension('file.txt')).toBe(false);
      expect(hasValidExtension('noextension')).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension', () => {
      expect(getFileExtension('photo.jpg')).toBe('jpg');
      expect(getFileExtension('photo.PNG')).toBe('png');
      expect(getFileExtension('file.name.jpeg')).toBe('jpeg');
    });

    it('should return empty string for files without extension', () => {
      expect(getFileExtension('noextension')).toBe('');
    });
  });

  describe('isValidProjectName', () => {
    it('should accept valid project names', () => {
      expect(isValidProjectName('My Project')).toBe(true);
      expect(isValidProjectName('项目1')).toBe(true);
    });

    it('should reject invalid project names', () => {
      expect(isValidProjectName('')).toBe(false);
      expect(isValidProjectName('   ')).toBe(false);
      expect(isValidProjectName('a'.repeat(101))).toBe(false);
    });
  });
});
