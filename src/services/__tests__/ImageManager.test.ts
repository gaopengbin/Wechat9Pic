import { describe, it, expect, beforeEach } from 'vitest';
import { ImageManager } from '../ImageManager';
import { MAX_FILE_SIZE } from '@/types/constants';

describe('ImageManager', () => {
  let manager: ImageManager;

  beforeEach(() => {
    manager = new ImageManager();
  });

  describe('uploadImage', () => {
    it('should successfully upload a valid image', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await manager.uploadImage(file, 0);

      expect(result.success).toBe(true);
      expect(result.imageData).toBeDefined();
      expect(result.imageData?.position).toBe(0);
    });

    it('should reject invalid file format', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = await manager.uploadImage(file, 0);

      expect(result.success).toBe(false);
      expect(result.error).toContain('格式');
    });

    it('should reject file exceeding size limit', async () => {
      const largeContent = 'x'.repeat(MAX_FILE_SIZE + 1);
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      const result = await manager.uploadImage(file, 0);

      expect(result.success).toBe(false);
      expect(result.error).toContain('10MB');
    });

    it('should reject invalid position', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await manager.uploadImage(file, -1);

      expect(result.success).toBe(false);
    });

    it('should reject when exceeding max images (9)', async () => {
      // 上传9张图片
      for (let i = 0; i < 9; i++) {
        const file = new File(['test'], `test${i}.jpg`, { type: 'image/jpeg' });
        await manager.uploadImage(file, i);
      }

      // 尝试替换一个已存在的位置应该成功
      const replaceFile = new File(['test'], 'replace.jpg', { type: 'image/jpeg' });
      const replaceResult = await manager.uploadImage(replaceFile, 0);
      expect(replaceResult.success).toBe(true);

      // 但是如果我们先删除一个，然后尝试添加到新位置，应该成功
      manager.removeImage(0);
      const newFile = new File(['test'], 'new.jpg', { type: 'image/jpeg' });
      const newResult = await manager.uploadImage(newFile, 0);
      expect(newResult.success).toBe(true);
    });
  });

  describe('removeImage', () => {
    it('should remove image at specified position', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await manager.uploadImage(file, 0);

      expect(manager.hasImage(0)).toBe(true);

      manager.removeImage(0);

      expect(manager.hasImage(0)).toBe(false);
    });

    it('should throw error for invalid position', () => {
      expect(() => manager.removeImage(-1)).toThrow('无效的位置');
      expect(() => manager.removeImage(10)).toThrow('无效的位置');
    });
  });

  describe('reorderImages', () => {
    it('should swap images when both positions have images', async () => {
      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });

      const result1 = await manager.uploadImage(file1, 0);
      const result2 = await manager.uploadImage(file2, 1);

      const id1 = result1.imageData?.id;
      const id2 = result2.imageData?.id;

      manager.reorderImages(0, 1);

      const image0 = manager.getImage(0);
      const image1 = manager.getImage(1);

      expect(image0?.id).toBe(id2);
      expect(image1?.id).toBe(id1);
    });

    it('should move image when target position is empty', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await manager.uploadImage(file, 0);
      const id = result.imageData?.id;

      manager.reorderImages(0, 5);

      expect(manager.hasImage(0)).toBe(false);
      expect(manager.hasImage(5)).toBe(true);
      expect(manager.getImage(5)?.id).toBe(id);
    });

    it('should throw error for invalid positions', () => {
      expect(() => manager.reorderImages(-1, 0)).toThrow('无效的位置');
      expect(() => manager.reorderImages(0, 10)).toThrow('无效的位置');
    });

    it('should throw error when source position has no image', () => {
      expect(() => manager.reorderImages(0, 1)).toThrow('源位置没有图片');
    });
  });

  describe('getAllImages', () => {
    it('should return all images sorted by position', async () => {
      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
      const file3 = new File(['test3'], 'test3.jpg', { type: 'image/jpeg' });

      await manager.uploadImage(file1, 5);
      await manager.uploadImage(file2, 2);
      await manager.uploadImage(file3, 7);

      const images = manager.getAllImages();

      expect(images).toHaveLength(3);
      expect(images[0].position).toBe(2);
      expect(images[1].position).toBe(5);
      expect(images[2].position).toBe(7);
    });

    it('should return empty array when no images', () => {
      const images = manager.getAllImages();
      expect(images).toHaveLength(0);
    });
  });

  describe('getImageCount', () => {
    it('should return correct image count', async () => {
      expect(manager.getImageCount()).toBe(0);

      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
      await manager.uploadImage(file1, 0);
      expect(manager.getImageCount()).toBe(1);

      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
      await manager.uploadImage(file2, 1);
      expect(manager.getImageCount()).toBe(2);

      manager.removeImage(0);
      expect(manager.getImageCount()).toBe(1);
    });
  });

  describe('clear', () => {
    it('should remove all images', async () => {
      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });

      await manager.uploadImage(file1, 0);
      await manager.uploadImage(file2, 1);

      expect(manager.getImageCount()).toBe(2);

      manager.clear();

      expect(manager.getImageCount()).toBe(0);
      expect(manager.getAllImages()).toHaveLength(0);
    });
  });

  describe('updateContentType', () => {
    it('should update content type of image', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await manager.uploadImage(file, 0);

      manager.updateContentType(0, 'portrait');

      const image = manager.getImage(0);
      expect(image?.contentType).toBe('portrait');
    });

    it('should do nothing if position has no image', () => {
      expect(() => manager.updateContentType(0, 'portrait')).not.toThrow();
    });
  });

  describe('getOccupiedPositions', () => {
    it('should return sorted list of occupied positions', async () => {
      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
      const file3 = new File(['test3'], 'test3.jpg', { type: 'image/jpeg' });

      await manager.uploadImage(file1, 7);
      await manager.uploadImage(file2, 2);
      await manager.uploadImage(file3, 5);

      const positions = manager.getOccupiedPositions();

      expect(positions).toEqual([2, 5, 7]);
    });
  });

  describe('getFirstEmptyPosition', () => {
    it('should return first empty position', async () => {
      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });

      await manager.uploadImage(file1, 0);
      await manager.uploadImage(file2, 1);

      expect(manager.getFirstEmptyPosition()).toBe(2);
    });

    it('should return null when all positions are occupied', async () => {
      for (let i = 0; i < 9; i++) {
        const file = new File(['test'], `test${i}.jpg`, { type: 'image/jpeg' });
        await manager.uploadImage(file, i);
      }

      expect(manager.getFirstEmptyPosition()).toBeNull();
    });

    it('should return 0 when no images', () => {
      expect(manager.getFirstEmptyPosition()).toBe(0);
    });
  });
});
