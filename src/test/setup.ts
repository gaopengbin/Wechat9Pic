import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Extend Vitest matchers
expect.extend({});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = () => 'mock-url';
global.URL.revokeObjectURL = () => {};

// Mock FileReader
global.FileReader = class FileReader {
  result: string | ArrayBuffer | null = null;
  onload: ((this: FileReader, ev: ProgressEvent) => unknown) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent) => unknown) | null = null;

  readAsDataURL() {
    setTimeout(() => {
      this.result = 'data:image/jpeg;base64,mockbase64data';
      if (this.onload) {
        this.onload.call(this, {} as ProgressEvent);
      }
    }, 0);
  }

  readAsArrayBuffer() {
    setTimeout(() => {
      this.result = new ArrayBuffer(8);
      if (this.onload) {
        this.onload.call(this, {} as ProgressEvent);
      }
    }, 0);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

// Mock Image with dynamic size based on src
global.Image = class Image {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private _src = '';
  width = 800;
  height = 600;

  get src() {
    return this._src;
  }

  set src(value: string) {
    this._src = value;
    // Parse dimensions from data URL if it contains size info
    // Format: data:image/png;size=WxH;base64,...
    if (value && typeof value === 'string') {
      const sizeMatch = value.match(/;size=(\d+)x(\d+);/);
      if (sizeMatch) {
        this.width = parseInt(sizeMatch[1], 10);
        this.height = parseInt(sizeMatch[2], 10);
      }
    }
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = function () {
  return {
    drawImage: () => {},
    getImageData: () => ({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1,
    }),
    putImageData: () => {},
    fillRect: () => {},
    clearRect: () => {},
    strokeRect: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    globalAlpha: 1,
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    fillStyle: '',
    createImageData: (w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4),
      width: w,
      height: h,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
};

HTMLCanvasElement.prototype.toBlob = function (callback) {
  setTimeout(() => {
    callback(new Blob(['mock'], { type: 'image/png' }));
  }, 0);
};

HTMLCanvasElement.prototype.toDataURL = function () {
  return 'data:image/png;base64,mockbase64data';
};
