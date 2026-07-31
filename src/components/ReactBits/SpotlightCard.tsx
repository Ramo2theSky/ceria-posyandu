'use client';

import { useState } from 'react';

type SpotlightCardProps = {
  children: React.ReactNode;
  spotlightColor?: string;
  className?: string;
};

export default function SpotlightCard({
  children,
  spotlightColor = 'rgba(13, 148, 136, 0.16)',
  className = '',
}: SpotlightCardProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 });

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg ${className}`}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        setPosition({ x, y });
      }}
      onMouseLeave={() => setPosition({ x: 50, y: 50 })}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at ${position.x}% ${position.y}%, ${spotlightColor}, transparent 55%)`,
          opacity: 1,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}