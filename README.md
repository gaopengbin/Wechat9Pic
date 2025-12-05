# 九宫格美化应用 🎨

一个功能强大的九宫格图片美化工具，支持滤镜效果、3D图层合成、AI智能抠图、微信朋友圈预览等功能。

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178c6)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 特性

- 🖼️ **九宫格编辑** - 拖拽上传、排序、删除图片
- 🎨 **滤镜效果** - 多种预设滤镜，实时预览
- 🌟 **3D图层** - AI智能抠图，3D效果合成，支持撤销/重做
- 📱 **朋友圈预览** - 模拟微信个人主页，可自定义头像、封面、昵称等
- 📦 **批量导出** - 支持单张/批量导出，ZIP打包
- 💾 **项目管理** - 保存/加载项目，本地IndexedDB存储
- 🎯 **智能推荐** - 根据图片内容推荐合适效果
- 🌙 **暗色主题** - 现代化玻璃拟态设计
- ⚡ **高性能** - 客户端处理，无需上传服务器

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd Wechat9Pic

# 安装依赖
npm install
```

### 开发

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 📖 使用指南

### 基础功能

#### 1. 上传图片
- 点击空白格子上传单张图片
- 拖拽多张图片到网格批量上传
- 支持 JPG、PNG、WEBP 格式

#### 2. 编辑图片
- 拖拽图片可重新排序
- 点击删除按钮移除图片
- 最多支持 9 张图片

#### 3. 应用效果
- 在底部选择滤镜模板
- 实时预览效果
- 可随时切换不同效果

#### 4. 导出图片
- 点击"导出图片"按钮
- 选择导出方式：
  - **批量导出**: 所有图片打包为 ZIP
  - **单张导出**: 选择单张图片下载
- 选择格式：PNG（高质量）或 JPG（小文件）

### 高级功能

#### 3D图层效果

1. 点击"3D效果"按钮
2. 系统自动生成九宫格底图
3. 点击"+ 添加主体"上传前景图片
4. AI 自动抠图（去除背景）
5. 调整图层属性：
   - **位置**: X/Y 坐标
   - **缩放**: 10% - 200%
   - **旋转**: -180° - 180°
   - **阴影**: 模糊、偏移、颜色
   - **透明度**: 0% - 100%
6. 使用 **Ctrl+Z** / **Ctrl+Y** 撤销/重做操作
7. 点击"确认"应用到朋友圈预览，或"导出"直接保存

#### 朋友圈预览

- 模拟微信个人主页样式
- 点击齿轮图标自定义设置：
  - 上传头像和封面图
  - 设置昵称和个性签名
  - 编辑朋友圈文案
  - 设置时间和位置
  - 添加点赞好友
- 所有设置随项目一起保存

#### 项目管理

- 保存当前编辑状态（图片、效果、朋友圈设置）
- 随时加载之前的项目继续编辑
- 数据存储在浏览器本地 IndexedDB

#### 橡皮擦工具

- 在图片编辑时使用
- 支持擦除和恢复模式
- 可调节画笔大小
- 实时预览修改效果

## 🎨 技术栈

### 核心框架
- **React 18.2** - UI 框架
- **TypeScript 5.2** - 类型安全
- **Vite 5.0** - 构建工具

### UI/样式
- **Tailwind CSS 3.4** - 原子化 CSS
- **自定义玻璃拟态主题** - 现代化设计

### 图像处理
- **Canvas API** - 图片渲染和处理
- **TensorFlow.js** - AI 模型运行
- **@imgly/background-removal** - 智能抠图

### 3D渲染
- **Three.js** - 3D 效果渲染

### 工具库
- **JSZip** - ZIP 文件生成
- **Zustand** - 状态管理

## 📁 项目结构

```
Wechat9Pic/
├── src/
│   ├── components/        # React 组件
│   │   ├── GridEditor.tsx       # 九宫格编辑器
│   │   ├── TemplateSelector.tsx # 模板选择器
│   │   ├── ExportDialog.tsx     # 导出对话框
│   │   ├── LayerEditor.tsx      # 3D图层编辑器
│   │   ├── MomentsPreviewEmbed.tsx # 朋友圈预览
│   │   ├── ProjectManager.tsx   # 项目管理
│   │   ├── EraserTool.tsx       # 橡皮擦工具
│   │   └── ...
│   ├── services/          # 业务逻辑
│   │   ├── ImageManager.ts      # 图片管理
│   │   ├── TemplateEngine.ts    # 模板引擎
│   │   ├── CanvasRenderer.ts    # 画布渲染
│   │   ├── ExportService.ts     # 导出服务
│   │   ├── ProjectStorage.ts    # 项目存储 (IndexedDB)
│   │   ├── GridGenerator.ts     # 九宫格生成器
│   │   └── ...
│   ├── utils/             # 工具函数
│   ├── types/             # TypeScript 类型
│   ├── App.tsx            # 主应用组件
│   ├── main.tsx           # 入口文件
│   └── index.css          # 全局样式
├── public/                # 静态资源
├── dist/                  # 构建输出
└── package.json           # 项目配置
```

## 🔧 配置

### 图片限制
- 最大尺寸: 2048x2048
- 最大文件: 10MB
- 支持格式: JPG, PNG, WEBP

### 导出设置
- PNG: 无损压缩
- JPG: 质量 95%
- 3D图层: 1200x1200px

## 🎯 性能优化

- ✅ 图片自动压缩
- ✅ 懒加载和按需渲染
- ✅ 代码分割（Three.js, TensorFlow.js）
- ✅ 优化的滚动性能
- ✅ 客户端处理（无服务器）

## 🌐 浏览器支持

- ✅ Chrome/Edge (最新版)
- ✅ Firefox (最新版)
- ✅ Safari (最新版)
- ⚠️ 需要支持 ES2020+ 的现代浏览器

## 📝 开发命令

```bash
# 开发
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览构建结果

# 代码质量
npm run lint         # 运行 ESLint
npm run format       # 格式化代码

# 测试
npm test             # 运行测试
npm run test:watch   # 监听模式测试
```

## 🐛 故障排除

### 常见问题

**Q: 图片上传失败？**
- 检查文件格式是否支持
- 确认文件大小不超过 10MB
- 尝试压缩图片后重试

**Q: 3D效果加载慢？**
- AI 抠图需要加载模型（首次较慢）
- 确保网络连接正常
- 建议使用较小的图片

**Q: 导出失败？**
- 检查浏览器是否允许下载
- 确认有足够的磁盘空间
- 尝试刷新页面重试

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件

---

Made with ❤️ by Your Team
