'use client';

import React from 'react';
import { GraduationCap } from 'lucide-react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', className = '' }) => {
  let dimension = 40;
  let iconSize = 22;

  if (typeof size === 'number') {
    dimension = size;
    iconSize = Math.round(size * 0.55);
  } else {
    switch (size) {
      case 'sm':
        dimension = 32;
        iconSize = 18;
        break;
      case 'md':
        dimension = 40;
        iconSize = 22;
        break;
      case 'lg':
        dimension = 48;
        iconSize = 26;
        break;
      case 'xl':
        dimension = 64;
        iconSize = 34;
        break;
    }
  }

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 select-none rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25 border border-white/20 transition-all ${className}`}
      style={{ width: dimension, height: dimension }}
      title="PrepKit AI Tutor"
    >
      {/* Subtle top-light rim shine */}
      <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-b from-white/25 to-transparent pointer-events-none opacity-60" />

      {/* Tutor Graduation Cap Icon (Lucide GraduationCap) */}
      <GraduationCap
        style={{ width: iconSize, height: iconSize }}
        className="text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)] relative z-10"
        strokeWidth={2.2}
      />
    </div>
  );
};
