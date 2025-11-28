/**
 * ExportDialog - 导出对话框组件
 * Validates: Requirements 6.1, 6.2, 6.4, 6.5
 */

import { useState } from 'react';
import type { ProcessedImage, ExportFormat } from '@/types';
import { exportService } from '@/services/ExportService';
import { formatFileSize } from '@/utils/helpers';

interface ExportDialogProps {
  images: ProcessedImage[];
  onClose: () => void;
}

export default function ExportDialog({ images, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportType, setExportType] = useState<'all' | 'single'>('all');

  const estimatedSize = exportService.estimateFileSize(images);

  const handleExportAll = async () => {
    setIsExporting(true);
    setProgress(0);

    try {
      await exportService.downloadAll(images, format, (current, total) => {
        setProgress(Math.round((current / total) * 100));
      });

      // 导出成功
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSingle = async (image: ProcessedImage) => {
    setIsExporting(true);

    try {
      await exportService.downloadSingle(image, format);
      alert('导出成功！');
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">导出图片</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isExporting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 导出类型选择 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">导出方式</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setExportType('all')}
              className={`
                p-4 rounded-xl border transition-all duration-300
                ${exportType === 'all'
                  ? 'border-purple-500 bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-white/10'
                }
              `}
              disabled={isExporting}
            >
              <div className="text-3xl mb-2">📦</div>
              <div className="font-medium text-white">批量导出</div>
              <div className="text-xs text-gray-400 mt-1">导出所有图片为ZIP</div>
            </button>
            <button
              onClick={() => setExportType('single')}
              className={`
                p-4 rounded-xl border transition-all duration-300
                ${exportType === 'single'
                  ? 'border-purple-500 bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-white/10'
                }
              `}
              disabled={isExporting}
            >
              <div className="text-3xl mb-2">🖼️</div>
              <div className="font-medium text-white">单张导出</div>
              <div className="text-xs text-gray-400 mt-1">选择单张图片导出</div>
            </button>
          </div>
        </div>

        {/* 格式选择 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">图片格式</label>
          <div className="flex gap-4">
            <button
              onClick={() => setFormat('png')}
              className={`
                flex-1 px-4 py-3 rounded-xl border transition-all duration-300
                ${format === 'png'
                  ? 'border-purple-500 bg-purple-500/20 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-white/10 text-gray-400'
                }
              `}
              disabled={isExporting}
            >
              <div className="font-medium">PNG</div>
              <div className="text-xs mt-1 opacity-80">无损压缩，质量最佳</div>
            </button>
            <button
              onClick={() => setFormat('jpg')}
              className={`
                flex-1 px-4 py-3 rounded-xl border transition-all duration-300
                ${format === 'jpg'
                  ? 'border-purple-500 bg-purple-500/20 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-white/10 text-gray-400'
                }
              `}
              disabled={isExporting}
            >
              <div className="font-medium">JPG</div>
              <div className="text-xs mt-1 opacity-80">文件更小，适合分享</div>
            </button>
          </div>
        </div>

        {/* 批量导出 */}
        {exportType === 'all' && (
          <div className="mb-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">图片数量</span>
                <span className="font-medium text-white">{images.length} 张</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">预计大小</span>
                <span className="font-medium text-white">{formatFileSize(estimatedSize)}</span>
              </div>
            </div>

            {isExporting && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>正在导出...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleExportAll}
              disabled={isExporting}
              className="
                w-full mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl
                hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:-translate-y-0.5
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                font-medium
              "
            >
              {isExporting ? '导出中...' : '导出所有图片'}
            </button>
          </div>
        )}

        {/* 单张导出 */}
        {exportType === 'single' && (
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-3">
              {images.map((image) => (
                <button
                  key={image.originalId}
                  onClick={() => handleExportSingle(image)}
                  disabled={isExporting}
                  className="
                    relative aspect-square rounded-xl overflow-hidden
                    border-2 border-white/10 hover:border-purple-500
                    transition-all disabled:opacity-50 disabled:cursor-not-allowed
                    group
                  "
                >
                  <img
                    src={image.processedData}
                    alt={`图片 ${image.position + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center backdrop-blur-[2px]">
                    <div className="text-white opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                      <svg className="w-8 h-8 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md text-white/90 text-xs px-2 py-1 rounded-lg border border-white/10">
                    {image.position + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 取消按钮 */}
        <button
          onClick={onClose}
          disabled={isExporting}
          className="
            w-full px-6 py-3 bg-white/10 text-gray-300 rounded-xl
            hover:bg-white/20 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            font-medium
          "
        >
          取消
        </button>
      </div>
    </div>
  );
}
