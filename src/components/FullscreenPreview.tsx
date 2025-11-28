/**
 * FullscreenPreview - 全屏预览组件
 * Validates: Requirements 8.2, 8.3, 8.4
 */

import React, { useCallback, useEffect } from 'react';

interface FullscreenPreviewProps {
  imageUrl: string;
  onClose: () => void;
  onExport?: () => void;
}

export const FullscreenPreview: React.FC<FullscreenPreviewProps> = ({
  imageUrl,
  onClose,
  onExport,
}) => {
  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll when fullscreen is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex flex-col"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="全屏预览"
    >
      {/* Header with controls */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="text-white/60 text-sm font-medium px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          按 ESC 退出全屏
        </div>
        <div className="flex items-center gap-3">
          {onExport && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExport();
              }}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:-translate-y-0.5 text-sm font-medium"
            >
              导出图片
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10"
            aria-label="关闭预览"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Image container */}
      <div className="flex-1 flex items-center justify-center p-8">
        <img
          src={imageUrl}
          alt="全屏预览"
          className="max-w-full max-h-full object-contain shadow-2xl drop-shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          style={{ maxHeight: 'calc(100vh - 100px)' }}
        />
      </div>

      {/* Footer hint */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
        <div className="text-white/40 text-xs tracking-wider uppercase">
          点击空白区域或按 ESC 退出
        </div>
      </div>
    </div>
  );
};

export default FullscreenPreview;
