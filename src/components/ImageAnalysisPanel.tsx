/**
 * ImageAnalysisPanel - 图片分析面板组件
 * 显示人脸检测结果和智能调整选项
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { faceDetectionService, DetectionResult } from '@/services/FaceDetectionService';
import { useToast } from './Toast';

interface ImageAnalysisPanelProps {
  imageData: string;
  imageWidth: number;
  imageHeight: number;
  onClose: () => void;
  onApplyCrop: (croppedImage: string) => void;
}

// 裁剪模式类型
type CropMode = 'single' | 'group';

export default function ImageAnalysisPanel({
  imageData,
  imageWidth,
  imageHeight,
  onClose,
  onApplyCrop,
}: ImageAnalysisPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [previewCrop, setPreviewCrop] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState<CropMode>('single');
  const [selectedFaceIndex, setSelectedFaceIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { showToast } = useToast();

  // 分析图片
  useEffect(() => {
    let cancelled = false;

    const analyze = async () => {
      setIsAnalyzing(true);
      try {
        const detectionResult = await faceDetectionService.detectFaces(imageData);
        if (!cancelled) {
          setResult(detectionResult);
        }
      } catch (error) {
        console.error('Analysis failed:', error);
        if (!cancelled) {
          showToast('分析失败', 'error');
        }
      } finally {
        if (!cancelled) {
          setIsAnalyzing(false);
        }
      }
    };

    analyze();

    return () => {
      cancelled = true;
    };
  }, [imageData, showToast]);

  // 获取当前选中的人脸（单人模式）或所有人脸的包围盒（多人模式）
  const getTargetFace = useCallback(() => {
    if (!result || result.faces.length === 0) return null;
    
    if (cropMode === 'single') {
      return result.faces[selectedFaceIndex] || result.faces[0];
    } else {
      // 多人同框模式：计算所有人脸的包围盒
      const minX = Math.min(...result.faces.map(f => f.x));
      const minY = Math.min(...result.faces.map(f => f.y));
      const maxX = Math.max(...result.faces.map(f => f.x + f.width));
      const maxY = Math.max(...result.faces.map(f => f.y + f.height));
      
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        confidence: Math.max(...result.faces.map(f => f.confidence)),
      };
    }
  }, [result, cropMode, selectedFaceIndex]);

  // 绘制检测结果 - 显示九宫格裁剪区域和人脸位置
  useEffect(() => {
    if (!result || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // 计算九宫格显示区域（正方形）
      const gridCrop = result.gridCrop || {
        x: (img.width - Math.min(img.width, img.height)) / 2,
        y: (img.height - Math.min(img.width, img.height)) / 2,
        size: Math.min(img.width, img.height),
      };

      // Canvas 只显示九宫格区域
      const displaySize = 280;
      canvas.width = displaySize;
      canvas.height = displaySize;

      // 绘制九宫格裁剪区域
      ctx.drawImage(
        img,
        gridCrop.x, gridCrop.y, gridCrop.size, gridCrop.size,
        0, 0, displaySize, displaySize
      );

      const scale = displaySize / gridCrop.size;

      // 绘制所有人脸框（相对于九宫格区域）
      const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
      result.faces.forEach((face, index) => {
        const x = (face.x - gridCrop.x) * scale;
        const y = (face.y - gridCrop.y) * scale;
        const w = face.width * scale;
        const h = face.height * scale;

        // 跳过完全在视图外的人脸
        if (x + w < 0 || y + h < 0 || x > displaySize || y > displaySize) return;

        const isSelected = cropMode === 'single' && index === selectedFaceIndex;
        const isGroupMode = cropMode === 'group';
        const color = isSelected || isGroupMode ? colors[index % colors.length] : '#6b7280';

        // 人脸框
        ctx.strokeStyle = color;
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.setLineDash([]);
        ctx.strokeRect(x, y, w, h);

        // 置信度标签
        const confidence = Math.round(face.confidence * 100);
        const label = `#${index + 1} ${confidence}%`;
        const labelWidth = 55;
        ctx.fillStyle = color;
        ctx.fillRect(x, Math.max(0, y - 18), labelWidth, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px sans-serif';
        ctx.fillText(label, x + 4, Math.max(13, y - 5));
      });

      // 多人同框模式：绘制包围盒
      if (cropMode === 'group' && result.faces.length > 1) {
        const targetFace = getTargetFace();
        if (targetFace) {
          const x = (targetFace.x - gridCrop.x) * scale;
          const y = (targetFace.y - gridCrop.y) * scale;
          const w = targetFace.width * scale;
          const h = targetFace.height * scale;

          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2;
          ctx.strokeRect(x - 10, y - 10, w + 20, h + 20);
        }
      }

      // 绘制建议裁剪区域
      const targetFace = getTargetFace();
      if (targetFace) {
        const crop = faceDetectionService.calculateSmartCrop(
          img.width,
          img.height,
          targetFace,
          1
        );

        // 转换到九宫格坐标系
        const cropX = (crop.x - gridCrop.x) * scale;
        const cropY = (crop.y - gridCrop.y) * scale;
        const cropW = crop.width * scale;
        const cropH = crop.height * scale;

        ctx.setLineDash([6, 3]);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(cropX, cropY, cropW, cropH);
      }
    };
    img.src = imageData;
  }, [result, imageData, cropMode, selectedFaceIndex, getTargetFace]);

  // 生成预览裁剪
  const handlePreviewCrop = useCallback(async () => {
    const targetFace = getTargetFace();
    if (!targetFace) return;

    try {
      const crop = faceDetectionService.calculateSmartCrop(
        imageWidth,
        imageHeight,
        targetFace,
        1
      );
      const cropped = await faceDetectionService.applyCrop(imageData, crop);
      setPreviewCrop(cropped);
    } catch (error) {
      console.error('Preview crop failed:', error);
      showToast('预览失败', 'error');
    }
  }, [getTargetFace, imageData, imageWidth, imageHeight, showToast]);

  // 应用裁剪
  const handleApplyCrop = useCallback(async () => {
    const targetFace = getTargetFace();
    if (!targetFace) return;

    try {
      const crop = faceDetectionService.calculateSmartCrop(
        imageWidth,
        imageHeight,
        targetFace,
        1
      );
      const cropped = await faceDetectionService.applyCrop(imageData, crop);
      onApplyCrop(cropped);
      showToast('已应用智能裁剪', 'success');
      onClose();
    } catch (error) {
      console.error('Apply crop failed:', error);
      showToast('裁剪失败', 'error');
    }
  }, [getTargetFace, imageData, imageWidth, imageHeight, onApplyCrop, onClose, showToast]);

  // 切换模式时重置预览
  useEffect(() => {
    setPreviewCrop(null);
  }, [cropMode, selectedFaceIndex]);

  // 获取内容类型标签
  const getContentTypeLabel = () => {
    if (!result) return '';
    if (result.isPortrait) {
      return result.faces.length > 1 ? '多人合影' : '人像照片';
    }
    return '非人像照片';
  };

  // 获取建议图标和颜色
  const getSuggestionStyle = () => {
    if (!result) return { icon: '⏳', color: 'text-gray-400', bg: 'bg-gray-500/20' };

    switch (result.suggestion) {
      case 'ok':
        return { icon: '✓', color: 'text-green-400', bg: 'bg-green-500/20' };
      case 'adjust':
        return { icon: '⚠', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
      case 'no-face':
        return { icon: 'ℹ', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    }
  };

  const suggestionStyle = getSuggestionStyle();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel rounded-2xl max-w-3xl w-full p-6 border border-white/10 shadow-2xl">
        {/* 标题 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            图片分析
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 分析中状态 */}
        {isAnalyzing && (
          <div className="flex flex-col items-center py-12">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-300">正在分析图片...</p>
          </div>
        )}

        {/* 分析结果 - 左右布局 */}
        {!isAnalyzing && result && (
          <div className="flex gap-6">
            {/* 左侧：图片预览 */}
            <div className="flex-shrink-0">
              <p className="text-xs text-gray-400 mb-2">九宫格显示区域</p>
              <div className="bg-black/30 rounded-xl p-2">
                <canvas ref={canvasRef} className="rounded-lg" style={{ width: 280, height: 280 }} />
              </div>
              {result.mainFace && (
                <div className="mt-2 flex gap-2 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-500 rounded"></span>
                    人脸位置
                  </span>
                  {result.suggestion === 'adjust' && (
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 border-2 border-dashed border-yellow-500 rounded"></span>
                      建议裁剪
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 右侧：检测结果信息 */}
            <div className="flex-1 flex flex-col">
              <div className="space-y-3 flex-1">
                {/* 照片类型 */}
                <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <span className="text-2xl">
                    {result.isPortrait ? '👤' : '🖼️'}
                  </span>
                  <div>
                    <p className="text-sm text-gray-400">照片类型</p>
                    <p className="text-white font-medium">{getContentTypeLabel()}</p>
                  </div>
                </div>

                {/* 多人照片模式选择 */}
                {result.faces.length > 1 && (
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-sm text-gray-400 mb-2">裁剪模式</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCropMode('single')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          cropMode === 'single'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        👤 单人聚焦
                      </button>
                      <button
                        onClick={() => setCropMode('group')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          cropMode === 'group'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        👥 多人同框
                      </button>
                    </div>
                  </div>
                )}

                {/* 单人模式下的人脸选择 */}
                {cropMode === 'single' && result.faces.length > 1 && (
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-sm text-gray-400 mb-2">选择人物 ({result.faces.length} 人)</p>
                    <div className="flex flex-wrap gap-2">
                      {result.faces.map((face, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedFaceIndex(index)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            selectedFaceIndex === index
                              ? 'bg-green-600 text-white'
                              : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}
                        >
                          #{index + 1} ({Math.round(face.confidence * 100)}%)
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 人脸置信度 */}
                {result.faces.length > 0 && (
                  <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                    <span className="text-2xl">{cropMode === 'group' ? '👥' : '😊'}</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-400">
                        {cropMode === 'group' ? '多人同框' : `人物 #${selectedFaceIndex + 1} 置信度`}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
                            style={{ width: `${Math.round((getTargetFace()?.confidence || 0) * 100)}%` }}
                          />
                        </div>
                        <span className="text-white font-medium text-sm">
                          {Math.round((getTargetFace()?.confidence || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 分析建议 */}
                <div className={`flex items-center gap-3 rounded-xl p-3 ${suggestionStyle.bg}`}>
                  <span className={`text-2xl ${suggestionStyle.color}`}>
                    {suggestionStyle.icon}
                  </span>
                  <div>
                    <p className="text-sm text-gray-400">分析建议</p>
                    <p className={`font-medium ${suggestionStyle.color}`}>{result.message}</p>
                  </div>
                </div>

                {/* 裁剪预览 */}
                {previewCrop && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">裁剪预览</p>
                    <div className="bg-black/30 rounded-xl p-2 inline-block">
                      <img
                        src={previewCrop}
                        alt="裁剪预览"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-4 mt-auto">
                {result.faces.length > 0 && (
                  <>
                    {!previewCrop ? (
                      <button
                        onClick={handlePreviewCrop}
                        className="flex-1 px-4 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        预览裁剪
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyCrop}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        应用裁剪
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={onClose}
                  className={`${result.faces.length === 0 ? 'flex-1' : ''} px-4 py-2.5 bg-white/10 text-gray-300 rounded-xl hover:bg-white/20 transition-colors font-medium text-sm`}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
