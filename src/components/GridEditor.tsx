/**
 * GridEditor - 九宫格编辑器主组件
 * Validates: Requirements 1.1, 1.2, 5.2, 5.3
 */

import { useState, useCallback, useEffect } from 'react';
import { ImageManager } from '@/services/ImageManager';
import type { ImageData } from '@/types';
import UploadZone from './UploadZone';
import ImageThumbnail from './ImageThumbnail';
import ImageEditor from './ImageEditor';
import ImageAnalysisPanel from './ImageAnalysisPanel';
import { useToast } from './Toast';

interface GridEditorProps {
  imageManager: ImageManager;
  onImagesChange?: (images: ImageData[]) => void;
  compact?: boolean;
}

export default function GridEditor({ imageManager, onImagesChange, compact = false }: GridEditorProps) {
  const [images, setImages] = useState<Map<number, ImageData>>(() => {
    // 初始化时从 imageManager 获取已有图片
    const allImages = imageManager.getAllImages();
    const imageMap = new Map<number, ImageData>();
    allImages.forEach((img) => imageMap.set(img.position, img));
    return imageMap;
  });
  const [draggedPosition, setDraggedPosition] = useState<number | null>(null);
  const [editingImage, setEditingImage] = useState<ImageData | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState<ImageData | null>(null);
  const { showToast, showConfirm } = useToast();

  // 更新图片状态
  const updateImages = useCallback(() => {
    const allImages = imageManager.getAllImages();
    const imageMap = new Map<number, ImageData>();
    allImages.forEach((img) => imageMap.set(img.position, img));
    setImages(imageMap);
    onImagesChange?.(allImages);
  }, [imageManager, onImagesChange]);

  // 组件挂载时同步状态
  useEffect(() => {
    updateImages();
  }, [updateImages]);

  // 处理文件上传
  const handleFileUpload = useCallback(
    async (file: File, position: number) => {
      const result = await imageManager.uploadImage(file, position);
      if (result.success) {
        updateImages();
      } else {
        showToast(result.error || '上传失败', 'error');
      }
    },
    [imageManager, updateImages, showToast]
  );

  // 处理批量文件上传
  const handleMultipleFilesUpload = useCallback(
    async (files: File[]) => {
      let successCount = 0;
      let failCount = 0;

      // 找到所有空位置
      const emptyPositions: number[] = [];
      for (let i = 0; i < 9; i++) {
        if (!imageManager.hasImage(i)) {
          emptyPositions.push(i);
        }
      }

      // 限制上传数量
      const filesToUpload = files.slice(0, Math.min(files.length, emptyPositions.length));

      if (filesToUpload.length < files.length) {
        showToast(`只能上传 ${filesToUpload.length} 张图片（剩余空位不足）`, 'warning');
      }

      // 批量上传
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const position = emptyPositions[i];
        const result = await imageManager.uploadImage(file, position);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      updateImages();

      // 显示结果
      if (failCount > 0) {
        showToast(`上传完成：成功 ${successCount} 张，失败 ${failCount} 张`, 'warning');
      } else if (successCount > 0) {
        // 成功时不显示提示，保持流畅体验
      }
    },
    [imageManager, updateImages, showToast]
  );

  // 处理图片删除
  const handleDelete = useCallback(
    async (position: number) => {
      const confirmed = await showConfirm({
        title: '删除图片',
        message: '确定要删除这张图片吗？',
        confirmText: '删除',
        cancelText: '取消',
      });
      if (confirmed) {
        imageManager.removeImage(position);
        updateImages();
      }
    },
    [imageManager, updateImages, showConfirm]
  );

  // 处理拖拽开始
  const handleDragStart = useCallback((position: number) => {
    setDraggedPosition(position);
  }, []);

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    setDraggedPosition(null);
  }, []);

  // 处理放置
  const handleDrop = useCallback(
    (targetPosition: number) => {
      if (draggedPosition !== null && draggedPosition !== targetPosition) {
        try {
          imageManager.reorderImages(draggedPosition, targetPosition);
          updateImages();
        } catch (error) {
          console.error('Reorder error:', error);
        }
      }
      setDraggedPosition(null);
    },
    [draggedPosition, imageManager, updateImages]
  );

  // 处理拖拽悬停
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // 处理图片编辑
  const handleEdit = useCallback((position: number) => {
    const image = images.get(position);
    if (image) {
      setEditingImage(image);
    }
  }, [images]);

  // 处理图片分析
  const handleAnalyze = useCallback((position: number) => {
    const image = images.get(position);
    if (image) {
      setAnalyzingImage(image);
    }
  }, [images]);

  // 处理分析后的裁剪应用
  const handleApplyAnalysisCrop = useCallback(async (croppedImage: string) => {
    if (!analyzingImage) return;

    try {
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' });

      const result = await imageManager.uploadImage(file, analyzingImage.position);
      if (result.success) {
        updateImages();
        setAnalyzingImage(null);
      } else {
        showToast(result.error || '应用裁剪失败', 'error');
      }
    } catch (error) {
      console.error('Apply crop error:', error);
      showToast('应用裁剪失败', 'error');
    }
  }, [analyzingImage, imageManager, updateImages, showToast]);

  // 处理保存编辑后的图片
  const handleSaveEdit = useCallback(async (croppedImage: string) => {
    if (!editingImage) return;

    try {
      // 将编辑后的图片转换为 Blob
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], `edited-${Date.now()}.jpg`, { type: 'image/jpeg' });

      // 重新上传到相同位置
      const result = await imageManager.uploadImage(file, editingImage.position);
      if (result.success) {
        updateImages();
        setEditingImage(null);
      } else {
        showToast(result.error || '保存失败', 'error');
      }
    } catch (error) {
      console.error('Save edit error:', error);
      showToast('保存失败，请重试', 'error');
    }
  }, [editingImage, imageManager, updateImages, showToast]);

  // 渲染3x3网格
  const renderGrid = () => {
    const grid = [];
    for (let i = 0; i < 9; i++) {
      const image = images.get(i);
      grid.push(
        <div
          key={i}
          className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-300 ${draggedPosition === i ? 'opacity-50 scale-95' : 'hover:scale-[1.02]'
            } ${!image ? 'bg-white/5 border-2 border-dashed border-white/10 hover:border-purple-500/50 hover:bg-white/10' : 'shadow-lg'}`}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(i)}
        >
          {image ? (
            <ImageThumbnail
              image={image}
              onDelete={() => handleDelete(i)}
              onEdit={() => handleEdit(i)}
              onAnalyze={() => handleAnalyze(i)}
              onDragStart={() => handleDragStart(i)}
              onDragEnd={handleDragEnd}
            />
          ) : (
            <UploadZone
              position={i}
              onFileSelect={handleFileUpload}
              onMultipleFilesSelect={handleMultipleFilesUpload}
            />
          )}
        </div>
      );
    }
    return grid;
  };

  return (
    <>
      <div className={`w-full ${compact ? 'max-w-md' : 'max-w-4xl'} mx-auto`}>
        <div className={`grid grid-cols-3 ${compact ? 'gap-3' : 'gap-4'} p-2`}>
          {renderGrid()}
        </div>
        {!compact && (
          <div className="mt-4 text-center text-sm text-gray-400">
            已上传 {images.size} / 9 张图片
          </div>
        )}
      </div>

      {/* 图片编辑器 */}
      {editingImage && (
        <ImageEditor
          image={editingImage}
          onSave={handleSaveEdit}
          onClose={() => setEditingImage(null)}
        />
      )}

      {/* 图片分析面板 */}
      {analyzingImage && (
        <ImageAnalysisPanel
          imageData={analyzingImage.fullSize}
          imageWidth={analyzingImage.width}
          imageHeight={analyzingImage.height}
          onClose={() => setAnalyzingImage(null)}
          onApplyCrop={handleApplyAnalysisCrop}
        />
      )}
    </>
  );
}
