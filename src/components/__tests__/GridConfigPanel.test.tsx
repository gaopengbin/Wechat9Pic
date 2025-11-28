/**
 * GridConfigPanel component tests
 * Validates: Requirements 1.4, 1.5
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GridConfigPanel } from '../GridConfigPanel.js';
import { LAYER_CONSTRAINTS } from '@/types';

describe('GridConfigPanel', () => {
  const defaultConfig = {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  };

  describe('Border Width Slider', () => {
    it('should display border width slider with correct range', () => {
      const mockChange = vi.fn();

      render(<GridConfigPanel config={defaultConfig} onChange={mockChange} />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      expect(slider.getAttribute('min')).toBe(String(LAYER_CONSTRAINTS.borderWidth.min));
      expect(slider.getAttribute('max')).toBe(String(LAYER_CONSTRAINTS.borderWidth.max));
    });

    it('should display current border width value', () => {
      const mockChange = vi.fn();

      render(
        <GridConfigPanel config={{ ...defaultConfig, borderWidth: 5 }} onChange={mockChange} />
      );

      expect(screen.getByText('5px')).toBeInTheDocument();
    });

    it('should call onChange when border width is changed', () => {
      const mockChange = vi.fn();

      render(<GridConfigPanel config={defaultConfig} onChange={mockChange} />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '8' } });

      expect(mockChange).toHaveBeenCalledWith({ borderWidth: 8 });
    });

    it('should clamp border width to valid range', () => {
      const mockChange = vi.fn();

      render(<GridConfigPanel config={defaultConfig} onChange={mockChange} />);

      const slider = screen.getByRole('slider');
      
      // Try to set value above max
      fireEvent.change(slider, { target: { value: '20' } });
      expect(mockChange).toHaveBeenCalledWith({ borderWidth: LAYER_CONSTRAINTS.borderWidth.max });
    });
  });

  describe('Border Color Selection', () => {
    it('should display preset color buttons', () => {
      const mockChange = vi.fn();

      render(<GridConfigPanel config={defaultConfig} onChange={mockChange} />);

      // Should have preset color buttons
      expect(screen.getByTitle('白色')).toBeInTheDocument();
      expect(screen.getByTitle('黑色')).toBeInTheDocument();
      expect(screen.getByTitle('灰色')).toBeInTheDocument();
      expect(screen.getByTitle('米色')).toBeInTheDocument();
    });

    it('should call onChange when preset color is clicked', () => {
      const mockChange = vi.fn();

      render(<GridConfigPanel config={defaultConfig} onChange={mockChange} />);

      const blackButton = screen.getByTitle('黑色');
      fireEvent.click(blackButton);

      expect(mockChange).toHaveBeenCalledWith({ borderColor: '#000000' });
    });

    it('should display color picker', () => {
      const mockChange = vi.fn();

      render(<GridConfigPanel config={defaultConfig} onChange={mockChange} />);

      const colorInputs = screen.getAllByDisplayValue('#FFFFFF');
      expect(colorInputs.length).toBeGreaterThan(0);
    });

    it('should call onChange when custom color is selected', () => {
      const mockChange = vi.fn();

      render(<GridConfigPanel config={defaultConfig} onChange={mockChange} />);

      const colorInputs = screen.getAllByDisplayValue('#FFFFFF');
      fireEvent.change(colorInputs[0], { target: { value: '#FF0000' } });

      expect(mockChange).toHaveBeenCalledWith({ borderColor: '#FF0000' });
    });

    it('should display current border color value', () => {
      const mockChange = vi.fn();

      render(
        <GridConfigPanel config={{ ...defaultConfig, borderColor: '#123456' }} onChange={mockChange} />
      );

      expect(screen.getByText('#123456')).toBeInTheDocument();
    });
  });

  describe('Preview', () => {
    it('should display preview section', () => {
      const mockChange = vi.fn();

      render(<GridConfigPanel config={defaultConfig} onChange={mockChange} />);

      expect(screen.getByText('预览')).toBeInTheDocument();
    });

    it('should render 9 grid cells in preview', () => {
      const mockChange = vi.fn();

      const { container } = render(
        <GridConfigPanel config={defaultConfig} onChange={mockChange} />
      );

      // Find the preview grid container
      const gridCells = container.querySelectorAll('.bg-gray-200');
      expect(gridCells.length).toBe(9);
    });
  });

  describe('Panel Title', () => {
    it('should display panel title', () => {
      const mockChange = vi.fn();

      render(<GridConfigPanel config={defaultConfig} onChange={mockChange} />);

      expect(screen.getByText('底图配置')).toBeInTheDocument();
    });
  });
});
