/**
 * OpacityControl - 透明度控制组件
 * Validates: Requirements 6.1
 */

import React, { useCallback } from 'react';
import { LAYER_CONSTRAINTS } from '@/types';

interface OpacityControlProps {
  opacity: number;
  onChange: (opacity: number) => void;
}

export const OpacityControl: React.FC<OpacityControlProps> = ({
  opacity,
  onChange,
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onChange(Math.max(LAYER_CONSTRAINTS.opacity.min, Math.min(LAYER_CONSTRAINTS.opacity.max, value)));
  }, [onChange]);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-300">透明度</h4>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>不透明度</span>
          <span>{opacity}%</span>
        </div>
        <input
          type="range"
          min={LAYER_CONSTRAINTS.opacity.min}
          max={LAYER_CONSTRAINTS.opacity.max}
          value={opacity}
          onChange={handleChange}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>透明</span>
          <span>不透明</span>
        </div>
      </div>

      {/* 快捷按钮 */}
      <div className="flex gap-2">
        {[25, 50, 75, 100].map((value) => (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`
              flex-1 py-1.5 text-xs rounded-lg border transition-all
              ${opacity === value
                ? 'bg-purple-500/20 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20'
              }
            `}
          >
            {value}%
          </button>
        ))}
      </div>
    </div>
  );
};

export default OpacityControl;
