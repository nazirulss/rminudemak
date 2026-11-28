import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface CursorTapProps {
  x: number;
  y: number;
  tapFrame?: number; // frame saat ketukan terjadi
}

export const CursorTap: React.FC<CursorTapProps> = ({ x, y, tapFrame = 30 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Efek membesar lalu mengecil saat mengetuk
  const isTapping = frame >= tapFrame && frame <= tapFrame + 15;
  const scale = spring({
    frame: frame - tapFrame,
    fps,
    config: { damping: 12, mass: 0.5 },
  });

  const rippleOpacity = interpolate(frame - tapFrame, [0, 20], [0.8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const rippleScale = interpolate(frame - tapFrame, [0, 20], [0.8, 2.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{ left: `${x}px`, top: `${y}px` }}
      className="absolute z-50 pointer-events-none -translate-x-1/2 -translate-y-1/2"
    >
      {/* Ripple Ring Effect */}
      {frame >= tapFrame && (
        <div
          style={{
            opacity: rippleOpacity,
            transform: `scale(${rippleScale})`,
          }}
          className="absolute inset-0 w-16 h-16 -ml-8 -mt-8 rounded-full border-4 border-emerald-400 bg-emerald-400/20"
        />
      )}

      {/* Pointer Circle */}
      <div
        style={{
          transform: `scale(${isTapping ? 0.85 : 1})`,
        }}
        className="w-10 h-10 rounded-full bg-white/90 border-2 border-emerald-500 shadow-2xl flex items-center justify-center backdrop-blur-sm"
      >
        <div className="w-4 h-4 rounded-full bg-emerald-600 animate-pulse" />
      </div>
    </div>
  );
};
