/**
 * ShadowControls component tests
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShadowControls } from '../ShadowControls.js';
import { DEFAULT_SHADOW, LAYER_CONSTRAINTS } from '@/types';

describe('ShadowControls', () => {
  describe('Shadow Toggle', () => {
    it('should display shadow toggle checkbox', () => {
      const mockChange = vi.fn();

      render(
        <ShadowControls
          shadow={{ ...DEFAULT_SHADOW }}
          onChange={mockChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('should call onChange when shadow is toggled', () => {
      const mockChange = vi.fn();

      render(
        <ShadowControls
          shadow={{ ...DEFAULT_SHADOW, enabled: false }}
          onChange={mockChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(mockChange).toHaveBeenCalledWith({ enabled: true });
    });
  });

  describe('Shadow Controls Visibility', () => {
    it('should hide controls when shadow is disabled', () => {
      const mockChange = vi.fn();

      render(
        <ShadowControls
          shadow={{ ...DEFAULT_SHADOW, enabled: false }}
          onChange={mockChange}
        />
      );

      // Sliders should not be visible when shadow is disabled
      const sliders = screen.queryAllByRole('slider');
      expect(sliders.length).toBe(0);
    });

    it('should show controls when shadow is enabled', () => {
      const mockChange = vi.fn();

      render(
        <ShadowControls
          shadow={{ ...DEFAULT_SHADOW, enabled: true }}
          onChange={mockChange}
        />
      );

      // Sliders should be visible when shadow is enabled
      const sliders = screen.getAllByRole('slider');
      expect(sliders.length).toBeGreaterThan(0);
    });
  });

  describe('Blur Slider Range', () => {
    it('should display blur slider with correct range', () => {
      const mockChange = vi.fn();

      render(
        <ShadowControls
          shadow={{ ...DEFAULT_SHADOW, enabled: true }}
          onChange={mockChange}
        />
      );

      const sliders = screen.getAllByRole('slider');
      const blurSlider = sliders.find(
        (s) =>
          s.getAttribute('min') === String(LAYER_CONSTRAINTS.shadowBlur.min) &&
          s.getAttribute('max') === String(LAYER_CONSTRAINTS.shadowBlur.max)
      );

      expect(blurSlider).toBeDefined();
    });

    it('should display current blur value', () => {
      const mockChange = vi.fn();

      render(
        <ShadowControls
          shadow={{ ...DEFAULT_SHADOW, enabled: true, blur: 15 }}
          onChange={mockChange}
        />
      );

      expect(screen.getByText('15px')).toBeInTheDocument();
    });

    it('should call onChange when blur is changed', () => {
      const mockChange = vi.fn();

      render(
        <ShadowControls
          shadow={{ ...DEFAULT_SHADOW, enabled: true }}
          onChange={mockChange}
        />
      );

      const sliders = screen.getAllByRole('slider');
      const blurSlider = sliders.find(
        (s) => s.getAttribute('max') === String(LAYER_CONSTRAINTS.shadowBlur.max)
      );

      fireEvent.change(blurSlider!, { target: { value: '20' } });
      expect(mockChange).toHaveBeenCalledWith({ blur: 20 });
    });
  });

  describe('Offset Sliders Range', () => {
    it('should display offset sliders with correct range', () => {
      const mockChange = vi.fn();

      render(
        <ShadowControls
          shadow={{ ...DEFAULT_SHADOW, enabled: true }}
          onChange={mockChange}
        />
      );

      const sliders = screen.getAllByRole('slider');
      const offsetSliders = sliders.filter(
        (s) =>
          s.getAttribute('min') === String(LAYER_CONSTRAINTS.shadowOffset.min) &&
          s.getAttribute('max') === String(LAYER_CONSTRAINTS.shadowOffset.max)
      );

      // Should have 2 offset sliders (X and Y)
      expect(offsetSliders.length).toBe(2);
    });

    it('should display current offset values', () => {
      const mockChange = vi.fn();

      render(
        <ShadowControls
          shadow={{ ...DEFAULT_SHADOW, enabled: true, offsetX: 25, offsetY: -15 }}
          onChange={mockChange}
        />
      );

      // Use getAllByText since there might be multiple elements with similar text
      expect(screen.getByText('25px')).toBeInTheDocument();
      expect(screen.getByText('-15px')).toBeInTheDocument();
    });
  });

  describe('Opacity Slider Range', () => {
    it('should display opacity slider with correct range', () => {
      const mockChange = vi.fn();

      render(
        <ShadowControls
          shadow={{ ...DEFAULT_SHADOW, enabled: true }}
          onChange={mockChange}
        />
      );

      const sliders = screen.getAllByRole('slider');
      const opacitySlider = sliders.find(
        (s) =>
          s.getAttribute('min') === String(LAYER_CONSTRAINTS.opacity.min) &&
          s.getAttribute('max') === String(LAYER_CONSTRAINTS.opacity.max)
      );

      expect(opacitySlider).toBeDefined();
    });

    it('should call onChange when opacity is changed', () => {
      const mockChange = vi.fn();

      render(
        <ShadowControls
          shadow={{ ...DEFAULT_SHADOW, enabled: true }}
          onChange={mockChange}
        />
      );

      const sliders = screen.getAllByRole('slider');
      const opacitySlider = sliders.find(
        (s) => s.getAttribute('max') === String(LAYER_CONSTRAINTS.opacity.max)
      );

      fireEvent.change(opacitySlider!, { target: { value: '75' } });
      expect(mockChange).toHaveBeenCalledWith({ opacity: 75 });
    });
  });

  describe('Color Picker', () => {
    it('should display color picker', () => {
      const mockChange = vi.fn();

      render(
        <ShadowControls
          shadow={{ ...DEFAULT_SHADOW, enabled: true, color: '#ff0000' }}
          onChange={mockChange}
        />
      );

      expect(screen.getByText('#ff0000')).toBeInTheDocument();
    });

    it('should call onChange when color is changed', () => {
      const mockChange = vi.fn();

      render(
        <ShadowControls
          shadow={{ ...DEFAULT_SHADOW, enabled: true }}
          onChange={mockChange}
        />
      );

      const colorInputs = screen.getAllByDisplayValue(DEFAULT_SHADOW.color);
      fireEvent.change(colorInputs[0], { target: { value: '#00ff00' } });

      expect(mockChange).toHaveBeenCalledWith({ color: '#00ff00' });
    });
  });
});
