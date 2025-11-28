/**
 * ImageEditor - 单个图片编辑器组件
 * 支持拖动裁剪、滚轮缩放、旋转等高级交互
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { ImageData } from '@/types';

interface ImageEditorProps {
    image: ImageData;
    onSave: (croppedImage: string) => void;
    onClose: () => void;
}

interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e' | null;

export default function ImageEditor({ image, onSave, onClose }: ImageEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 });
    const [dragMode, setDragMode] = useState<DragMode>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [startCrop, setStartCrop] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });

    const [rotation, setRotation] = useState(0);
    const [scale, setScale] = useState(1);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // 加载图片
    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            // 计算适应屏幕的显示尺寸
            const maxWidth = 800;
            const maxHeight = 600;
            let width = img.width;
            let height = img.height;

            // 保持长宽比缩放
            const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);

            setImageSize({ width, height });
            setOriginalImage(img);

            // 初始化裁剪区域：居中，大小为画布的 80%
            const cropW = width * 0.8;
            const cropH = height * 0.8;
            setCropArea({
                x: (width - cropW) / 2,
                y: (height - cropH) / 2,
                width: cropW,
                height: cropH,
            });
        };
        img.src = image.fullSize;
    }, [image.fullSize]);

    // 绘制函数
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !originalImage) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 设置画布大小
        canvas.width = imageSize.width;
        canvas.height = imageSize.height;

        // 1. 绘制背景（黑色）
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. 绘制变换后的图片
        ctx.save();
        // 移动到画布中心
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);
        // 绘制图片（居中）
        ctx.drawImage(
            originalImage,
            -imageSize.width / 2,
            -imageSize.height / 2,
            imageSize.width,
            imageSize.height
        );
        ctx.restore();

        // 3. 绘制半透明遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 4. 清除裁剪区域（显示亮色原图）
        // 这里不能简单 clearRect，因为要显示下面的图片。
        // 我们使用 clip 重新绘制一遍图片在裁剪区域内
        ctx.save();
        ctx.beginPath();
        ctx.rect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
        ctx.clip();

        // 再次绘制图片（为了在裁剪区域显示）
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);
        ctx.drawImage(
            originalImage,
            -imageSize.width / 2,
            -imageSize.height / 2,
            imageSize.width,
            imageSize.height
        );
        ctx.restore();

        // 5. 绘制裁剪框边框
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

        // 6. 绘制九宫格辅助线
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // 竖线
        ctx.moveTo(cropArea.x + cropArea.width / 3, cropArea.y);
        ctx.lineTo(cropArea.x + cropArea.width / 3, cropArea.y + cropArea.height);
        ctx.moveTo(cropArea.x + (cropArea.width * 2) / 3, cropArea.y);
        ctx.lineTo(cropArea.x + (cropArea.width * 2) / 3, cropArea.y + cropArea.height);
        // 横线
        ctx.moveTo(cropArea.x, cropArea.y + cropArea.height / 3);
        ctx.lineTo(cropArea.x + cropArea.width, cropArea.y + cropArea.height / 3);
        ctx.moveTo(cropArea.x, cropArea.y + (cropArea.height * 2) / 3);
        ctx.lineTo(cropArea.x + cropArea.width, cropArea.y + (cropArea.height * 2) / 3);
        ctx.stroke();

        // 7. 绘制控制点
        const handleSize = 8;
        ctx.fillStyle = '#fff';
        const drawHandle = (x: number, y: number) => {
            ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
        };

        // 角落
        drawHandle(cropArea.x, cropArea.y); // nw
        drawHandle(cropArea.x + cropArea.width, cropArea.y); // ne
        drawHandle(cropArea.x, cropArea.y + cropArea.height); // sw
        drawHandle(cropArea.x + cropArea.width, cropArea.y + cropArea.height); // se

        // 边中点
        drawHandle(cropArea.x + cropArea.width / 2, cropArea.y); // n
        drawHandle(cropArea.x + cropArea.width / 2, cropArea.y + cropArea.height); // s
        drawHandle(cropArea.x, cropArea.y + cropArea.height / 2); // w
        drawHandle(cropArea.x + cropArea.width, cropArea.y + cropArea.height / 2); // e

    }, [imageSize, originalImage, rotation, scale, cropArea]);

    // 实时重绘
    useEffect(() => {
        draw();
    }, [draw]);

    // 鼠标交互处理
    const getHandle = (x: number, y: number): DragMode => {
        const h = 10; // 响应区域大小
        const { x: cx, y: cy, width: cw, height: ch } = cropArea;

        // 检查角落
        if (Math.abs(x - cx) < h && Math.abs(y - cy) < h) return 'nw';
        if (Math.abs(x - (cx + cw)) < h && Math.abs(y - cy) < h) return 'ne';
        if (Math.abs(x - cx) < h && Math.abs(y - (cy + ch)) < h) return 'sw';
        if (Math.abs(x - (cx + cw)) < h && Math.abs(y - (cy + ch)) < h) return 'se';

        // 检查边缘
        if (Math.abs(y - cy) < h && x > cx && x < cx + cw) return 'n';
        if (Math.abs(y - (cy + ch)) < h && x > cx && x < cx + cw) return 's';
        if (Math.abs(x - cx) < h && y > cy && y < cy + ch) return 'w';
        if (Math.abs(x - (cx + cw)) < h && y > cy && y < cy + ch) return 'e';

        // 检查内部
        if (x > cx && x < cx + cw && y > cy && y < cy + ch) return 'move';

        return null;
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        // 注意：如果 Canvas 被 CSS 缩放了，这里需要处理缩放比例
        // 目前我们假设 Canvas 没有被 CSS 缩放（或者缩放比例为 1）
        // 为了更稳健，我们可以计算缩放比例
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const mode = getHandle(x, y);
        if (mode) {
            setDragMode(mode);
            setDragStart({ x, y });
            setStartCrop({ ...cropArea });
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // 更新鼠标样式
        if (!dragMode) {
            const mode = getHandle(x, y);
            let cursor = 'default';
            switch (mode) {
                case 'nw': case 'se': cursor = 'nwse-resize'; break;
                case 'ne': case 'sw': cursor = 'nesw-resize'; break;
                case 'n': case 's': cursor = 'ns-resize'; break;
                case 'w': case 'e': cursor = 'ew-resize'; break;
                case 'move': cursor = 'move'; break;
            }
            canvas.style.cursor = cursor;
            return;
        }

        // 处理拖动
        const dx = x - dragStart.x;
        const dy = y - dragStart.y;
        let newCrop = { ...startCrop };

        // 最小尺寸限制
        const minSize = 20;

        switch (dragMode) {
            case 'move':
                newCrop.x += dx;
                newCrop.y += dy;
                // 边界检查
                newCrop.x = Math.max(0, Math.min(newCrop.x, canvas.width - newCrop.width));
                newCrop.y = Math.max(0, Math.min(newCrop.y, canvas.height - newCrop.height));
                break;

            case 'nw':
                newCrop.x += dx;
                newCrop.y += dy;
                newCrop.width -= dx;
                newCrop.height -= dy;
                break;
            case 'ne':
                newCrop.y += dy;
                newCrop.width += dx;
                newCrop.height -= dy;
                break;
            case 'sw':
                newCrop.x += dx;
                newCrop.width -= dx;
                newCrop.height += dy;
                break;
            case 'se':
                newCrop.width += dx;
                newCrop.height += dy;
                break;
            case 'n':
                newCrop.y += dy;
                newCrop.height -= dy;
                break;
            case 's':
                newCrop.height += dy;
                break;
            case 'w':
                newCrop.x += dx;
                newCrop.width -= dx;
                break;
            case 'e':
                newCrop.width += dx;
                break;
        }

        // 规范化宽高（处理负值）和最小尺寸
        if (newCrop.width < minSize) {
            if (dragMode.includes('w')) newCrop.x = startCrop.x + startCrop.width - minSize;
            newCrop.width = minSize;
        }
        if (newCrop.height < minSize) {
            if (dragMode.includes('n')) newCrop.y = startCrop.y + startCrop.height - minSize;
            newCrop.height = minSize;
        }

        setCropArea(newCrop);
    };

    const handleMouseUp = () => {
        setDragMode(null);
    };

    // 滚轮缩放
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(0.1, scale + delta), 5);
        setScale(newScale);
    };

    // 保存裁剪
    const handleCrop = async () => {
        if (!originalImage || isSaving) return;

        setIsSaving(true);

        // 稍微延迟一下，让 UI 有机会更新 loading 状态
        setTimeout(() => {
            // 创建输出画布
            const outputCanvas = document.createElement('canvas');
            outputCanvas.width = cropArea.width;
            outputCanvas.height = cropArea.height;
            const ctx = outputCanvas.getContext('2d');
            if (!ctx) {
                setIsSaving(false);
                return;
            }

            // 核心逻辑：所见即所得
            const cx = imageSize.width / 2;
            const cy = imageSize.height / 2;

            ctx.translate(cx - cropArea.x, cy - cropArea.y);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(scale, scale);

            ctx.drawImage(
                originalImage,
                -imageSize.width / 2,
                -imageSize.height / 2,
                imageSize.width,
                imageSize.height
            );

            // 导出
            const croppedImage = outputCanvas.toDataURL('image/jpeg', 0.95);
            onSave(croppedImage);
            // 注意：这里不设置 setIsSaving(false)，因为组件即将卸载
        }, 50);
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="flex flex-col w-full max-w-6xl h-[95vh] p-4">
                {/* 顶部标题栏 */}
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        图片编辑
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white transition-colors" disabled={isSaving}>
                            取消
                        </button>
                        <button
                            onClick={handleCrop}
                            disabled={isSaving}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white rounded-lg font-medium transition-colors shadow-lg shadow-purple-500/30 flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    保存中...
                                </>
                            ) : (
                                '保存并使用'
                            )}
                        </button>
                    </div>
                </div>

                {/* 主编辑区 */}
                <div className="flex-1 flex gap-4 min-h-0">
                    {/* 画布区域 */}
                    <div className="flex-1 bg-[#1a1a1a] rounded-xl overflow-hidden relative flex items-center justify-center border border-white/10">
                        <canvas
                            ref={canvasRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onWheel={handleWheel}
                            className="shadow-2xl max-w-full max-h-full object-contain"
                        />
                        {/* 提示浮层 */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-4 py-2 rounded-full text-xs text-white/70 pointer-events-none">
                            滚轮缩放 • 拖动调整裁剪框
                        </div>
                    </div>

                    {/* 右侧工具栏 */}
                    <div className="w-72 glass-panel rounded-xl p-5 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar">
                        {/* 旋转控制 */}
                        <div>
                            <label className="text-sm font-medium text-gray-300 mb-3 flex items-center justify-between">
                                <span>旋转</span>
                                <span className="text-purple-400">{rotation}°</span>
                            </label>
                            <div className="flex gap-2 mb-2">
                                <button
                                    onClick={() => setRotation((r) => r - 90)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-lg text-xs transition-colors"
                                >
                                    -90°
                                </button>
                                <button
                                    onClick={() => setRotation((r) => r + 90)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-lg text-xs transition-colors"
                                >
                                    +90°
                                </button>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="360"
                                value={rotation}
                                onChange={(e) => setRotation(Number(e.target.value))}
                                className="w-full accent-purple-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* 缩放控制 */}
                        <div>
                            <label className="text-sm font-medium text-gray-300 mb-3 flex items-center justify-between">
                                <span>缩放</span>
                                <span className="text-purple-400">{Math.round(scale * 100)}%</span>
                            </label>
                            <input
                                type="range"
                                min="0.1"
                                max="3"
                                step="0.1"
                                value={scale}
                                onChange={(e) => setScale(Number(e.target.value))}
                                className="w-full accent-purple-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>10%</span>
                                <span>300%</span>
                            </div>
                        </div>

                        {/* 底部操作栏 */}
                        <div className="mt-auto pt-4 border-t border-white/10 space-y-3">
                            <button
                                onClick={() => {
                                    setRotation(0);
                                    setScale(1);
                                    if (imageSize.width > 0) {
                                        const cropW = imageSize.width * 0.8;
                                        const cropH = imageSize.height * 0.8;
                                        setCropArea({
                                            x: (imageSize.width - cropW) / 2,
                                            y: (imageSize.height - cropH) / 2,
                                            width: cropW,
                                            height: cropH,
                                        });
                                    }
                                }}
                                className="w-full py-2 border border-white/20 rounded-lg text-sm text-gray-300 hover:bg-white/5 transition-colors"
                                disabled={isSaving}
                            >
                                重置所有调整
                            </button>

                            <button
                                onClick={handleCrop}
                                disabled={isSaving}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white rounded-lg font-medium transition-colors shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        保存中...
                                    </>
                                ) : (
                                    '保存并使用'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
