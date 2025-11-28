/**
 * ImageThumbnail - 图片缩略图组件
 * Validates: Requirements 5.2, 5.3
 */

import type { ImageData } from '@/types';

interface ImageThumbnailProps {
  image: ImageData;
  onDelete: () => void;
  onEdit?: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export default function ImageThumbnail({
  image,
  onDelete,
  onEdit,
  onDragStart,
  onDragEnd,
}: ImageThumbnailProps) {
  return (
    <div
      className="relative w-full h-full group cursor-move"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* 图片 */}
      <img
        src={image.thumbnail}
        alt={`Position ${image.position}`}
        className="w-full h-full object-cover rounded-xl"
      />

      {/* 悬停遮罩 */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 rounded-xl backdrop-blur-[2px]" />

      {/* 编辑按钮 */}
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="
            absolute top-2 right-12
            w-8 h-8 rounded-full
            bg-purple-500/80 text-white
            opacity-0 group-hover:opacity-100
            transition-all duration-300
            flex items-center justify-center
            hover:bg-purple-600 hover:scale-110
            backdrop-blur-sm
            shadow-lg
          "
          aria-label="编辑图片"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      )}

      {/* 删除按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="
          absolute top-2 right-2
          w-8 h-8 rounded-full
          bg-red-500/80 text-white
          opacity-0 group-hover:opacity-100
          transition-all duration-300
          flex items-center justify-center
          hover:bg-red-600 hover:scale-110
          backdrop-blur-sm
          shadow-lg
        "
        aria-label="删除图片"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* 位置指示器 */}
      <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md text-white/90 text-xs px-2 py-1 rounded-lg border border-white/10">
        {image.position + 1}
      </div>

      {/* 拖拽提示 */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <svg className="w-5 h-5 text-white/80 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 3L5 7h3v7H5l4 4 4-4h-3V7h3L9 3zm7 14h-3v-7h3l-4-4-4 4h3v7h-3l4 4 4-4z" />
        </svg>
      </div>
    </div>
  );
}
