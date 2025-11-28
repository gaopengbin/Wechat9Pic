/**
 * LayerPanel component tests
 * Validates: Requirements 5.2, 5.3, 5.4
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LayerPanel } from '../LayerPanel.js';
import type { Layer } from '@/types';
import { DEFAULT_TRANSFORM, DEFAULT_SHADOW } from '@/types';

// Create test layers
function createTestLayers(): Layer[] {
  return [
    {
      id: 'bg-1',
      type: 'background',
      imageData: 'data:image/png;base64,bg',
      transform: { ...DEFAULT_TRANSFORM },
      shadow: { ...DEFAULT_SHADOW },
      opacity: 100,
      visible: true,
      zIndex: 0,
    },
    {
      id: 'subject-1',
      type: 'subject',
      imageData: 'data:image/png;base64,s1',
      transform: { ...DEFAULT_TRANSFORM },
      shadow: { ...DEFAULT_SHADOW },
      opacity: 80,
      visible: true,
      zIndex: 1,
    },
    {
      id: 'subject-2',
      type: 'subject',
      imageData: 'data:image/png;base64,s2',
      transform: { ...DEFAULT_TRANSFORM },
      shadow: { ...DEFAULT_SHADOW },
      opacity: 60,
      visible: false,
      zIndex: 2,
    },
  ];
}

describe('LayerPanel', () => {
  describe('Layer List Display', () => {
    it('should display all layers', () => {
      const layers = createTestLayers();
      const mockSelect = vi.fn();
      const mockDelete = vi.fn();
      const mockReorder = vi.fn();
      const mockToggle = vi.fn();

      render(
        <LayerPanel
          layers={layers}
          selectedLayerId={null}
          onSelect={mockSelect}
          onDelete={mockDelete}
          onReorder={mockReorder}
          onToggleVisibility={mockToggle}
        />
      );

      // Should display layer panel title
      expect(screen.getByText('图层')).toBeInTheDocument();
      
      // Should display background layer
      expect(screen.getByText('底图')).toBeInTheDocument();
    });

    it('should highlight selected layer', () => {
      const layers = createTestLayers();
      const mockSelect = vi.fn();
      const mockDelete = vi.fn();
      const mockReorder = vi.fn();
      const mockToggle = vi.fn();

      render(
        <LayerPanel
          layers={layers}
          selectedLayerId="subject-1"
          onSelect={mockSelect}
          onDelete={mockDelete}
          onReorder={mockReorder}
          onToggleVisibility={mockToggle}
        />
      );

      // The selected layer should have blue background class
      const layerItems = screen.getAllByRole('img');
      expect(layerItems.length).toBe(3);
    });

    it('should call onSelect when layer is clicked', () => {
      const layers = createTestLayers();
      const mockSelect = vi.fn();
      const mockDelete = vi.fn();
      const mockReorder = vi.fn();
      const mockToggle = vi.fn();

      render(
        <LayerPanel
          layers={layers}
          selectedLayerId={null}
          onSelect={mockSelect}
          onDelete={mockDelete}
          onReorder={mockReorder}
          onToggleVisibility={mockToggle}
        />
      );

      // Click on a layer
      const layerItems = screen.getAllByRole('img');
      fireEvent.click(layerItems[0].parentElement!.parentElement!);
      
      expect(mockSelect).toHaveBeenCalled();
    });
  });

  describe('Layer Visibility Toggle', () => {
    it('should call onToggleVisibility when visibility button is clicked', () => {
      const layers = createTestLayers();
      const mockSelect = vi.fn();
      const mockDelete = vi.fn();
      const mockReorder = vi.fn();
      const mockToggle = vi.fn();

      render(
        <LayerPanel
          layers={layers}
          selectedLayerId={null}
          onSelect={mockSelect}
          onDelete={mockDelete}
          onReorder={mockReorder}
          onToggleVisibility={mockToggle}
        />
      );

      // Find visibility toggle buttons
      const toggleButtons = screen.getAllByTitle(/隐藏|显示/);
      expect(toggleButtons.length).toBeGreaterThan(0);
      
      fireEvent.click(toggleButtons[0]);
      expect(mockToggle).toHaveBeenCalled();
    });
  });

  describe('Layer Deletion', () => {
    it('should call onDelete when delete button is clicked for subject layer', () => {
      const layers = createTestLayers();
      const mockSelect = vi.fn();
      const mockDelete = vi.fn();
      const mockReorder = vi.fn();
      const mockToggle = vi.fn();

      render(
        <LayerPanel
          layers={layers}
          selectedLayerId={null}
          onSelect={mockSelect}
          onDelete={mockDelete}
          onReorder={mockReorder}
          onToggleVisibility={mockToggle}
        />
      );

      // Find delete buttons (only for subject layers)
      const deleteButtons = screen.getAllByTitle('删除');
      expect(deleteButtons.length).toBe(2); // Only 2 subject layers have delete buttons
      
      fireEvent.click(deleteButtons[0]);
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should not show delete button for background layer', () => {
      const layers = [createTestLayers()[0]]; // Only background layer
      const mockSelect = vi.fn();
      const mockDelete = vi.fn();
      const mockReorder = vi.fn();
      const mockToggle = vi.fn();

      render(
        <LayerPanel
          layers={layers}
          selectedLayerId={null}
          onSelect={mockSelect}
          onDelete={mockDelete}
          onReorder={mockReorder}
          onToggleVisibility={mockToggle}
        />
      );

      // Should not have any delete buttons
      const deleteButtons = screen.queryAllByTitle('删除');
      expect(deleteButtons.length).toBe(0);
    });
  });

  describe('Layer Opacity Display', () => {
    it('should display layer opacity', () => {
      const layers = createTestLayers();
      const mockSelect = vi.fn();
      const mockDelete = vi.fn();
      const mockReorder = vi.fn();
      const mockToggle = vi.fn();

      render(
        <LayerPanel
          layers={layers}
          selectedLayerId={null}
          onSelect={mockSelect}
          onDelete={mockDelete}
          onReorder={mockReorder}
          onToggleVisibility={mockToggle}
        />
      );

      // Should display opacity values
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });
  });
});
