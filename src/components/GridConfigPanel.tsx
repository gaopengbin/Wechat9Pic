/**
 * GridConfigPanel - 底图配置面板组件
 * Validates: Requirements 1.4, 1.5
 */

import React, { useCallback } from 'react';
import { LAYER_CONSTRAINTS } from '@/types';

interface GridConfig {
  borderWidth: number;
  borderColor: string;
}

interface GridConfigPanelProps {
  config: GridConfig;
  onChange: (config: Partial<GridConfig>) => void;
}

const PRESET_COLORS = [
  { name: '白色', value: '#FFFFFF' },
  { name: '黑色', value: '#000000' },
  { name: '灰色', value: '#808080' },
  { name: '米色', value: '#F5F5DC' },
];

export const GridConfigPanel: React.FC<GridConfigPanelProps> = ({
  config,
  onChange,
}) => {
  const handleBorderWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onChange({
      borderWidth: Math.max(
        LAYER_CONSTRAINTS.borderWidth.min,
        Math.min(LAYER_CONSTRAINTS.borderWidth.max, value)
      )
    });
  }, [onChange]);

  const handleBorderColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ borderColor: e.target.value });
  }, [onChange]);

  const handlePresetColorClick = useCallback((color: string) => {
    onChange({ borderColor: color });
  }, [onChange]);

  return (
    <div className="p-4 space-y-4 glass-panel rounded-xl border border-white/10">
      <h3 className="text-sm font-medium text-gray-300">底图配置</h3>

      {/* 边框宽度 */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>边框宽度</span>
          <span>{config.borderWidth}px</span>
        </div>
        <input
          type="range"
          min={LAYER_CONSTRAINTS.borderWidth.min}
          max={LAYER_CONSTRAINTS.borderWidth.max}
          value={config.borderWidth}
          onChange={handleBorderWidthChange}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{LAYER_CONSTRAINTS.borderWidth.min}px</span>
          <span>{LAYER_CONSTRAINTS.borderWidth.max}px</span>
        </div>
      </div>

      {/* 边框颜色 */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>边框颜色</span>
          <span>{config.borderColor}</span>
        </div>

        {/* 预设颜色 */}
        <div className="flex gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetColorClick(preset.value)}
              className={`
                w-8 h-8 rounded-lg border transition-all
                ${config.borderColor === preset.value
                  ? 'border-purple-500 ring-2 ring-purple-500/30'
                  : 'border-white/10 hover:border-white/30'
                }
              `}
              style={{ backgroundColor: preset.value }}
              title={preset.name}
            />
          ))}
        </div>

        {/* 自定义颜色 */}
        <div className="flex gap-2">
          <input
            type="color"
            value={config.borderColor}
            onChange={handleBorderColorChange}
            className="w-10 h-10 rounded-lg cursor-pointer border border-white/10 bg-transparent p-0"
          />
          <input
            type="text"
            value={config.borderColor}
            onChange={handleBorderColorChange}
            placeholder="#FFFFFF"
            className="flex-1 px-3 py-2 text-sm bg-black/20 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* 预览 */}
      <div className="space-y-2">
        <span className="text-xs text-gray-400">预览</span>
        <div
          className="w-full h-20 rounded-lg overflow-hidden border border-white/10"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: `${config.borderWidth}px`,
            backgroundColor: config.borderColor,
            padding: `${config.borderWidth}px`,
          }}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-sm" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GridConfigPanel;
