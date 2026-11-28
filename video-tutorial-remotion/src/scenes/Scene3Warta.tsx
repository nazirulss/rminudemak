import React from 'react';
import { interpolate, useCurrentFrame, staticFile, Img } from 'remotion';
import { LowerThird } from '../components/LowerThird';
import { PhoneFrame } from '../components/PhoneFrame';
import { CursorTap } from '../components/CursorTap';

export const Scene3Warta: React.FC = () => {
  const frame = useCurrentFrame();

  // Multi-stage buttery smooth scroll:
  // 1. Top of Warta (frame 0 - 50): scroll = 0
  // 2. Scroll to 5 Halaqah Bar (frame 50 - 150): scroll 0 -> -1050
  // 3. Pause at 5 Halaqah & tap Tab 1 (frame 150 - 240): scroll = -1050
  // 4. Scroll to Spotlight Card 1 (frame 240 - 320): scroll -1050 -> -1950
  // 5. Pause & tap "Pilih & Daftar Halaqah Ini" (frame 320 - 390): scroll = -1950
  // 6. Glide toward RSVP Form (frame 390 - 450): scroll -1950 -> -2800
  let scrollY = 0;
  if (frame < 50) {
    scrollY = 0;
  } else if (frame < 150) {
    scrollY = interpolate(frame, [50, 150], [0, -1050], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame < 240) {
    scrollY = -1050;
  } else if (frame < 320) {
    scrollY = interpolate(frame, [240, 320], [-1050, -1950], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame < 390) {
    scrollY = -1950;
  } else {
    scrollY = interpolate(frame, [390, 450], [-1950, -2800], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  return (
    <div className="relative w-full h-full bg-[#03130f] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute w-[1000px] h-[1000px] bg-teal-500/15 rounded-full blur-[160px] pointer-events-none" />

      <PhoneFrame showSafariBar={true} urlText="rminudemak.org/undangan.html">
        <div className="relative w-full h-full overflow-hidden bg-[#011d17]">
          {/* 🌟 100% Identical Full Page Scroll Capture */}
          <div
            style={{ transform: `translateY(${scrollY}px)` }}
            className="w-full relative transition-transform"
          >
            <Img
              src={staticFile('screens/screen_full_warta_empty.png')}
              className="w-full h-auto block"
            />
          </div>

          {/* Cursor 1: Tapping Halaqah 1 Tab at frame 200 */}
          {frame >= 170 && frame < 260 && (
            <CursorTap x={380} y={620} tapFrame={200} />
          )}

          {/* Cursor 2: Tapping "Pilih & Daftar Halaqah Ini ↓" at frame 360 */}
          {frame >= 330 && frame < 410 && (
            <CursorTap x={380} y={1200} tapFrame={360} />
          )}
        </div>
      </PhoneFrame>

      <LowerThird
        step="03"
        title="Tinjau Rincian 5 Halaqah"
        subtitle="Auto-scroll memandu layar, sentuh halaqah sesuai surat mandat fisik"
      />
    </div>
  );
};
