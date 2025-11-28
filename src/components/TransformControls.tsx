/**
 * TransformControls - 变换控制组件
 * Validates: Requirements 3.1, 3.2, 3.3
 */

import React, { useCallback } from 'react';
import { LayerTransformConfig, LAYER_CONSTRAINTS } from '@/types';

interface TransformControlsProps {
  transform: LayerTransformConfig;
  onChange: (transform: Partial<LayerTransformConfig>) => void;
}

export const TransformControls: React.FC<TransformControlsProps> = ({
  transform,
  onChange,
}) => {
  const handleXChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ x: parseInt(e.target.value, 10) || 0 });
  }, [onChange]);

  const handleYChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ y: parseInt(e.target.value, 10) || 0 });
  }, [onChange]);

  const handleScaleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onChange({ scale: Math.max(LAYER_CONSTRAINTS.scale.min, Math.min(LAYER_CONSTRAINTS.scale.max, value)) });
  }, [onChange]);

  const handleRotationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onChange({ rotation: Math.max(LAYER_CONSTRAINTS.rotation.min, Math.min(LAYER_CONSTRAINTS.rotation.max, value)) });
  }, [onChange]);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-300">位置与变换</h4>

      {/* 位置 X */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>X 位置</span>
          <span>{transform.x}px</span>
        </div>
        <input
          type="number"
          value={transform.x}
          onChange={handleXChange}
          className="w-full px-3 py-1.5 text-sm bg-black/20 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none transition-colors"
        />
      </div>

      {/* 位置 Y */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Y 位置</span>
          <span>{transform.y}px</span>
        </div>
        <input
          type="number"
          value={transform.y}
          onChange={handleYChange}
          className="w-full px-3 py-1.5 text-sm bg-black/20 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none transition-colors"
        />
      </div>

      {/* 缩放 */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>缩放</span>
          <span>{transform.scale}%</span>
        </div>
        <input
          type="range"
          min={LAYER_CONSTRAINTS.scale.min}
          max={LAYER_CONSTRAINTS.scale.max}
          value={transform.scale}
          onChange={handleScaleChange}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{LAYER_CONSTRAINTS.scale.min}%</span>
          <span>{LAYER_CONSTRAINTS.scale.max}%</span>
        </div>
      </div>

      {/* 旋转 */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>旋转</span>
          <span>{transform.rotation}°</span>
        </div>
        <input
          type="range"
          min={LAYER_CONSTRAINTS.rotation.min}
          max={LAYER_CONSTRAINTS.rotation.max}
          value={transform.rotation}
          onChange={handleRotationChange}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{LAYER_CONSTRAINTS.rotation.min}°</span>
          <span>{LAYER_CONSTRAINTS.rotation.max}°</span>
        </div>
      </div>

      {/* 重置按钮 */}
      <button
        onClick={() => onChange({ x: 0, y: 0, scale: 100, rotation: 0 })}
        className="w-full py-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/30 rounded-lg transition-all"
      >
        重置变换
      </button>
    </div>
  );
};

export default TransformControls;
