/**
 * FullscreenPreview component tests
 * Validates: Requirements 8.2, 8.3, 8.4
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FullscreenPreview } from '../FullscreenPreview.js';

describe('FullscreenPreview', () => {
  const testImageUrl = 'data:image/png;base64,test';

  describe('Display', () => {
    it('should display the preview image', () => {
      const mockClose = vi.fn();

      render(
        <FullscreenPreview
          imageUrl={testImageUrl}
          onClose={mockClose}
        />
      );

      const image = screen.getByAltText('全屏预览');
      expect(image).toBeInTheDocument();
      expect(image.getAttribute('src')).toBe(testImageUrl);
    });

    it('should display ESC hint', () => {
      const mockClose = vi.fn();

      render(
        <FullscreenPreview
          imageUrl={testImageUrl}
          onClose={mockClose}
        />
      );

      expect(screen.getByText('按 ESC 退出全屏')).toBeInTheDocument();
    });

    it('should display footer hint', () => {
      const mockClose = vi.fn();

      render(
        <FullscreenPreview
          imageUrl={testImageUrl}
          onClose={mockClose}
        />
      );

      expect(screen.getByText('点击空白区域或按 ESC 退出')).toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('should display close button', () => {
      const mockClose = vi.fn();

      render(
        <FullscreenPreview
          imageUrl={testImageUrl}
          onClose={mockClose}
        />
      );

      const closeButton = screen.getByLabelText('关闭预览');
      expect(closeButton).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      const mockClose = vi.fn();

      render(
        <FullscreenPreview
          imageUrl={testImageUrl}
          onClose={mockClose}
        />
      );

      const closeButton = screen.getByLabelText('关闭预览');
      fireEvent.click(closeButton);

      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('Backdrop Click', () => {
    it('should call onClose when backdrop is clicked', () => {
      const mockClose = vi.fn();

      render(
        <FullscreenPreview
          imageUrl={testImageUrl}
          onClose={mockClose}
        />
      );

      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);

      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('Keyboard Events', () => {
    it('should call onClose when ESC is pressed', () => {
      const mockClose = vi.fn();

      render(
        <FullscreenPreview
          imageUrl={testImageUrl}
          onClose={mockClose}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('Export Button', () => {
    it('should display export button when onExport is provided', () => {
      const mockClose = vi.fn();
      const mockExport = vi.fn();

      render(
        <FullscreenPreview
          imageUrl={testImageUrl}
          onClose={mockClose}
          onExport={mockExport}
        />
      );

      expect(screen.getByText('导出图片')).toBeInTheDocument();
    });

    it('should not display export button when onExport is not provided', () => {
      const mockClose = vi.fn();

      render(
        <FullscreenPreview
          imageUrl={testImageUrl}
          onClose={mockClose}
        />
      );

      expect(screen.queryByText('导出图片')).not.toBeInTheDocument();
    });

    it('should call onExport when export button is clicked', () => {
      const mockClose = vi.fn();
      const mockExport = vi.fn();

      render(
        <FullscreenPreview
          imageUrl={testImageUrl}
          onClose={mockClose}
          onExport={mockExport}
        />
      );

      const exportButton = screen.getByText('导出图片');
      fireEvent.click(exportButton);

      expect(mockExport).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have dialog role', () => {
      const mockClose = vi.fn();

      render(
        <FullscreenPreview
          imageUrl={testImageUrl}
          onClose={mockClose}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-modal attribute', () => {
      const mockClose = vi.fn();

      render(
        <FullscreenPreview
          imageUrl={testImageUrl}
          onClose={mockClose}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('should have aria-label', () => {
      const mockClose = vi.fn();

      render(
        <FullscreenPreview
          imageUrl={testImageUrl}
          onClose={mockClose}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog.getAttribute('aria-label')).toBe('全屏预览');
    });
  });
});
