/**
 * TransformControls component tests
 * Validates: Requirements 3.1, 3.2, 3.3
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransformControls } from '../TransformControls.js';
import { DEFAULT_TRANSFORM, LAYER_CONSTRAINTS } from '@/types';

describe('TransformControls', () => {
  describe('Scale Slider Range', () => {
    it('should display scale slider with correct range', () => {
      const mockChange = vi.fn();

      render(
        <TransformControls
          transform={{ ...DEFAULT_TRANSFORM }}
          onChange={mockChange}
        />
      );

      // Find scale slider
      const sliders = screen.getAllByRole('slider');
      const scaleSlider = sliders.find(
        (s) =>
          s.getAttribute('min') === String(LAYER_CONSTRAINTS.scale.min) &&
          s.getAttribute('max') === String(LAYER_CONSTRAINTS.scale.max)
      );

      expect(scaleSlider).toBeDefined();
      expect(scaleSlider?.getAttribute('min')).toBe(String(LAYER_CONSTRAINTS.scale.min));
      expect(scaleSlider?.getAttribute('max')).toBe(String(LAYER_CONSTRAINTS.scale.max));
    });

    it('should display current scale value', () => {
      const mockChange = vi.fn();

      render(
        <TransformControls
          transform={{ ...DEFAULT_TRANSFORM, scale: 150 }}
          onChange={mockChange}
        />
      );

      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('should call onChange when scale is changed', () => {
      const mockChange = vi.fn();

      render(
        <TransformControls
          transform={{ ...DEFAULT_TRANSFORM }}
          onChange={mockChange}
        />
      );

      const sliders = screen.getAllByRole('slider');
      const scaleSlider = sliders.find(
        (s) => s.getAttribute('min') === String(LAYER_CONSTRAINTS.scale.min)
      );

      fireEvent.change(scaleSlider!, { target: { value: '200' } });
      expect(mockChange).toHaveBeenCalledWith({ scale: 200 });
    });
  });

  describe('Rotation Slider Range', () => {
    it('should display rotation slider with correct range', () => {
      const mockChange = vi.fn();

      render(
        <TransformControls
          transform={{ ...DEFAULT_TRANSFORM }}
          onChange={mockChange}
        />
      );

      const sliders = screen.getAllByRole('slider');
      const rotationSlider = sliders.find(
        (s) =>
          s.getAttribute('min') === String(LAYER_CONSTRAINTS.rotation.min) &&
          s.getAttribute('max') === String(LAYER_CONSTRAINTS.rotation.max)
      );

      expect(rotationSlider).toBeDefined();
      expect(rotationSlider?.getAttribute('min')).toBe(String(LAYER_CONSTRAINTS.rotation.min));
      expect(rotationSlider?.getAttribute('max')).toBe(String(LAYER_CONSTRAINTS.rotation.max));
    });

    it('should display current rotation value', () => {
      const mockChange = vi.fn();

      render(
        <TransformControls
          transform={{ ...DEFAULT_TRANSFORM, rotation: 45 }}
          onChange={mockChange}
        />
      );

      expect(screen.getByText('45°')).toBeInTheDocument();
    });

    it('should call onChange when rotation is changed', () => {
      const mockChange = vi.fn();

      render(
        <TransformControls
          transform={{ ...DEFAULT_TRANSFORM }}
          onChange={mockChange}
        />
      );

      const sliders = screen.getAllByRole('slider');
      const rotationSlider = sliders.find(
        (s) => s.getAttribute('min') === String(LAYER_CONSTRAINTS.rotation.min)
      );

      fireEvent.change(rotationSlider!, { target: { value: '90' } });
      expect(mockChange).toHaveBeenCalledWith({ rotation: 90 });
    });
  });

  describe('Position Controls', () => {
    it('should display position inputs', () => {
      const mockChange = vi.fn();

      render(
        <TransformControls
          transform={{ ...DEFAULT_TRANSFORM, x: 100, y: 200 }}
          onChange={mockChange}
        />
      );

      expect(screen.getByText('100px')).toBeInTheDocument();
      expect(screen.getByText('200px')).toBeInTheDocument();
    });

    it('should call onChange when X position is changed', () => {
      const mockChange = vi.fn();

      render(
        <TransformControls
          transform={{ ...DEFAULT_TRANSFORM }}
          onChange={mockChange}
        />
      );

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '50' } });
      expect(mockChange).toHaveBeenCalledWith({ x: 50 });
    });

    it('should call onChange when Y position is changed', () => {
      const mockChange = vi.fn();

      render(
        <TransformControls
          transform={{ ...DEFAULT_TRANSFORM }}
          onChange={mockChange}
        />
      );

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[1], { target: { value: '75' } });
      expect(mockChange).toHaveBeenCalledWith({ y: 75 });
    });
  });

  describe('Reset Button', () => {
    it('should reset all transform values when clicked', () => {
      const mockChange = vi.fn();

      render(
        <TransformControls
          transform={{ x: 100, y: 200, scale: 150, rotation: 45 }}
          onChange={mockChange}
        />
      );

      const resetButton = screen.getByText('重置变换');
      fireEvent.click(resetButton);

      expect(mockChange).toHaveBeenCalledWith({
        x: 0,
        y: 0,
        scale: 100,
        rotation: 0,
      });
    });
  });
});
