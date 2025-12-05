/**
 * UploadZone - 文件上传区域组件
 * Validates: Requirements 1.1, 1.2
 */

import { useRef, useState } from 'react';
import { SUPPORTED_IMAGE_FORMATS } from '@/types/constants';

interface UploadZoneProps {
  position: number;
  onFileSelect: (file: File, position: number) => void;
  onMultipleFilesSelect?: (files: File[]) => void;
}

export default function UploadZone({ position, onFileSelect, onMultipleFilesSelect }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 如果选择了多个文件且提供了批量处理函数
    if (files.length > 1 && onMultipleFilesSelect) {
      const fileArray = Array.from(files);
      onMultipleFilesSelect(fileArray);
    } else {
      // 单个文件
      const file = files[0];
      if (file) {
        onFileSelect(file, position);
      }
    }

    // 重置input以允许重复选择相同文件
    e.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    // 如果拖拽了多个文件且提供了批量处理函数
    if (files.length > 1 && onMultipleFilesSelect) {
      const fileArray = Array.from(files);
      onMultipleFilesSelect(fileArray);
    } else {
      // 单个文件
      const file = files[0];
      if (file) {
        onFileSelect(file, position);
      }
    }
  };

  return (
    <div
      className={`
        w-full h-full flex flex-col items-center justify-center
        border-2 border-dashed rounded-xl cursor-pointer
        transition-all duration-300
        ${isDragging
          ? 'border-purple-500 bg-purple-500/20 scale-95'
          : 'border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-white/10'
        }
      `}
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={[...SUPPORTED_IMAGE_FORMATS, '.heic', '.heif'].join(',')}
        onChange={handleFileChange}
        multiple
        className="hidden"
      />
      <div className={`p-3 rounded-full mb-2 transition-colors ${isDragging ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-gray-400 group-hover:text-purple-300'}`}>
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </div>
      <p className="text-sm text-gray-300 font-medium">点击或拖拽上传</p>
      <p className="text-xs text-gray-500 mt-1">支持多选</p>
    </div>
  );
}
