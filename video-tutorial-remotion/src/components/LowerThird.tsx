import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface LowerThirdProps {
  step: string;
  title: string;
  subtitle?: string;
}

export const LowerThird: React.FC<LowerThirdProps> = ({ step, title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  return (
    <div
      style={{
        transform: `translateY(${(1 - entrance) * 40}px)`,
        opacity: entrance,
      }}
      className="absolute bottom-6 left-10 right-10 z-50 bg-[#002b21]/95 backdrop-blur-xl border-2 border-emerald-400/50 rounded-2xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex items-center gap-4"
    >
      {/* Badge Step */}
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0 border border-emerald-300/30">
        {step}
      </div>

      {/* Text Info */}
      <div className="min-w-0 flex-1">
        <h3 className="text-xl font-black text-white leading-tight">{title}</h3>
        {subtitle && (
          <p className="text-sm text-emerald-200/90 font-medium mt-0.5 leading-snug">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
