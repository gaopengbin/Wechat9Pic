import { useState, useEffect, useCallback } from 'react';
import GridEditor from './components/GridEditor';
import TemplateSelector from './components/TemplateSelector';
import ExportDialog from './components/ExportDialog';
import LayerEditor from './components/LayerEditor';
import MomentsPreviewEmbed, { DEFAULT_MOMENTS_SETTINGS } from './components/MomentsPreviewEmbed';
import ProjectManager from './components/ProjectManager';
import DraggableContainer from './components/DraggableContainer';
import { useToast } from './components/Toast';
import { imageManager } from './services/ImageManager';
import { templateEngine } from './services/TemplateEngine';
import { canvasRenderer } from './services/CanvasRenderer';
import { GridGenerator } from './services/GridGenerator';
import type { MomentsSettings } from './services/ProjectStorage';
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
  
  
  // 项目管理
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>();

  // 面板宽度调整
  const [leftPanelWidth, setLeftPanelWidth] = useState(33); // 默认33%
  const [isResizing, setIsResizing] = useState(false);

  // 3D编辑预览图片
  const [previewImages3D, setPreviewImages3D] = useState<string[] | null>(null);

  // 朋友圈设置
  const [momentsSettings, setMomentsSettings] = useState<MomentsSettings>(DEFAULT_MOMENTS_SETTINGS);

  const { showToast } = useToast();

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
      showToast('应用模板失败，请重试', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    if (images.length === 0) {
      showToast('请先上传图片', 'warning');
      return;
    }
    setShowExportDialog(true);
  };

  // 进入3D图层模式
  const handleEnter3DMode = useCallback(async () => {
    if (images.length === 0) {
      showToast('请先上传图片', 'warning');
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
      showToast('生成底图失败，请重试', 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [images, gridGenerator, showToast]);

  // 退出3D图层模式
  const handleExit3DMode = useCallback(() => {
    setAppMode('normal');
    setBackgroundImage('');
  }, []);

  // 加载项目
  const handleLoadProject = useCallback((loadedImages: ImageData[], templateId?: string, loadedMomentsSettings?: MomentsSettings) => {
    // 清空当前 imageManager 并加载新图片
    imageManager.clear();
    loadedImages.forEach(img => {
      // 直接设置图片数据（绕过文件上传流程）
      (imageManager as unknown as { images: Map<number, ImageData> }).images.set(img.position, img);
    });
    setImages(loadedImages);
    
    // 如果有模板 ID，尝试匹配模板
    if (templateId) {
      const template = templateEngine.getAllTemplates().find(t => t.id === templateId);
      if (template) {
        setSelectedTemplate(template);
      }
    }
    
    // 加载朋友圈设置
    if (loadedMomentsSettings) {
      setMomentsSettings(loadedMomentsSettings);
    } else {
      setMomentsSettings(DEFAULT_MOMENTS_SETTINGS);
    }
  }, []);

  // 朋友圈设置变化处理
  const handleMomentsSettingsChange = useCallback((settings: MomentsSettings) => {
    setMomentsSettings(settings);
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

  // 3D图层确认并返回主界面
  const handleLayerConfirm = useCallback((slicedImages: string[]) => {
    setPreviewImages3D(slicedImages);
    setAppMode('normal');
    setBackgroundImage('');
    showToast('3D效果已应用', 'success');
  }, [showToast]);

  // 清除3D预览
  const handleClear3DPreview = useCallback(() => {
    setPreviewImages3D(null);
  }, []);

  // 拖拽调整面板宽度
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.querySelector('.main-content-container') as HTMLElement;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      // 限制范围: 20% - 60%
      setLeftPanelWidth(Math.min(60, Math.max(20, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

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
          onConfirm={handleLayerConfirm}
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
              onClick={() => setShowProjectManager(true)}
              className="glass-button px-4 py-2 text-sm text-white rounded-xl hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              项目
            </button>
          </div>
        </header>

        {/* 主内容区 */}
        <div className={`flex-1 flex overflow-hidden px-4 pb-4 main-content-container ${isResizing ? 'select-none' : ''}`}>
    {/* 左侧：原图编辑区 */}
          <div 
            className="flex flex-col min-w-0"
            style={{ width: `${leftPanelWidth}%` }}
          >
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

          {/* 拖拽分隔条 */}
          {images.length > 0 && (
            <div
              className="w-2 shrink-0 cursor-col-resize group flex items-center justify-center hover:bg-purple-500/20 transition-colors rounded"
              onMouseDown={handleResizeStart}
            >
              <div className="w-0.5 h-12 bg-white/20 group-hover:bg-purple-400 rounded-full transition-colors" />
            </div>
          )}

          {/* 右侧：朋友圈预览区 */}
          {images.length > 0 && (
            <div 
              className="flex flex-col min-w-0"
              style={{ width: `${100 - leftPanelWidth}%` }}
            >
              <div className="glass-panel flex-1 rounded-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 shrink-0 border-b border-white/5">
                  <h2 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                    <span className={`w-1 h-4 rounded-full ${previewImages3D ? 'bg-purple-500' : 'bg-green-500'}`}></span>
                    {previewImages3D ? '3D效果预览' : '朋友圈预览'}
                    {previewImages3D && (
                      <button
                        onClick={handleClear3DPreview}
                        className="ml-2 text-xs text-gray-400 hover:text-white bg-white/10 px-2 py-0.5 rounded"
                      >
                        清除效果
                      </button>
                    )}
                  </h2>
                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleEnter3DMode}
                      disabled={isProcessing}
                      className="px-3 py-1.5 text-xs text-white rounded-lg bg-white/10 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      3D效果
                    </button>
                    <button
                      onClick={handleExport}
                      disabled={isProcessing}
                      className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      导出图片
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <MomentsPreviewEmbed 
                    images={images} 
                    processedImages={processedImages} 
                    previewImages3D={previewImages3D}
                    settings={momentsSettings}
                    onSettingsChange={handleMomentsSettingsChange}
                  />
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

        {/* 项目管理 */}
        <ProjectManager
          isOpen={showProjectManager}
          onClose={() => setShowProjectManager(false)}
          currentImages={images}
          currentTemplate={selectedTemplate}
          onLoadProject={handleLoadProject}
          currentProjectId={currentProjectId}
          onProjectIdChange={setCurrentProjectId}
          momentsSettings={momentsSettings}
        />
      </div>
    </DraggableContainer>
  );
}

export default App;
