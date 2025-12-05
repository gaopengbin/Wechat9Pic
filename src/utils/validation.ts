/**
 * Validation utilities for file uploads and data
 */

import {
  MAX_FILE_SIZE,
  SUPPORTED_IMAGE_FORMATS,
  MAX_IMAGES,
  EFFECT_RANGES,
} from '@/types/constants';
import type { ContentType, PoseType } from '@/types';

/**
 * Validate if a file is a valid image (including HEIC by extension)
 */
export function isValidImageFile(file: File): boolean {
  // Check MIME type
  if (SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
    return true;
  }
  // Some browsers don't recognize HEIC MIME type, check extension
  const ext = file.name.toLowerCase();
  return ext.endsWith('.heic') || ext.endsWith('.heif');
}

/**
 * Validate if file size is within limits
 */
export function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Validate if position is valid (0-8)
 */
export function isValidPosition(position: number): boolean {
  return Number.isInteger(position) && position >= 0 && position < MAX_IMAGES;
}

/**
 * Validate if content type is valid
 */
export function isValidContentType(type: string): type is ContentType {
  const validTypes: ContentType[] = [
    'portrait',
    'landscape',
    'food',
    'object',
    'pet',
    'unknown',
  ];
  return validTypes.includes(type as ContentType);
}

/**
 * Validate if pose type is valid
 */
export function isValidPoseType(type: string): type is PoseType {
  const validTypes: PoseType[] = [
    'single',
    'multiple',
    'full-body',
    'half-body',
    'closeup',
    'none',
  ];
  return validTypes.includes(type as PoseType);
}

/**
 * Validate and clamp effect parameter value
 */
export function clampEffectValue(
  value: number,
  type: 'brightness' | 'contrast' | 'saturation' | 'intensity'
): number {
  const range = EFFECT_RANGES[type];
  return Math.max(range.min, Math.min(range.max, value));
}

/**
 * Validate if a value is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate image dimensions
 */
export function isValidDimensions(width: number, height: number): boolean {
  return width > 0 && height > 0 && width <= 10000 && height <= 10000;
}

/**
 * Validate file extension
 */
export function hasValidExtension(filename: string): boolean {
  const ext = filename.toLowerCase().match(/\.(jpg|jpeg|png|webp|heic|heif)$/);
  return ext !== null;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Validate project name
 */
export function isValidProjectName(name: string): boolean {
  return name.trim().length > 0 && name.length <= 100;
}
