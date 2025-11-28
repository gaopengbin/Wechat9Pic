/**
 * TemplateSelector - 模板选择器组件
 * Validates: Requirements 2.2, 3.1, 3.2
 */

import { useState } from 'react';
import type { EffectTemplate, ContentType } from '@/types';

interface TemplateSelectorProps {
  templates: EffectTemplate[];
  recommendedTemplateIds?: string[];
  onSelectTemplate: (template: EffectTemplate) => void;
  selectedTemplateId?: string;
  compact?: boolean;
}

export default function TemplateSelector({
  templates,
  recommendedTemplateIds = [],
  onSelectTemplate,
  selectedTemplateId,
  compact = false,
}: TemplateSelectorProps) {
  const [previewTemplate, setPreviewTemplate] = useState<EffectTemplate | null>(null);

  const isRecommended = (templateId: string) => recommendedTemplateIds.includes(templateId);

  const handleTemplateClick = (template: EffectTemplate) => {
    setPreviewTemplate(template);
  };

  const handleConfirm = () => {
    if (previewTemplate) {
      onSelectTemplate(previewTemplate);
      setPreviewTemplate(null);
    }
  };

  const handleCancel = () => {
    setPreviewTemplate(null);
  };

  return (
    <div className="w-full">
      {!compact && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">选择效果模板</h3>
          <p className="text-sm text-gray-400">点击模板预览效果，确认后应用</p>
        </div>
      )}

      {/* 模板网格 - compact模式使用横向滚动 */}
      <div className={compact
        ? "flex gap-3 overflow-x-auto pb-2 custom-scrollbar"
        : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
      }>
        {templates.map((template) => (
          <div
            key={template.id}
            className={`
              relative cursor-pointer rounded-xl overflow-hidden
              border transition-all duration-300 group
              ${compact ? 'shrink-0 w-28' : ''}
              ${selectedTemplateId === template.id
                ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                : previewTemplate?.id === template.id
                  ? 'border-purple-400 bg-purple-500/5'
                  : 'border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-white/10 hover:-translate-y-1'
              }
            `}
            onClick={() => compact ? onSelectTemplate(template) : handleTemplateClick(template)}
          >
            {/* 推荐标签 */}
            {isRecommended(template.id) && (
              <div className={`absolute ${compact ? 'top-1 right-1' : 'top-2 right-2'} z-10`}>
                <span className={`bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-full shadow-lg ${compact ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'}`}>
                  荐
                </span>
              </div>
            )}

            {/* 模板缩略图 */}
            <div className={`${compact ? 'h-20' : 'aspect-square'} bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-500`}>
              <div className="text-center p-2">
                <div className={`${compact ? 'text-2xl' : 'text-5xl mb-3'} drop-shadow-lg filter`}>🎨</div>
                {!compact && <p className="text-xs text-gray-400">{template.name}</p>}
              </div>
            </div>

            {/* 模板信息 */}
            <div className={`${compact ? 'p-2' : 'p-3'} border-t border-white/5`}>
              <h4 className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-white truncate group-hover:text-purple-300 transition-colors`}>{template.name}</h4>
              {!compact && <p className="text-xs text-gray-400 truncate mt-1">{template.description}</p>}
            </div>

            {/* 选中指示器 */}
            {selectedTemplateId === template.id && (
              <div className={`absolute ${compact ? 'top-1 left-1' : 'top-2 left-2'}`}>
                <div className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} bg-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50`}>
                  <svg className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-white`} fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 预览对话框 */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl max-w-2xl w-full p-6 border border-white/10 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">{previewTemplate.name}</h3>
            <p className="text-gray-400 mb-6">{previewTemplate.description}</p>

            {/* 效果详情 */}
            <div className="bg-white/5 rounded-xl p-5 mb-6 border border-white/5">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">效果参数：</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {previewTemplate.effects.transform3D && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">3D效果：</span>
                    <span className="text-purple-400 font-medium bg-purple-500/10 px-2 py-0.5 rounded">已启用</span>
                  </div>
                )}
                {previewTemplate.effects.filter && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">亮度：</span>
                      <span className="text-gray-300 font-medium">
                        {previewTemplate.effects.filter.brightness > 0 ? '+' : ''}
                        {previewTemplate.effects.filter.brightness}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">对比度：</span>
                      <span className="text-gray-300 font-medium">
                        {previewTemplate.effects.filter.contrast > 0 ? '+' : ''}
                        {previewTemplate.effects.filter.contrast}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">饱和度：</span>
                      <span className="text-gray-300 font-medium">
                        {previewTemplate.effects.filter.saturation > 0 ? '+' : ''}
                        {previewTemplate.effects.filter.saturation}
                      </span>
                    </div>
                    {previewTemplate.effects.filter.preset && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">滤镜：</span>
                        <span className="text-pink-400 font-medium">
                          {previewTemplate.effects.filter.preset}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 适用类型 */}
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">适用于：</h4>
              <div className="flex flex-wrap gap-2">
                {previewTemplate.suitableFor.map((type) => (
                  <span
                    key={type}
                    className="px-3 py-1 bg-white/10 text-gray-300 text-xs rounded-full border border-white/5"
                  >
                    {getContentTypeLabel(type)}
                  </span>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-4">
              <button
                onClick={handleConfirm}
                className="
                  flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl
                  hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:-translate-y-0.5
                  font-medium
                "
              >
                应用此模板
              </button>
              <button
                onClick={handleCancel}
                className="
                  px-6 py-3 bg-white/10 text-gray-300 rounded-xl
                  hover:bg-white/20 transition-colors
                  font-medium
                "
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getContentTypeLabel(type: ContentType): string {
  const labels: Record<ContentType, string> = {
    portrait: '人物',
    landscape: '风景',
    food: '美食',
    object: '物品',
    pet: '宠物',
    unknown: '通用',
  };
  return labels[type] || type;
}
