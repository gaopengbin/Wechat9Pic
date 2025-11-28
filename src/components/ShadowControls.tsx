/**
 * ShadowControls - 阴影控制组件
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */

import React, { useCallback } from 'react';
import { LayerShadowConfig, LAYER_CONSTRAINTS } from '@/types';

interface ShadowControlsProps {
  shadow: LayerShadowConfig;
  onChange: (shadow: Partial<LayerShadowConfig>) => void;
}

export const ShadowControls: React.FC<ShadowControlsProps> = ({
  shadow,
  onChange,
}) => {
  const handleEnabledChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ enabled: e.target.checked });
  }, [onChange]);

  const handleBlurChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onChange({ blur: Math.max(LAYER_CONSTRAINTS.shadowBlur.min, Math.min(LAYER_CONSTRAINTS.shadowBlur.max, value)) });
  }, [onChange]);

  const handleOffsetXChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onChange({ offsetX: Math.max(LAYER_CONSTRAINTS.shadowOffset.min, Math.min(LAYER_CONSTRAINTS.shadowOffset.max, value)) });
  }, [onChange]);

  const handleOffsetYChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onChange({ offsetY: Math.max(LAYER_CONSTRAINTS.shadowOffset.min, Math.min(LAYER_CONSTRAINTS.shadowOffset.max, value)) });
  }, [onChange]);

  const handleOpacityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onChange({ opacity: Math.max(LAYER_CONSTRAINTS.opacity.min, Math.min(LAYER_CONSTRAINTS.opacity.max, value)) });
  }, [onChange]);

  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ color: e.target.value });
  }, [onChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">阴影</h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={shadow.enabled}
            onChange={handleEnabledChange}
            className="rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
          />
          <span className="text-xs text-gray-400">启用</span>
        </label>
      </div>

      {shadow.enabled && (
        <>
          {/* 模糊度 */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>模糊度</span>
              <span>{shadow.blur}px</span>
            </div>
            <input
              type="range"
              min={LAYER_CONSTRAINTS.shadowBlur.min}
              max={LAYER_CONSTRAINTS.shadowBlur.max}
              value={shadow.blur}
              onChange={handleBlurChange}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* X偏移 */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>X偏移</span>
              <span>{shadow.offsetX}px</span>
            </div>
            <input
              type="range"
              min={LAYER_CONSTRAINTS.shadowOffset.min}
              max={LAYER_CONSTRAINTS.shadowOffset.max}
              value={shadow.offsetX}
              onChange={handleOffsetXChange}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Y偏移 */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Y偏移</span>
              <span>{shadow.offsetY}px</span>
            </div>
            <input
              type="range"
              min={LAYER_CONSTRAINTS.shadowOffset.min}
              max={LAYER_CONSTRAINTS.shadowOffset.max}
              value={shadow.offsetY}
              onChange={handleOffsetYChange}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* 透明度 */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>透明度</span>
              <span>{shadow.opacity}%</span>
            </div>
            <input
              type="range"
              min={LAYER_CONSTRAINTS.opacity.min}
              max={LAYER_CONSTRAINTS.opacity.max}
              value={shadow.opacity}
              onChange={handleOpacityChange}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* 颜色 */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>颜色</span>
              <span>{shadow.color}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="color"
                value={shadow.color}
                onChange={handleColorChange}
                className="w-8 h-8 rounded cursor-pointer border border-white/20 bg-transparent p-0"
              />
              <input
                type="text"
                value={shadow.color}
                onChange={handleColorChange}
                className="flex-1 px-3 py-1.5 text-sm bg-black/20 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShadowControls;
