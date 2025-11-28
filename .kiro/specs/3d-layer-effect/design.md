# 设计文档

## 概述

3D立体效果功能通过图层叠加技术实现视觉立体感，核心原理是"九宫格底图 + 前景主体"的双层设计。该功能完全在客户端实现，使用Canvas API进行图层合成和渲染，AI抠图服务可选择本地模型或云端API。

核心技术选型：
- **图层渲染**：HTML Canvas 2D API
- **AI抠图**：@imgly/background-removal（本地WebAssembly模型）或 Remove.bg API
- **图像处理**：Canvas ImageData 操作
- **状态管理**：React useState/useReducer

## 架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        用户界面层                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 底图编辑器    │  │ 主体编辑器    │  │ 图层面板      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                        业务逻辑层                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 图层管理器    │  │ 变换控制器    │  │ 效果处理器    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                        核心服务层                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ AI抠图服务    │  │ Canvas渲染器  │  │ 导出服务      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 数据流

1. **底图生成**：9张图片 → 裁剪为正方形 → 3×3网格排列 → 添加边框 → 生成底图
2. **主体抠图**：上传图片 → AI模型处理 → 输出透明PNG → 添加到图层
3. **图层合成**：底图 → 主体1(变换+阴影) → 主体2... → 最终图片
4. **导出流程**：合成所有图层 → 裁剪到1080×1080 → 输出JPEG

## 组件和接口

### 1. 图层管理器（LayerManager）

```typescript
interface Layer {
  id: string;
  type: 'background' | 'subject';
  imageData: string; // Base64
  transform: TransformConfig;
  shadow: ShadowConfig;
  opacity: number; // 0-100
  visible: boolean;
  zIndex: number;
}

interface TransformConfig {
  x: number; // 位置X（可为负值）
  y: number; // 位置Y（可为负值）
  scale: number; // 10-300%
  rotation: number; // -180到180度
}

interface ShadowConfig {
  enabled: boolean;
  blur: number; // 0-30px
  offsetX: number; // -50到50px
  offsetY: number; // -50到50px
  opacity: number; // 0-100%
  color: string; // 默认#000000
}

interface LayerManager {
  addLayer(imageData: string, type: 'background' | 'subject'): Layer;
  removeLayer(layerId: string): void;
  updateLayer(layerId: string, updates: Partial<Layer>): void;
  reorderLayers(fromIndex: number, toIndex: number): void;
  getLayers(): Layer[];
  getLayerById(layerId: string): Layer | null;
}
```

### 2. AI抠图服务（MattingService）

```typescript
interface MattingResult {
  success: boolean;
  imageData?: string; // 透明背景PNG的Base64
  error?: string;
}

interface MattingService {
  // 执行抠图
  removeBackground(imageData: string): Promise<MattingResult>;
  
  // 检查服务是否可用
  isAvailable(): boolean;
  
  // 加载模型（本地模型需要）
  loadModel(): Promise<void>;
}
```

### 3. Canvas渲染器（LayerRenderer）

```typescript
interface RenderOptions {
  width: number; // 输出宽度
  height: number; // 输出高度
  quality: number; // JPEG质量 0-1
}

interface LayerRenderer {
  // 渲染所有图层到Canvas
  render(layers: Layer[], options: RenderOptions): Promise<HTMLCanvasElement>;
  
  // 渲染单个图层（用于预览）
  renderLayer(layer: Layer, ctx: CanvasRenderingContext2D): void;
  
  // 应用变换
  applyTransform(ctx: CanvasRenderingContext2D, transform: TransformConfig): void;
  
  // 绘制阴影
  drawShadow(ctx: CanvasRenderingContext2D, layer: Layer): void;
}
```

### 4. 九宫格底图生成器（GridGenerator）

```typescript
interface GridConfig {
  images: string[]; // 9张图片的Base64
  borderWidth: number; // 1-10px
  borderColor: string; // 边框颜色
  outputSize: number; // 输出尺寸（默认1080）
}

interface GridGenerator {
  // 生成九宫格底图
  generate(config: GridConfig): Promise<string>;
  
  // 裁剪图片为正方形
  cropToSquare(imageData: string): Promise<string>;
}
```

### 5. 导出服务（ExportService）

```typescript
interface ExportOptions {
  format: 'jpeg' | 'png';
  quality: number; // 0.9-1.0
  size: number; // 输出尺寸
}

interface ExportService {
  // 导出合成图片
  export(layers: Layer[], options: ExportOptions): Promise<Blob>;
  
  // 生成预览
  generatePreview(layers: Layer[]): Promise<string>;
}
```

## 数据模型

### 编辑器状态

```typescript
interface EditorState {
  // 图层列表
  layers: Layer[];
  
  // 当前选中的图层ID
  selectedLayerId: string | null;
  
  // 底图配置
  gridConfig: {
    borderWidth: number;
    borderColor: string;
  };
  
  // UI状态
  ui: {
    isProcessing: boolean;
    isExporting: boolean;
    previewMode: boolean;
  };
}
```

### 参数约束

```typescript
const CONSTRAINTS = {
  // 缩放范围
  scale: { min: 10, max: 300 },
  
  // 旋转范围
  rotation: { min: -180, max: 180 },
  
  // 阴影模糊度
  shadowBlur: { min: 0, max: 30 },
  
  // 阴影偏移
  shadowOffset: { min: -50, max: 50 },
  
  // 透明度
  opacity: { min: 0, max: 100 },
  
  // 边框宽度
  borderWidth: { min: 1, max: 10 },
  
  // 最大图层数
  maxLayers: 5,
  
  // 输出尺寸
  outputSize: 1080,
};
```

## 正确性属性

*属性是指在系统所有有效执行中都应该成立的特征或行为——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 核心属性

**属性 1：九宫格底图尺寸一致性**
*对于任何*9张输入图片，生成的九宫格底图尺寸应该恰好为1080×1080像素
**验证：需求 1.1**

**属性 2：图片裁剪正方形保持**
*对于任何*非正方形输入图片，裁剪后的图片宽度应该等于高度
**验证：需求 1.3**

**属性 3：边框宽度范围约束**
*对于任何*边框宽度设置，值应该被限制在1-10像素范围内
**验证：需求 1.4**

**属性 4：抠图输出格式有效性**
*对于任何*成功的抠图操作，输出图片应该包含alpha通道（透明背景）
**验证：需求 2.2**

**属性 5：抠图错误处理完整性**
*对于任何*抠图失败情况，系统应该返回错误信息且不会崩溃
**验证：需求 2.5**

**属性 6：主体位置无边界限制**
*对于任何*主体位置设置，X和Y坐标可以为任意值（包括负值和超出画布的值）
**验证：需求 3.1**

**属性 7：缩放范围约束**
*对于任何*缩放值设置，值应该被限制在10%-300%范围内
**验证：需求 3.2**

**属性 8：旋转范围约束**
*对于任何*旋转角度设置，值应该被限制在-180到180度范围内
**验证：需求 3.3**

**属性 9：导出裁剪正方形保持**
*对于任何*包含超出边界主体的导出操作，输出图片尺寸应该恰好为1080×1080像素
**验证：需求 3.5, 7.4**

**属性 10：阴影参数范围约束**
*对于任何*阴影配置，模糊度应该在0-30px，偏移应该在-50到50px，透明度应该在0-100%
**验证：需求 4.2, 4.3, 4.4**

**属性 11：图层数量限制**
*对于任何*添加图层操作，当图层数量达到5个时，系统应该阻止添加更多图层
**验证：需求 5.1**

**属性 12：图层删除完整性**
*对于任何*图层删除操作，删除后图层列表长度应该减少1，且其他图层保持不变
**验证：需求 5.4**

**属性 13：图层顺序调整一致性**
*对于任何*图层顺序调整操作，调整后所有图层仍然存在，且总数量不变
**验证：需求 5.5**

**属性 14：透明度范围约束**
*对于任何*透明度设置，值应该被限制在0-100%范围内
**验证：需求 6.1**

**属性 15：透明度导出保持**
*对于任何*设置了透明度的图层，导出后该图层的视觉效果应该反映设置的透明度
**验证：需求 6.5**

**属性 16：导出图层顺序正确性**
*对于任何*多图层导出，渲染顺序应该按照图层zIndex从小到大（底图在最下，主体在上）
**验证：需求 7.2**

**属性 17：导出质量保持**
*对于任何*JPEG导出，质量参数应该不低于90%
**验证：需求 7.3**

**属性 18：预览与导出一致性**
*对于任何*编辑状态，预览渲染结果应该与导出结果在视觉上一致
**验证：需求 8.5**

## 错误处理

### 错误类型

```typescript
enum LayerErrorType {
  MATTING_FAILED = 'MATTING_FAILED',
  MATTING_TIMEOUT = 'MATTING_TIMEOUT',
  MAX_LAYERS_EXCEEDED = 'MAX_LAYERS_EXCEEDED',
  INVALID_IMAGE = 'INVALID_IMAGE',
  RENDER_FAILED = 'RENDER_FAILED',
  EXPORT_FAILED = 'EXPORT_FAILED',
}
```

### 错误处理策略

1. **抠图失败**：显示错误提示，提供重试按钮
2. **图层数量超限**：禁用添加按钮，显示提示信息
3. **渲染失败**：回退到简化渲染模式
4. **导出失败**：显示错误详情，提供重试选项

## 测试策略

### 单元测试

使用 **Vitest** 进行测试。

**测试覆盖范围：**
- GridGenerator 的裁剪和拼接逻辑
- LayerManager 的CRUD操作
- 参数约束验证函数
- 变换计算函数

### 属性测试

使用 **fast-check** 进行属性测试，每个测试运行100次迭代。

```typescript
// 示例：缩放范围约束测试
it('Property 7: 缩放范围约束', () => {
  // **Feature: 3d-layer-effect, Property 7: 缩放范围约束**
  fc.assert(
    fc.property(
      fc.integer({ min: -1000, max: 1000 }),
      (inputScale) => {
        const result = clampScale(inputScale);
        expect(result).toBeGreaterThanOrEqual(10);
        expect(result).toBeLessThanOrEqual(300);
      }
    )
  );
});
```

## 实现注意事项

### 性能优化

1. **预览优化**：使用较低分辨率进行实时预览，导出时使用全分辨率
2. **抠图缓存**：缓存已抠图的结果，避免重复处理
3. **Canvas复用**：复用Canvas元素，减少DOM操作

### 浏览器兼容性

- Canvas 2D API：所有现代浏览器支持
- WebAssembly（本地抠图）：Chrome 57+, Firefox 52+, Safari 11+
