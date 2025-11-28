/**
 * TemplateEngine - 模板引擎，管理效果模板和推荐逻辑
 * Validates: Requirements 2.2, 2.4, 2.5, 3.1, 8.1
 */

import type { EffectTemplate, ContentType, ImageData, ProcessedImage } from '@/types';
import { effectTemplates } from '@/data/templates';

export class TemplateEngine {
  private templates: EffectTemplate[] = effectTemplates;

  /**
   * 获取所有模板
   * Validates: Requirements 3.1
   */
  getAllTemplates(): EffectTemplate[] {
    return [...this.templates];
  }

  /**
   * 根据内容类型推荐模板
   * Validates: Requirements 2.4, 2.5
   */
  recommendTemplates(contentTypes: ContentType[]): EffectTemplate[] {
    // 统计内容类型
    const typeCount = new Map<ContentType, number>();
    contentTypes.forEach((type) => {
      typeCount.set(type, (typeCount.get(type) || 0) + 1);
    });

    // 如果内容类型混合（超过2种不同类型），推荐通用模板
    const uniqueTypes = Array.from(typeCount.keys()).filter((type) => type !== 'unknown');
    if (uniqueTypes.length >= 2) {
      return this.templates.filter((template) => template.category === 'general');
    }

    // 找出主要内容类型
    let mainType: ContentType = 'unknown';
    let maxCount = 0;
    typeCount.forEach((count, type) => {
      if (type !== 'unknown' && count > maxCount) {
        maxCount = count;
        mainType = type;
      }
    });

    // 根据主要类型推荐模板
    const recommended = this.templates.filter((template) =>
      template.suitableFor.includes(mainType)
    );

    // 如果没有找到合适的，返回通用模板
    if (recommended.length === 0) {
      return this.templates.filter((template) => template.category === 'general');
    }

    return recommended;
  }

  /**
   * 获取模板详情
   */
  getTemplate(templateId: string): EffectTemplate | null {
    return this.templates.find((t) => t.id === templateId) || null;
  }

  /**
   * 应用模板到图片
   * Validates: Requirements 3.3
   */
  async applyTemplate(
    images: ImageData[],
    template: EffectTemplate
  ): Promise<ProcessedImage[]> {
    // 这里只是创建处理后的图片数据结构
    // 实际的效果应用会在渲染阶段完成
    return images.map((image) => ({
      position: image.position,
      originalId: image.id,
      processedData: image.fullSize, // 暂时使用原图
      appliedEffects: template.effects,
    }));
  }

  /**
   * 根据类别获取模板
   */
  getTemplatesByCategory(
    category: 'portrait' | 'landscape' | 'food' | 'general' | '3d-effect'
  ): EffectTemplate[] {
    return this.templates.filter((template) => template.category === category);
  }

  /**
   * 搜索模板
   */
  searchTemplates(query: string): EffectTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.templates.filter(
      (template) =>
        template.name.toLowerCase().includes(lowerQuery) ||
        template.description.toLowerCase().includes(lowerQuery)
    );
  }
}

// 导出单例实例
export const templateEngine = new TemplateEngine();
