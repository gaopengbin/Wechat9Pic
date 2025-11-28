/**
 * PreviewGrid - 效果预览网格组件
 * Validates: Requirements 5.1, 5.4, 5.5
 */

import type { ProcessedImage } from '@/types';

interface PreviewGridProps {
  images: ProcessedImage[];
  title?: string;
  compact?: boolean;
}

export default function PreviewGrid({ images, compact = false }: PreviewGridProps) {
  if (images.length === 0) return null;

  // 按位置排序
  const sortedImages = [...images].sort((a, b) => a.position - b.position);

  return (
    <div className={`w-full ${compact ? 'max-w-md' : ''} mx-auto`}>
      <div className={`grid grid-cols-3 ${compact ? 'gap-3' : 'gap-4'} p-2`}>
        {Array.from({ length: 9 }).map((_, i) => {
          const image = sortedImages.find((img) => img.position === i);

          return (
            <div key={i} className="relative aspect-square">
              {image ? (
                <div className="relative w-full h-full group">
                  <img
                    src={image.processedData}
                    alt={`预览 ${i + 1}`}
                    className={`w-full h-full object-cover rounded-xl shadow-lg`}
                  />
                  {/* 位置指示器 - compact模式下隐藏 */}
                  {!compact && (
                    <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md text-white/90 text-xs px-2 py-1 rounded-lg border border-white/10">
                      {i + 1}
                    </div>
                  )}
                  {/* 效果标签 - compact模式下隐藏 */}
                  {!compact && image.appliedEffects.filter?.preset && (
                    <div className="absolute top-2 right-2 bg-pink-500/80 backdrop-blur-md text-white text-xs px-2 py-1 rounded-lg shadow-lg border border-white/10">
                      {image.appliedEffects.filter.preset}
                    </div>
                  )}
                </div>
              ) : (
                <div className={`w-full h-full bg-white/5 border border-white/10 rounded-xl flex items-center justify-center`}>
                  <span className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>{i + 1}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 效果参数卡片 - compact模式下隐藏 */}
      {!compact && sortedImages.length > 0 && sortedImages[0].appliedEffects.filter && (
        <div className="mt-4 bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
          <div className="grid grid-cols-3 gap-4 text-xs">
            {sortedImages[0].appliedEffects.filter.brightness !== undefined && (
              <div className="text-center">
                <div className="text-gray-400 mb-1">亮度</div>
                <div className="text-white font-bold text-sm">
                  {sortedImages[0].appliedEffects.filter.brightness > 0 ? '+' : ''}
                  {sortedImages[0].appliedEffects.filter.brightness}
                </div>
              </div>
            )}
            {sortedImages[0].appliedEffects.filter.contrast !== undefined && (
              <div className="text-center">
                <div className="text-gray-400 mb-1">对比度</div>
                <div className="text-white font-bold text-sm">
                  {sortedImages[0].appliedEffects.filter.contrast > 0 ? '+' : ''}
                  {sortedImages[0].appliedEffects.filter.contrast}
                </div>
              </div>
            )}
            {sortedImages[0].appliedEffects.filter.saturation !== undefined && (
              <div className="text-center">
                <div className="text-gray-400 mb-1">饱和度</div>
                <div className="text-white font-bold text-sm">
                  {sortedImages[0].appliedEffects.filter.saturation > 0 ? '+' : ''}
                  {sortedImages[0].appliedEffects.filter.saturation}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
