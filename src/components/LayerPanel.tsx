/**
 * LayerPanel - 图层面板组件
 * Validates: Requirements 5.2, 5.3, 5.4
 */

import React, { useCallback } from 'react';
import { Layer } from '@/types';

interface LayerPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelect: (layerId: string) => void;
  onDelete: (layerId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onToggleVisibility: (layerId: string) => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  selectedLayerId,
  onSelect,
  onDelete,
  onReorder,
  onToggleVisibility,
}) => {
  // 按zIndex降序排列（高的在上面）
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex);
    }
  }, [onReorder]);

  return (
    <div className="p-2">
      <h3 className="text-sm font-medium text-gray-400 mb-3 px-2">图层列表</h3>
      <div className="space-y-2">
        {sortedLayers.map((layer, index) => (
          <div
            key={layer.id}
            draggable={layer.type !== 'background'}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onClick={() => onSelect(layer.id)}
            className={`
              flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200
              ${selectedLayerId === layer.id
                ? 'bg-purple-500/20 border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.1)]'
                : 'bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10'
              }
            `}
          >
            {/* 缩略图 */}
            <div className="w-10 h-10 bg-black/20 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
              <img
                src={layer.imageData}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>

            {/* 图层信息 */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${selectedLayerId === layer.id ? 'text-white' : 'text-gray-300'}`}>
                {layer.type === 'background' ? '底图' : `主体 ${index}`}
              </p>
              <p className="text-xs text-gray-500">
                透明度: {layer.opacity}%
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-1">
              {/* 可见性切换 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(layer.id);
                }}
                className={`p-1.5 rounded-lg transition-colors ${layer.visible ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-400'}`}
                title={layer.visible ? '隐藏' : '显示'}
              >
                {layer.visible ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>

              {/* 删除按钮（背景图层不可删除） */}
              {layer.type !== 'background' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(layer.id);
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="删除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayerPanel;
