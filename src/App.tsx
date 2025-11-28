import { useState, useEffect, useCallback } from 'react';
import GridEditor from './components/GridEditor';
import TemplateSelector from './components/TemplateSelector';
import ExportDialog from './components/ExportDialog';
import PreviewGrid from './components/PreviewGrid';
import LayerEditor from './components/LayerEditor';
import DraggableContainer from './components/DraggableContainer';
import { imageManager } from './services/ImageManager';
import { templateEngine } from './services/TemplateEngine';
import { canvasRenderer } from './services/CanvasRenderer';
import { GridGenerator } from './services/GridGenerator';
import type { ImageData, EffectTemplate, ProcessedImage } from './types';

type AppMode = 'normal' | '3d-layer';

function App() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EffectTemplate | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // 3D图层模式状态
  const [appMode, setAppMode] = useState<AppMode>('normal');
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [gridGenerator] = useState(() => new GridGenerator());

  const handleSelectTemplate = async (template: EffectTemplate) => {
    setSelectedTemplate(template);
    setIsProcessing(true);

    try {
      const processed: ProcessedImage[] = [];
      for (const img of images) {
        const processedData = await canvasRenderer.applyEffects(img, template.effects);
        processed.push({
          position: img.position,
          originalId: img.id,
          processedData,
          appliedEffects: template.effects,
        });
      }
      setProcessedImages(processed);
    } catch (error) {
      console.error('Apply template failed:', error);
      alert('应用模板失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    if (images.length === 0) {
      alert('请先上传图片');
      return;
    }
    setShowExportDialog(true);
  };

  // 进入3D图层模式
  const handleEnter3DMode = useCallback(async () => {
    if (images.length === 0) {
      alert('请先上传图片');
      return;
    }

    setIsProcessing(true);
    try {
      // 生成九宫格底图
      const imageDataArray = images.map(img => img.fullSize);
      const result = await gridGenerator.generateGridBackground(imageDataArray, {
        borderWidth: 2,
        borderColor: '#FFFFFF',
      });
      if (result.success && result.imageData) {
        setBackgroundImage(result.imageData);
        setAppMode('3d-layer');
      } else {
        throw new Error(result.error || '生成底图失败');
      }
    } catch (error) {
      console.error('生成底图失败:', error);
      alert('生成底图失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  }, [images, gridGenerator]);

  // 退出3D图层模式
  const handleExit3DMode = useCallback(() => {
    setAppMode('normal');
    setBackgroundImage('');
  }, []);

  // 3D图层导出完成
  const handleLayerExport = useCallback((blob: Blob) => {
    // 下载导出的图片
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `3d-layer-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    if (selectedTemplate && images.length > 0) {
      handleSelectTemplate(selectedTemplate);
    } else if (images.length > 0) {
      const processed: ProcessedImage[] = images.map((img) => ({
        position: img.position,
        originalId: img.id,
        processedData: img.fullSize,
        appliedEffects: {},
      }));
      setProcessedImages(processed);
    } else {
      setProcessedImages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  const contentTypes = images.map((img) => img.contentType);
  const recommendedTemplates = templateEngine.recommendTemplates(contentTypes);
  const recommendedIds = recommendedTemplates.map((t) => t.id);

  // 3D图层模式
  if (appMode === '3d-layer' && backgroundImage) {
    return (
      <div className="h-screen w-full overflow-hidden bg-slate-900">
        <LayerEditor
          backgroundImage={backgroundImage}
          originalImages={images}
          onExport={handleLayerExport}
          onClose={handleExit3DMode}
        />
      </div>
    );
  }

  return (
    <DraggableContainer dragHandleClassName="drag-handle">
      <div className="h-screen flex flex-col overflow-hidden text-white">
        {/* 顶部工具栏 */}
        <header className="glass z-10 px-6 py-4 flex items-center justify-between shrink-0 mb-4 mx-4 mt-4 rounded-2xl drag-handle cursor-move">
          <div className="flex items-center gap-4">
            {/* 拖动提示图标 */}
            <div className="text-gray-400 hover:text-purple-400 transition-colors opacity-60 hover:opacity-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8h16M4 16h16"
                />
              </svg>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg shadow-lg shadow-purple-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                九宫格美化
              </h1>
              {selectedTemplate && (
                <span className="text-xs text-purple-300 font-medium">
                  当前效果: {selectedTemplate.name}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-gray-400 px-3 py-1 rounded-full bg-white/5">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span>处理中...</span>
              </div>
            )}
            <button
              onClick={handleEnter3DMode}
              disabled={isProcessing || images.length === 0}
              className="glass-button px-4 py-2 text-sm text-white rounded-xl hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              3D效果
            </button>
            <button
              onClick={handleExport}
              disabled={isProcessing || images.length === 0}
              className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              导出图片
            </button>
          </div>
        </header>

        {/* 主内容区 */}
        <div className="flex-1 flex overflow-hidden px-4 pb-4 gap-4">
          {/* 左侧：原图编辑区 */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="glass-panel flex-1 rounded-2xl p-6 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h2 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                  <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                  原图编辑
                </h2>
                <span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full">
                  {images.length}/9 已上传
                </span>
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar">
                <GridEditor imageManager={imageManager} onImagesChange={setImages} compact />
              </div>
            </div>
          </div>

          {/* 右侧：预览区 */}
          {images.length > 0 && (
            <div className="flex-1 flex flex-col min-w-0">
              <div className="glass-panel flex-1 rounded-2xl p-6 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <h2 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                    <span className="w-1 h-4 bg-pink-500 rounded-full"></span>
                    效果预览
                  </h2>
                  {selectedTemplate && (
                    <span className="text-xs text-pink-300 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
                      {selectedTemplate.effects.filter?.preset || '自定义效果'}
                    </span>
                  )}
                </div>
                <div className="flex-1 bg-black/20 rounded-xl overflow-auto custom-scrollbar flex items-center justify-center p-4 border border-white/5">
                  <PreviewGrid images={processedImages} compact />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部模板选择器 */}
        {images.length > 0 && (
          <div className="shrink-0 px-4 pb-4">
            <div className="glass-panel rounded-2xl p-4">
              <div className="text-xs text-gray-400 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                选择风格模板
              </div>
              <TemplateSelector
                templates={templateEngine.getAllTemplates()}
                recommendedTemplateIds={recommendedIds}
                onSelectTemplate={handleSelectTemplate}
                selectedTemplateId={selectedTemplate?.id}
                compact
              />
            </div>
          </div>
        )}

        {/* 导出对话框 */}
        {showExportDialog && (
          <ExportDialog images={processedImages} onClose={() => setShowExportDialog(false)} />
        )}
      </div>
    </DraggableContainer>
  );
}

export default App;
