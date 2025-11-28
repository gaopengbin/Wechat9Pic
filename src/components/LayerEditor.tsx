/**
 * LayerEditor - 图层编辑器主组件
 * Validates: Requirements 8.1, 8.2
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Layer, LayerTransformConfig, LayerShadowConfig, ImageData } from '@/types';
import { LayerManager } from '@/services/LayerManager';
import { MattingService } from '@/services/MattingService';
import { ExportService } from '@/services/ExportService';
import { GridGenerator } from '@/services/GridGenerator';
import { LayerPanel } from './LayerPanel.js';
import { TransformControls } from './TransformControls.js';
import { ShadowControls } from './ShadowControls.js';
import { OpacityControl } from './OpacityControl.js';
import { SubjectUploader } from './SubjectUploader.js';
import ImageEditor from './ImageEditor.js';

interface LayerEditorProps {
  backgroundImage: string; // 九宫格底图
  originalImages: ImageData[]; // 原始9张图片
  onExport: (blob: Blob) => void;
  onClose: () => void;
}

export const LayerEditor: React.FC<LayerEditorProps> = ({
  backgroundImage,
  originalImages,
  onExport,
  onClose,
}) => {
  const [layerManager] = useState(() => new LayerManager());
  const [mattingService] = useState(() => new MattingService());
  const [exportService] = useState(() => new ExportService());
  const [gridGenerator] = useState(() => new GridGenerator());

  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; layerX: number; layerY: number } | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);

  // 单张图片编辑状态
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [gridImages, setGridImages] = useState<string[]>([]);
  const [currentBackgroundImage, setCurrentBackgroundImage] = useState<string>(backgroundImage);

  // 九宫格预览状态
  const [showGridPreview, setShowGridPreview] = useState(false);
  const [gridPreviewImages, setGridPreviewImages] = useState<string[]>([]);

  // 获取选中的图层
  const selectedLayer = layers.find(l => l.id === selectedLayerId) || null;

  // 初始化gridImages
  useEffect(() => {
    const images = originalImages.map(img => img.fullSize);
    setGridImages(images);
  }, [originalImages]);

  // 初始化背景图层
  useEffect(() => {
    const bgLayer = layerManager.addLayer(currentBackgroundImage, 'background');
    if (bgLayer) {
      setLayers(layerManager.getLayers());
    }
  }, [currentBackgroundImage, layerManager]);

  // 更新预览
  const updatePreview = useCallback(async () => {
    try {
      // Generate preview at full resolution for accurate display
      const preview = await exportService.generateLayerPreview(layers);
      setPreviewUrl(preview);
    } catch (err) {
      console.error('Preview update failed:', err);
    }
  }, [layers, exportService]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  // 上传并处理主体图片
  const handleSubjectUpload = useCallback(async (imageData: string) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      // 加载AI模型
      setProcessingProgress(10);
      await mattingService.loadModel();

      // 执行抠图
      setProcessingProgress(30);
      const result = await mattingService.removeBackground(imageData);

      if (!result.success || !result.imageData) {
        throw new Error(result.error || '抠图失败');
      }

      setProcessingProgress(80);

      // 添加到图层
      const newLayer = layerManager.addLayer(result.imageData, 'subject');
      if (!newLayer) {
        throw new Error('图层数量已达上限（最多5个）');
      }

      setLayers(layerManager.getLayers());
      setSelectedLayerId(newLayer.id);
      setProcessingProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, [mattingService, layerManager]);

  // 选择图层
  const handleSelectLayer = useCallback((layerId: string) => {
    setSelectedLayerId(layerId);
  }, []);

  // 删除图层
  const handleDeleteLayer = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer?.type === 'background') {
      setError('不能删除背景图层');
      return;
    }

    layerManager.removeLayer(layerId);
    setLayers(layerManager.getLayers());

    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
  }, [layers, layerManager, selectedLayerId]);

  // 重新排序图层
  const handleReorderLayers = useCallback((fromIndex: number, toIndex: number) => {
    layerManager.reorderLayers(fromIndex, toIndex);
    setLayers(layerManager.getLayers());
  }, [layerManager]);

  // 切换图层可见性
  const handleToggleVisibility = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      layerManager.updateLayer(layerId, { visible: !layer.visible });
      setLayers(layerManager.getLayers());
    }
  }, [layers, layerManager]);

  // 更新变换参数
  const handleTransformChange = useCallback((transform: Partial<LayerTransformConfig>) => {
    if (!selectedLayerId) return;
    layerManager.updateLayer(selectedLayerId, { transform: { ...selectedLayer!.transform, ...transform } });
    setLayers(layerManager.getLayers());
  }, [selectedLayerId, selectedLayer, layerManager]);

  // 更新阴影参数
  const handleShadowChange = useCallback((shadow: Partial<LayerShadowConfig>) => {
    if (!selectedLayerId) return;
    layerManager.updateLayer(selectedLayerId, { shadow: { ...selectedLayer!.shadow, ...shadow } });
    setLayers(layerManager.getLayers());
  }, [selectedLayerId, selectedLayer, layerManager]);

  // 更新透明度
  const handleOpacityChange = useCallback((opacity: number) => {
    if (!selectedLayerId) return;
    layerManager.updateLayer(selectedLayerId, { opacity });
    setLayers(layerManager.getLayers());
  }, [selectedLayerId, layerManager]);

  // 编辑单张图片
  const handleEditImage = useCallback((index: number) => {
    setEditingImageIndex(index);
  }, []);

  // 保存编辑后的图片
  const handleSaveEditedImage = useCallback(async (editedImage: string) => {
    if (editingImageIndex === null) return;
    
    setIsProcessing(true);
    try {
      // 更新gridImages
      const newGridImages = [...gridImages];
      newGridImages[editingImageIndex] = editedImage;
      setGridImages(newGridImages);

      // 重新生成九宫格底图
      const result = await gridGenerator.generateGridBackground(newGridImages, {
        borderWidth: 2,
        borderColor: '#FFFFFF',
      });
      
      if (result.success && result.imageData) {
        // 更新背景图层
        setCurrentBackgroundImage(result.imageData);
        
        // 更新layerManager中的背景图层
        const bgLayer = layers.find(l => l.type === 'background');
        if (bgLayer) {
          layerManager.updateLayer(bgLayer.id, { imageData: result.imageData });
          setLayers(layerManager.getLayers());
        }
      }
    } catch (err) {
      setError('更新背景失败');
    } finally {
      setIsProcessing(false);
      setEditingImageIndex(null);
    }
  }, [editingImageIndex, gridImages, gridGenerator, layers, layerManager]);

  // 关闭图片编辑器
  const handleCloseImageEditor = useCallback(() => {
    setEditingImageIndex(null);
  }, []);

  // 生成九宫格切分预览
  const generateGridPreview = useCallback(async () => {
    if (!previewUrl) return;
    
    setIsProcessing(true);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = previewUrl;
      });

      const size = img.width;
      const cellSize = Math.floor(size / 3);
      const previews: string[] = [];

      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const canvas = document.createElement('canvas');
          canvas.width = cellSize;
          canvas.height = cellSize;
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          ctx.drawImage(
            img,
            col * cellSize,
            row * cellSize,
            cellSize,
            cellSize,
            0,
            0,
            cellSize,
            cellSize
          );

          previews.push(canvas.toDataURL('image/png'));
        }
      }

      setGridPreviewImages(previews);
      setShowGridPreview(true);
    } catch (err) {
      setError('生成预览失败');
    } finally {
      setIsProcessing(false);
    }
  }, [previewUrl]);

  // 关闭九宫格预览
  const handleCloseGridPreview = useCallback(() => {
    setShowGridPreview(false);
  }, []);

  // 预览区域鼠标拖拽处理
  const handlePreviewMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // 只有选中了主体图层时才能拖拽
    if (!selectedLayer || selectedLayer.type === 'background') return;
    
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      layerX: selectedLayer.transform.x,
      layerY: selectedLayer.transform.y,
    };
  }, [selectedLayer]);

  const handlePreviewMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current || !selectedLayerId || !selectedLayer) return;
    if (selectedLayer.type === 'background') return;

    const container = previewContainerRef.current;
    const image = previewImageRef.current;
    if (!container || !image) return;

    // 计算缩放比例：预览图相对于实际输出尺寸的比例
    const imageRect = image.getBoundingClientRect();
    const outputSize = 1080; // 默认输出尺寸
    const scaleRatio = outputSize / imageRect.width;

    const deltaX = (e.clientX - dragStartRef.current.x) * scaleRatio;
    const deltaY = (e.clientY - dragStartRef.current.y) * scaleRatio;

    const newX = Math.round(dragStartRef.current.layerX + deltaX);
    const newY = Math.round(dragStartRef.current.layerY + deltaY);

    layerManager.updateLayer(selectedLayerId, { 
      transform: { ...selectedLayer.transform, x: newX, y: newY } 
    });
    setLayers(layerManager.getLayers());
  }, [isDragging, selectedLayerId, selectedLayer, layerManager]);

  const handlePreviewMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // 全局鼠标事件处理（防止拖拽时鼠标移出预览区）
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !selectedLayerId || !selectedLayer) return;
      if (selectedLayer.type === 'background') return;

      const container = previewContainerRef.current;
      const image = previewImageRef.current;
      if (!container || !image) return;

      const imageRect = image.getBoundingClientRect();
      const outputSize = 1080;
      const scaleRatio = outputSize / imageRect.width;

      const deltaX = (e.clientX - dragStartRef.current.x) * scaleRatio;
      const deltaY = (e.clientY - dragStartRef.current.y) * scaleRatio;

      const newX = Math.round(dragStartRef.current.layerX + deltaX);
      const newY = Math.round(dragStartRef.current.layerY + deltaY);

      layerManager.updateLayer(selectedLayerId, { 
        transform: { ...selectedLayer.transform, x: newX, y: newY } 
      });
      setLayers(layerManager.getLayers());
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, selectedLayerId, selectedLayer, layerManager]);

  // 导出
  const handleExport = useCallback(async () => {
    setIsProcessing(true);
    try {
      const blob = await exportService.exportLayerComposition(layers);
      onExport(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败');
    } finally {
      setIsProcessing(false);
    }
  }, [layers, exportService, onExport]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-6 py-4 glass z-10 mx-4 mt-4 rounded-2xl">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-300 hover:text-white transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回
        </button>
        <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
          3D图层编辑
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={generateGridPreview}
            disabled={isProcessing || !previewUrl}
            className="px-4 py-2 border border-purple-500/50 text-purple-300 rounded-xl hover:bg-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            预览切图
          </button>
          <button
            onClick={handleExport}
            disabled={isProcessing}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            导出
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mx-4 mt-4 px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-white hover:text-red-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 主内容区 */}
      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        {/* 左侧：图层面板 */}
        <div className="w-64 glass-panel rounded-2xl overflow-hidden flex flex-col">
          {/* 九宫格图片缩略图 */}
          <div className="p-3 border-b border-white/10">
            <h4 className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              底图图片 (点击编辑)
            </h4>
            <div className="grid grid-cols-3 gap-1">
              {gridImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => handleEditImage(index)}
                  className="relative aspect-square rounded overflow-hidden border border-white/10 hover:border-purple-500 transition-colors group"
                  title={`编辑第${index + 1}张图片`}
                >
                  <img
                    src={img}
                    alt={`图片${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            <LayerPanel
              layers={layers}
              selectedLayerId={selectedLayerId}
              onSelect={handleSelectLayer}
              onDelete={handleDeleteLayer}
              onReorder={handleReorderLayers}
              onToggleVisibility={handleToggleVisibility}
            />
          </div>
          <div className="p-4 border-t border-white/10 bg-white/5">
            <SubjectUploader
              onUpload={handleSubjectUpload}
              isProcessing={isProcessing}
              progress={processingProgress}
              disabled={layers.length >= 5}
            />
          </div>
        </div>

        {/* 中间：预览区 */}
        <div className="flex-1 flex items-center justify-center p-8 glass-panel rounded-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20 pointer-events-none"></div>
          <div 
            ref={previewContainerRef}
            className="flex items-center justify-center w-full h-full relative z-10"
            onMouseDown={handlePreviewMouseDown}
            onMouseMove={handlePreviewMouseMove}
            onMouseUp={handlePreviewMouseUp}
            onMouseLeave={handlePreviewMouseUp}
            style={{ 
              cursor: selectedLayer && selectedLayer.type !== 'background' 
                ? (isDragging ? 'grabbing' : 'grab') 
                : 'default' 
            }}
          >
            {previewUrl ? (
              <img
                ref={previewImageRef}
                src={previewUrl}
                alt="预览"
                className="shadow-2xl rounded-lg max-w-full max-h-full object-contain select-none"
                draggable={false}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                <span>生成预览中...</span>
              </div>
            )}
            {/* 拖拽提示 */}
            {selectedLayer && selectedLayer.type !== 'background' && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-4 py-2 rounded-full text-xs text-white/70 pointer-events-none">
                拖动调整主体位置
              </div>
            )}
          </div>
        </div>

        {/* 右侧：属性面板 */}
        <div className="w-72 glass-panel rounded-2xl overflow-y-auto custom-scrollbar">
          {selectedLayer && selectedLayer.type !== 'background' ? (
            <div className="p-6 space-y-6">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                图层属性
              </h3>

              <TransformControls
                transform={selectedLayer.transform}
                onChange={handleTransformChange}
              />

              <div className="h-px bg-white/10"></div>

              <ShadowControls
                shadow={selectedLayer.shadow}
                onChange={handleShadowChange}
              />

              <div className="h-px bg-white/10"></div>

              <OpacityControl
                opacity={selectedLayer.opacity}
                onChange={handleOpacityChange}
              />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-400">
              <div className="text-4xl mb-4 opacity-50">👆</div>
              <p>选择一个主体图层<br />来编辑属性</p>
            </div>
          )}
        </div>
      </div>

      {/* 单张图片编辑器 */}
      {editingImageIndex !== null && originalImages[editingImageIndex] && (
        <ImageEditor
          image={originalImages[editingImageIndex]}
          onSave={handleSaveEditedImage}
          onClose={handleCloseImageEditor}
        />
      )}

      {/* 九宫格预览弹窗 */}
      {showGridPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                九宫格切图预览
              </h3>
              <button
                onClick={handleCloseGridPreview}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              这是导出后的九宫格效果预览，每张图片会按此顺序发布到朋友圈
            </p>
            <div className="grid grid-cols-3 gap-2 bg-white/5 p-4 rounded-xl">
              {gridPreviewImages.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                  <img
                    src={img}
                    alt={`切图 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white font-medium">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCloseGridPreview}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  handleCloseGridPreview();
                  handleExport();
                }}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all"
              >
                确认导出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayerEditor;
