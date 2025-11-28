/**
 * Application constants
 */

// File upload constraints
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_DIMENSION = 2048; // 2048x2048
export const MAX_IMAGES = 9;

// Supported file formats
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
export const SUPPORTED_FILE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Grid positions (0-8 for 3x3 grid)
export const GRID_POSITIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

// Effect parameter ranges
export const EFFECT_RANGES = {
  brightness: { min: -100, max: 100 },
  contrast: { min: -100, max: 100 },
  saturation: { min: -100, max: 100 },
  intensity: { min: 0, max: 100 },
} as const;

// Preview update delay (ms)
export const PREVIEW_UPDATE_DELAY = 500;

// Template switching timeout (ms)
export const TEMPLATE_SWITCH_TIMEOUT = 2000;

// Default filter presets
export const FILTER_PRESETS = [
  'vintage',
  'fresh',
  'warm',
  'cool',
  'blackwhite',
  'sepia',
  'vivid',
  'soft',
  'dramatic',
  'natural',
] as const;

export type FilterPreset = (typeof FILTER_PRESETS)[number];

// Border styles
export const BORDER_STYLES = ['solid', 'gradient', 'pattern'] as const;

// Template categories
export const TEMPLATE_CATEGORIES = [
  'portrait',
  'landscape',
  'food',
  'general',
  '3d-effect',
] as const;

// Storage keys
export const STORAGE_KEYS = {
  PROJECTS: 'wechat-grid-editor-projects',
  SETTINGS: 'wechat-grid-editor-settings',
  RECENT_PROJECTS: 'wechat-grid-editor-recent',
} as const;

// IndexedDB configuration
export const INDEXEDDB_CONFIG = {
  name: 'wechat-grid-editor',
  version: 1,
  stores: {
    projects: 'projects',
    images: 'images',
  },
} as const;

// Error messages (Chinese)
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: '文件大小超过10MB限制',
  INVALID_FILE_FORMAT: '不支持的文件格式，请上传JPG、PNG或WEBP格式的图片',
  FILE_UPLOAD_FAILED: '文件上传失败，请重试',
  IMAGE_PROCESSING_FAILED: '图片处理失败',
  RECOGNITION_FAILED: '内容识别失败',
  RENDER_FAILED: '渲染失败',
  STORAGE_QUOTA_EXCEEDED: '存储空间不足，请删除一些旧项目',
  STORAGE_ACCESS_DENIED: '无法访问本地存储',
  PROJECT_LOAD_FAILED: '项目加载失败',
  EXPORT_FAILED: '导出失败',
  ZIP_CREATION_FAILED: 'ZIP文件创建失败',
  BROWSER_NOT_SUPPORTED: '您的浏览器不支持此功能，请升级浏览器',
  WEBGL_NOT_AVAILABLE: 'WebGL不可用，3D效果已禁用',
  NETWORK_ERROR: '网络错误',
  MAX_IMAGES_EXCEEDED: '最多只能上传9张图片',
} as const;
