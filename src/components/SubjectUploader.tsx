/**
 * SubjectUploader - 主体图片上传组件
 * Validates: Requirements 2.1, 2.5
 */

import React, { useCallback, useRef } from 'react';

interface SubjectUploaderProps {
  onUpload: (imageData: string) => void;
  isProcessing: boolean;
  progress: number;
  disabled?: boolean;
}

export const SubjectUploader: React.FC<SubjectUploaderProps> = ({
  onUpload,
  isProcessing,
  progress,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    if (!disabled && !isProcessing) {
      inputRef.current?.click();
    }
  }, [disabled, isProcessing]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小 (最大10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过10MB');
      return;
    }

    // 读取文件
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      if (imageData) {
        onUpload(imageData);
      }
    };
    reader.onerror = () => {
      alert('读取文件失败');
    };
    reader.readAsDataURL(file);

    // 清空input以允许重复选择同一文件
    e.target.value = '';
  }, [onUpload]);

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={`
          w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300
          ${disabled || isProcessing
            ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5'
          }
        `}
      >
        {isProcessing ? '处理中...' : '+ 添加主体'}
      </button>

      {/* 进度条 */}
      {isProcessing && (
        <div className="space-y-2">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 text-center">
            {progress < 30 ? '加载AI模型...' :
              progress < 80 ? '正在抠图...' :
                '完成处理...'}
          </p>
        </div>
      )}

      {disabled && !isProcessing && (
        <p className="text-xs text-gray-500 text-center">
          已达到最大图层数
        </p>
      )}
    </div>
  );
};

export default SubjectUploader;
