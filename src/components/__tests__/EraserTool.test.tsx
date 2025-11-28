/**
 * EraserTool component tests
 * Validates: Requirements 2.4
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EraserTool } from '../EraserTool.js';

// Create a test image data URL
const createTestImageData = (): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 100, 100);
  }
  return canvas.toDataURL('image/png');
};

describe('EraserTool', () => {
  const testImageData = createTestImageData();

  describe('Mode Toggle', () => {
    it('should display mode toggle buttons', () => {
      const mockUpdate = vi.fn();
      const mockClose = vi.fn();

      render(
        <EraserTool
          imageData={testImageData}
          onUpdate={mockUpdate}
          onClose={mockClose}
        />
      );

      expect(screen.getByText('擦除')).toBeInTheDocument();
      expect(screen.getByText('恢复')).toBeInTheDocument();
    });

    it('should switch to erase mode when clicked', () => {
      const mockUpdate = vi.fn();
      const mockClose = vi.fn();

      render(
        <EraserTool
          imageData={testImageData}
          onUpdate={mockUpdate}
          onClose={mockClose}
        />
      );

      const eraseButton = screen.getByText('擦除');
      fireEvent.click(eraseButton);

      // Erase button should be active (has blue background)
      expect(eraseButton.className).toContain('bg-blue-500');
    });

    it('should switch to restore mode when clicked', () => {
      const mockUpdate = vi.fn();
      const mockClose = vi.fn();

      render(
        <EraserTool
          imageData={testImageData}
          onUpdate={mockUpdate}
          onClose={mockClose}
        />
      );

      const restoreButton = screen.getByText('恢复');
      fireEvent.click(restoreButton);

      // Restore button should be active
      expect(restoreButton.className).toContain('bg-blue-500');
    });
  });

  describe('Brush Size', () => {
    it('should display brush size options', () => {
      const mockUpdate = vi.fn();
      const mockClose = vi.fn();

      render(
        <EraserTool
          imageData={testImageData}
          onUpdate={mockUpdate}
          onClose={mockClose}
        />
      );

      expect(screen.getByText('画笔大小:')).toBeInTheDocument();
      // Default brush size is 20px
      expect(screen.getByText('20px')).toBeInTheDocument();
    });

    it('should have 5 brush size buttons', () => {
      const mockUpdate = vi.fn();
      const mockClose = vi.fn();

      const { container } = render(
        <EraserTool
          imageData={testImageData}
          onUpdate={mockUpdate}
          onClose={mockClose}
        />
      );

      // Find brush size buttons (they have w-8 h-8 classes)
      const brushButtons = container.querySelectorAll('.w-8.h-8');
      expect(brushButtons.length).toBe(5);
    });
  });

  describe('Reset Button', () => {
    it('should display reset button', () => {
      const mockUpdate = vi.fn();
      const mockClose = vi.fn();

      render(
        <EraserTool
          imageData={testImageData}
          onUpdate={mockUpdate}
          onClose={mockClose}
        />
      );

      expect(screen.getByText('重置')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should display cancel button', () => {
      const mockUpdate = vi.fn();
      const mockClose = vi.fn();

      render(
        <EraserTool
          imageData={testImageData}
          onUpdate={mockUpdate}
          onClose={mockClose}
        />
      );

      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    it('should display apply button', () => {
      const mockUpdate = vi.fn();
      const mockClose = vi.fn();

      render(
        <EraserTool
          imageData={testImageData}
          onUpdate={mockUpdate}
          onClose={mockClose}
        />
      );

      expect(screen.getByText('应用')).toBeInTheDocument();
    });

    it('should call onClose when cancel is clicked', () => {
      const mockUpdate = vi.fn();
      const mockClose = vi.fn();

      render(
        <EraserTool
          imageData={testImageData}
          onUpdate={mockUpdate}
          onClose={mockClose}
        />
      );

      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should call onUpdate and onClose when apply is clicked', () => {
      const mockUpdate = vi.fn();
      const mockClose = vi.fn();

      render(
        <EraserTool
          imageData={testImageData}
          onUpdate={mockUpdate}
          onClose={mockClose}
        />
      );

      const applyButton = screen.getByText('应用');
      fireEvent.click(applyButton);

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('Header', () => {
    it('should display tool title', () => {
      const mockUpdate = vi.fn();
      const mockClose = vi.fn();

      render(
        <EraserTool
          imageData={testImageData}
          onUpdate={mockUpdate}
          onClose={mockClose}
        />
      );

      expect(screen.getByText('橡皮擦工具')).toBeInTheDocument();
    });

    it('should have close button in header', () => {
      const mockUpdate = vi.fn();
      const mockClose = vi.fn();

      const { container } = render(
        <EraserTool
          imageData={testImageData}
          onUpdate={mockUpdate}
          onClose={mockClose}
        />
      );

      // Find close button (X icon)
      const closeButtons = container.querySelectorAll('svg');
      expect(closeButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Canvas', () => {
    it('should render canvas element', () => {
      const mockUpdate = vi.fn();
      const mockClose = vi.fn();

      const { container } = render(
        <EraserTool
          imageData={testImageData}
          onUpdate={mockUpdate}
          onClose={mockClose}
        />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });
  });
});
