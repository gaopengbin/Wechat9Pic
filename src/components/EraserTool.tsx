/**
 * EraserTool - 简易橡皮擦工具组件
 * Validates: Requirements 2.4
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

interface EraserToolProps {
  imageData: string;
  onUpdate: (imageData: string) => void;
  onClose: () => void;
}

type EraserMode = 'erase' | 'restore';

const BRUSH_SIZES = [5, 10, 20, 30, 50];

export const EraserTool: React.FC<EraserToolProps> = ({
  imageData,
  onUpdate,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const [brushSize, setBrushSize] = useState(20);
  const [mode, setMode] = useState<EraserMode>('erase');
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

  // Load image and initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      originalImageRef.current = img;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = imageData;
  }, [imageData]);

  // Get canvas coordinates from mouse event
  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  // Draw on canvas
  const draw = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.closePath();

    if (mode === 'erase') {
      // Erase mode: make pixels transparent
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else {
      // Restore mode: restore original pixels
      ctx.globalCompositeOperation = 'source-over';
      ctx.clip();
      if (originalImageRef.current) {
        ctx.drawImage(originalImageRef.current, 0, 0);
      }
    }

    if (mode === 'erase') {
      ctx.fill();
    }

    ctx.restore();
  }, [brushSize, mode]);

  // Draw line between two points
  const drawLine = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const distance = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
    const steps = Math.ceil(distance / (brushSize / 4));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;
      draw(x, y);
    }
  }, [brushSize, draw]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    setIsDrawing(true);
    setLastPos(coords);
    draw(coords.x, coords.y);
  }, [getCanvasCoords, draw]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPos) return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    drawLine(lastPos, coords);
    setLastPos(coords);
  }, [isDrawing, lastPos, getCanvasCoords, drawLine]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    setLastPos(null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDrawing(false);
    setLastPos(null);
  }, []);

  // Apply changes
  const handleApply = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newImageData = canvas.toDataURL('image/png');
    onUpdate(newImageData);
    onClose();
  }, [onUpdate, onClose]);

  // Reset to original
  const handleReset = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImageRef.current, 0, 0);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">橡皮擦工具</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-6 px-6 py-4 bg-white/5 border-b border-white/10">
          {/* Mode Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300">模式:</span>
            <div className="flex rounded-lg overflow-hidden border border-white/10">
              <button
                onClick={() => setMode('erase')}
                className={`px-4 py-1.5 text-sm transition-colors ${mode === 'erase'
                    ? 'bg-purple-600 text-white'
                    : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                擦除
              </button>
              <button
                onClick={() => setMode('restore')}
                className={`px-4 py-1.5 text-sm transition-colors ${mode === 'restore'
                    ? 'bg-purple-600 text-white'
                    : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                恢复
              </button>
            </div>
          </div>

          {/* Brush Size */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300">画笔大小:</span>
            <div className="flex gap-2">
              {BRUSH_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${brushSize === size
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <div
                    className="rounded-full bg-current"
                    style={{ width: Math.min(size / 2, 16), height: Math.min(size / 2, 16) }}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-500 w-8">{brushSize}px</span>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="ml-auto px-4 py-1.5 text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/30 rounded-lg transition-all"
          >
            重置
          </button>
        </div>

        {/* Canvas Area */}
        <div className="p-6 bg-black/40 flex items-center justify-center" style={{ minHeight: '400px' }}>
          <div className="relative bg-white/5 shadow-2xl rounded-lg overflow-hidden border border-white/10">
            {/* Checkerboard background for transparency */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #888 25%, transparent 25%),
                  linear-gradient(-45deg, #888 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #888 75%),
                  linear-gradient(-45deg, transparent 75%, #888 75%)
                `,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
              }}
            />
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              className="relative max-w-full max-h-[500px] cursor-crosshair"
              style={{ cursor: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${brushSize}" height="${brushSize}"><circle cx="${brushSize / 2}" cy="${brushSize / 2}" r="${brushSize / 2 - 1}" fill="none" stroke="white" stroke-width="1" style="filter: drop-shadow(0 0 2px black);"/></svg>') ${brushSize / 2} ${brushSize / 2}, crosshair` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/5">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm text-gray-300 hover:text-white border border-white/10 hover:border-white/30 rounded-xl transition-all"
          >
            取消
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:-translate-y-0.5"
          >
            应用更改
          </button>
        </div>
      </div>
    </div>
  );
};

export default EraserTool;
