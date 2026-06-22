'use client';

import { useMemo } from 'react';

const COLORS = ['#E34802', '#FF6A2B', '#FFC400', '#22C55E', '#3B82F6', '#EC4899'];

/**
 * Lightweight, dependency-free confetti overlay.
 * Renders absolutely-positioned falling pieces inside a `relative` parent.
 */
export default function Confetti({ pieces = 36 }: { pieces?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2.5,
        duration: 2.2 + Math.random() * 1.8,
        color: COLORS[i % COLORS.length],
        size: 5 + Math.random() * 5,
        rounded: Math.random() > 0.5,
      })),
    [pieces],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {bits.map((b) => (
        <span
          key={b.id}
          className="confetti-piece"
          style={{
            left: `${b.left}%`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            backgroundColor: b.color,
            borderRadius: b.rounded ? '9999px' : '2px',
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
