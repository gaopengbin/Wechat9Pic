/**
 * DraggableContainer - 可拖动容器组件
 * 使主应用窗口可以被拖动
 */

import { useState, useRef, useEffect, ReactNode } from 'react';

interface DraggableContainerProps {
    children: ReactNode;
    className?: string;
    dragHandleClassName?: string;
}

export default function DraggableContainer({
    children,
    className = '',
    dragHandleClassName = '',
}: DraggableContainerProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragRef = useRef<HTMLDivElement>(null);
    const dragStartPos = useRef({ x: 0, y: 0, elementX: 0, elementY: 0 });

    // 处理鼠标按下事件
    const handleMouseDown = (e: React.MouseEvent) => {
        // 检查是否点击在拖动把手上
        const target = e.target as HTMLElement;
        const isDragHandle = target.closest(`.${dragHandleClassName}`) || dragHandleClassName === '';

        if (!isDragHandle) return;

        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX,
            y: e.clientY,
            elementX: position.x,
            elementY: position.y,
        };

        e.preventDefault();
    };

    // 处理鼠标移动事件
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const deltaX = e.clientX - dragStartPos.current.x;
            const deltaY = e.clientY - dragStartPos.current.y;

            setPosition({
                x: dragStartPos.current.elementX + deltaX,
                y: dragStartPos.current.elementY + deltaY,
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div
            ref={dragRef}
            className={className}
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
                cursor: isDragging ? 'grabbing' : 'default',
                transition: isDragging ? 'none' : 'transform 0.2s ease',
            }}
            onMouseDown={handleMouseDown}
        >
            {children}
        </div>
    );
}
