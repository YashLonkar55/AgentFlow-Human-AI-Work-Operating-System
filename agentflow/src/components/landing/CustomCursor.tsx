'use client';

import { useEffect, useRef } from 'react';

export default function CustomCursor() {
    const dotRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);
    const mouse = useRef({ x: 0, y: 0 });
    const ring = useRef({ x: 0, y: 0 });
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const dot = dotRef.current;
        const ringEl = ringRef.current;
        if (!dot || !ringEl) return;

        // Track mouse
        const onMove = (e: MouseEvent) => {
            mouse.current = { x: e.clientX, y: e.clientY };
            dot.style.left = `${e.clientX}px`;
            dot.style.top = `${e.clientY}px`;
        };

        // Smooth ring follow
        const animate = () => {
            ring.current.x += (mouse.current.x - ring.current.x) * 0.12;
            ring.current.y += (mouse.current.y - ring.current.y) * 0.12;
            ringEl.style.left = `${ring.current.x}px`;
            ringEl.style.top = `${ring.current.y}px`;
            rafRef.current = requestAnimationFrame(animate);
        };
        rafRef.current = requestAnimationFrame(animate);

        // Cursor state on hover
        const onOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const isBtn = target.closest('button, a, [data-cursor="pointer"]');
            const isText = target.closest('p, h1, h2, h3, span, li');
            document.body.classList.toggle('cursor-hover', !!isBtn);
            document.body.classList.toggle('cursor-link', !!isText && !isBtn);
        };

        window.addEventListener('mousemove', onMove, { passive: true });
        window.addEventListener('mouseover', onOver, { passive: true });

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseover', onOver);
            cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <>
            <div ref={dotRef} className="cursor-dot" aria-hidden />
            <div ref={ringRef} className="cursor-ring" aria-hidden />
        </>
    );
}