import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig, staticFile, Img } from 'remotion';
import { LowerThird } from '../components/LowerThird';
import { PhoneFrame } from '../components/PhoneFrame';
import { CursorTap } from '../components/CursorTap';

export const Scene2Cover: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 14 },
  });

  // Exit transition sliding up at the end of scene
  const exitSlide = interpolate(frame, [200, 240], [0, -100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div className="relative w-full h-full bg-[#03130f] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute w-[1000px] h-[1000px] bg-emerald-500/15 rounded-full blur-[160px] pointer-events-none" />

      <PhoneFrame showSafariBar={true} urlText="rminudemak.org/undangan.html">
        <div
          style={{
            opacity: entrance,
            transform: `translateY(${exitSlide}px)`,
          }}
          className="relative w-full h-full overflow-hidden flex flex-col"
        >
          {/* 🌟 100% Identical Real Screen Capture */}
          <Img
            src={staticFile('screens/screen_cover_clean.png')}
            className="w-full h-full object-cover object-top"
          />

          {/* Cursor tapping the "Buka Warta & Undangan" button at frame 150 */}
          {frame >= 100 && <CursorTap x={380} y={1310} tapFrame={150} />}
        </div>
      </PhoneFrame>

      <LowerThird
        step="02"
        title="Ketuk 'Buka Warta & Undangan'"
        subtitle="Sampul amplop resmi terpersonalisasi untuk delegasi pesantren"
      />
    </div>
  );
};
