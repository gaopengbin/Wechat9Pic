/**
 * ProjectManager - 项目管理对话框
 * 保存、加载、删除项目
 */

import { useState, useEffect, useCallback } from 'react';
import { projectStorage, ProjectListItem, MomentsSettings } from '@/services/ProjectStorage';
import { useToast } from './Toast';
import type { ImageData, EffectTemplate } from '@/types';

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentImages: ImageData[];
  currentTemplate?: EffectTemplate | null;
  onLoadProject: (images: ImageData[], templateId?: string, momentsSettings?: MomentsSettings) => void;
  currentProjectId?: string;
  onProjectIdChange: (id: string | undefined) => void;
  momentsSettings?: MomentsSettings;
}

export default function ProjectManager({
  isOpen,
  onClose,
  currentImages,
  currentTemplate,
  onLoadProject,
  currentProjectId,
  onProjectIdChange,
  momentsSettings,
}: ProjectManagerProps) {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [mode, setMode] = useState<'list' | 'save'>('list');
  const { showToast, showConfirm } = useToast();

  // 加载项目列表
  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await projectStorage.getProjectList();
      setProjects(list);
    } catch (error) {
      console.error('Load projects failed:', error);
      showToast('加载项目列表失败', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
      setMode('list');
      setProjectName('');
    }
  }, [isOpen, loadProjects]);

  // 保存项目
  const handleSave = async () => {
    if (!projectName.trim()) {
      showToast('请输入项目名称', 'warning');
      return;
    }

    if (currentImages.length === 0) {
      showToast('没有图片可保存', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const id = await projectStorage.saveProject(
        projectName.trim(),
        currentImages,
        currentTemplate || undefined,
        undefined,
        currentProjectId,
        momentsSettings
      );
      onProjectIdChange(id);
      showToast('项目已保存', 'success');
      onClose();
    } catch (error) {
      console.error('Save project failed:', error);
      showToast('保存失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 加载项目
  const handleLoad = async (projectId: string) => {
    setIsLoading(true);
    try {
      const project = await projectStorage.getProject(projectId);
      if (project) {
        const images = project.images.map(img => projectStorage.savedToImage(img)) as ImageData[];
        onLoadProject(images, project.templateId, project.momentsSettings);
        onProjectIdChange(project.id);
        showToast(`已加载: ${project.name}`, 'success');
        onClose();
      }
    } catch (error) {
      console.error('Load project failed:', error);
      showToast('加载项目失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 删除项目
  const handleDelete = async (projectId: string, projectName: string) => {
    const confirmed = await showConfirm({
      title: '删除项目',
      message: `确定要删除项目 "${projectName}" 吗？此操作不可恢复。`,
      confirmText: '删除',
      cancelText: '取消',
    });

    if (confirmed) {
      try {
        await projectStorage.deleteProject(projectId);
        if (currentProjectId === projectId) {
          onProjectIdChange(undefined);
        }
        showToast('项目已删除', 'success');
        loadProjects();
      } catch (error) {
        console.error('Delete project failed:', error);
        showToast('删除失败', 'error');
      }
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel rounded-2xl w-full max-w-lg p-6 border border-white/10 shadow-2xl">
        {/* 标题栏 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">📁</span>
            项目管理
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

        {/* 模式切换 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('list')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              mode === 'list'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            📋 项目列表
          </button>
          <button
            onClick={() => setMode('save')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              mode === 'save'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            💾 保存项目
          </button>
        </div>

        {/* 保存模式 */}
        {mode === 'save' && (
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">项目名称</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="输入项目名称..."
                className="w-full bg-white/10 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            </div>

            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-gray-400 text-sm">
                当前项目包含 <span className="text-purple-400 font-medium">{currentImages.length}</span> 张图片
                {currentTemplate && (
                  <>，使用模板 <span className="text-pink-400 font-medium">{currentTemplate.name}</span></>
                )}
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={isLoading || !projectName.trim()}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '保存中...' : currentProjectId ? '更新项目' : '保存项目'}
            </button>
          </div>
        )}

        {/* 列表模式 */}
        {mode === 'list' && (
          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">暂无保存的项目</p>
                <p className="text-gray-500 text-sm mt-2">点击"保存项目"创建第一个项目</p>
              </div>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    currentProjectId === project.id
                      ? 'bg-purple-500/20 border border-purple-500/50'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {/* 缩略图 */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-black/20 flex-shrink-0">
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* 项目信息 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{project.name}</h3>
                    <p className="text-gray-400 text-xs">
                      {project.imageCount} 张图片 · {formatDate(project.updatedAt)}
                    </p>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoad(project.id)}
                      className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      打开
                    </button>
                    <button
                      onClick={() => handleDelete(project.id, project.name)}
                      className="px-3 py-1.5 bg-white/10 text-gray-300 text-sm rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
