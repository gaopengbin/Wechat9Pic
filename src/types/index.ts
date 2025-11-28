/**
 * Core type definitions for the WeChat Grid Editor application
 */

// Content types for image recognition
export type ContentType = 'portrait' | 'landscape' | 'food' | 'object' | 'pet' | 'unknown';

// Pose types for human detection
export type PoseType = 'single' | 'multiple' | 'full-body' | 'half-body' | 'closeup' | 'none';

// Export formats
export type ExportFormat = 'png' | 'jpg';

// Error types
export enum ErrorType {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  IMAGE_PROCESSING_FAILED = 'IMAGE_PROCESSING_FAILED',
  RECOGNITION_FAILED = 'RECOGNITION_FAILED',
  RENDER_FAILED = 'RENDER_FAILED',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_ACCESS_DENIED = 'STORAGE_ACCESS_DENIED',
  PROJECT_LOAD_FAILED = 'PROJECT_LOAD_FAILED',
  EXPORT_FAILED = 'EXPORT_FAILED',
  ZIP_CREATION_FAILED = 'ZIP_CREATION_FAILED',
  BROWSER_NOT_SUPPORTED = 'BROWSER_NOT_SUPPORTED',
  WEBGL_NOT_AVAILABLE = 'WEBGL_NOT_AVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

// Image metadata
export interface ImageMetadata {
  fileSize: number;
  format: string;
  uploadedAt: Date;
}

// Image data structure
export interface ImageData {
  id: string;
  position: number;
  originalFile: File;
  thumbnail: string; // Base64
  fullSize: string; // Base64
  width: number;
  height: number;
  contentType: ContentType;
  metadata: ImageMetadata;
}

// Upload result
export interface UploadResult {
  success: boolean;
  imageData?: ImageData;
  error?: string;
}

// Recognition result
export interface RecognitionResult {
  contentType: ContentType;
  confidence: number;
  labels: string[];
}

// Pose detection result
export interface PoseKeypoint {
  x: number;
  y: number;
  confidence: number;
}

export interface PoseResult {
  poseType: PoseType;
  confidence: number;
  keypoints?: PoseKeypoint[];
}

// 3D Transform configuration
export interface RotationConfig {
  position: number; // 0-8
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  translateZ: number;
}

export interface ShadowConfig {
  enabled: boolean;
  blur: number;
  opacity: number;
  offsetX: number;
  offsetY: number;
}

export interface Transform3DConfig {
  enabled: boolean;
  perspective: number;
  rotations: RotationConfig[];
  shadows: ShadowConfig;
  depth: number;
}

// Filter configuration
export interface FilterConfig {
  brightness: number; // -100 to 100
  contrast: number;
  saturation: number;
  preset?: string;
}

// Border configuration
export interface BorderConfig {
  enabled: boolean;
  width: number;
  style: 'solid' | 'gradient' | 'pattern';
  color: string;
}

// Layout configuration
export interface LayoutConfig {
  spacing: number;
  backgroundColor: string;
}

// Effect configuration
export interface EffectConfig {
  transform3D?: Transform3DConfig;
  filter?: FilterConfig;
  border?: BorderConfig;
  layout?: LayoutConfig;
}

// Effect template
export interface EffectTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'portrait' | 'landscape' | 'food' | 'general' | '3d-effect';
  suitableFor: ContentType[];
  effects: EffectConfig;
}

// Processed image
export interface ProcessedImage {
  position: number;
  originalId: string;
  processedData: string; // Base64
  appliedEffects: EffectConfig;
}

// Project structure
export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  images: ImageData[];
  template: EffectTemplate;
  customSettings: EffectConfig;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  thumbnail: string;
  createdAt: Date;
  updatedAt: Date;
  imageCount: number;
}

// Application error
export interface RecoveryAction {
  label: string;
  action: () => void;
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: unknown;
  recoverable: boolean;
  recoveryActions?: RecoveryAction[];
}


// ============================================
// 3D Layer Effect Types
// ============================================

// Layer error types
export enum LayerErrorType {
  MATTING_FAILED = 'MATTING_FAILED',
  MATTING_TIMEOUT = 'MATTING_TIMEOUT',
  MAX_LAYERS_EXCEEDED = 'MAX_LAYERS_EXCEEDED',
  INVALID_IMAGE = 'INVALID_IMAGE',
  RENDER_FAILED = 'RENDER_FAILED',
  EXPORT_FAILED = 'EXPORT_FAILED',
}

// Layer type
export type LayerType = 'background' | 'subject';

// Transform configuration for layers
export interface LayerTransformConfig {
  x: number; // Position X (can be negative)
  y: number; // Position Y (can be negative)
  scale: number; // 10-300%
  rotation: number; // -180 to 180 degrees
}

// Shadow configuration for layers
export interface LayerShadowConfig {
  enabled: boolean;
  blur: number; // 0-30px
  offsetX: number; // -50 to 50px
  offsetY: number; // -50 to 50px
  opacity: number; // 0-100%
  color: string; // Default #000000
}

// Layer structure
export interface Layer {
  id: string;
  type: LayerType;
  imageData: string; // Base64
  transform: LayerTransformConfig;
  shadow: LayerShadowConfig;
  opacity: number; // 0-100
  visible: boolean;
  zIndex: number;
}

// Grid configuration for background
export interface GridConfig {
  images: string[]; // 9 images in Base64
  borderWidth: number; // 1-10px
  borderColor: string; // Border color
  outputSize: number; // Output size (default 1080)
}

// Matting result
export interface MattingResult {
  success: boolean;
  imageData?: string; // Transparent PNG in Base64
  error?: string;
}

// Layer editor state
export interface LayerEditorState {
  layers: Layer[];
  selectedLayerId: string | null;
  gridConfig: {
    borderWidth: number;
    borderColor: string;
  };
  ui: {
    isProcessing: boolean;
    isExporting: boolean;
    previewMode: boolean;
  };
}

// Parameter constraints
export const LAYER_CONSTRAINTS = {
  // Scale range
  scale: { min: 10, max: 300 },

  // Rotation range
  rotation: { min: -180, max: 180 },

  // Shadow blur
  shadowBlur: { min: 0, max: 30 },

  // Shadow offset
  shadowOffset: { min: -50, max: 50 },

  // Opacity
  opacity: { min: 0, max: 100 },

  // Border width
  borderWidth: { min: 1, max: 10 },

  // Maximum layers
  maxLayers: 5,

  // Output size
  outputSize: 1080,
} as const;

// Default values
export const DEFAULT_TRANSFORM: LayerTransformConfig = {
  x: 0,
  y: 0,
  scale: 100,
  rotation: 0,
};

export const DEFAULT_SHADOW: LayerShadowConfig = {
  enabled: false,
  blur: 10,
  offsetX: 5,
  offsetY: 5,
  opacity: 50,
  color: '#000000',
};

export const DEFAULT_GRID_CONFIG = {
  borderWidth: 2,
  borderColor: '#ffffff',
  outputSize: 1080,
};
