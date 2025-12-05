/**
 * SubjectUploader - 主体图片上传组件
 * Validates: Requirements 2.1, 2.5
 */

import React, { useCallback, useRef, useState } from 'react';
import { useToast } from './Toast';
import { isHeicFile, processFileForUpload } from '@/utils/helpers';

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
  const { showToast } = useToast();

  const handleClick = useCallback(() => {
    if (!disabled && !isProcessing) {
      inputRef.current?.click();
    }
  }, [disabled, isProcessing]);

  const [isConverting, setIsConverting] = useState(false);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型（包括 HEIC）
    const isImage = file.type.startsWith('image/') || isHeicFile(file);
    if (!isImage) {
      showToast('请选择图片文件', 'error');
      return;
    }

    // 验证文件大小 (最大10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('图片大小不能超过10MB', 'error');
      return;
    }

    try {
      // 如果是 HEIC 格式，显示转换提示
      if (isHeicFile(file)) {
        setIsConverting(true);
      }

      // 处理文件（HEIC 转 JPEG）
      const processedFile = await processFileForUpload(file);

      // 读取文件
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        if (imageData) {
          onUpload(imageData);
        }
        setIsConverting(false);
      };
      reader.onerror = () => {
        showToast('读取文件失败', 'error');
        setIsConverting(false);
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      console.error('File processing error:', error);
      showToast('HEIC 格式转换失败', 'error');
      setIsConverting(false);
    }

    // 清空input以允许重复选择同一文件
    e.target.value = '';
  }, [onUpload, showToast]);

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={handleClick}
        disabled={disabled || isProcessing || isConverting}
        className={`
          w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300
          ${disabled || isProcessing || isConverting
            ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5'
          }
        `}
      >
        {isConverting ? '转换 HEIC...' : isProcessing ? '处理中...' : '+ 添加主体'}
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
