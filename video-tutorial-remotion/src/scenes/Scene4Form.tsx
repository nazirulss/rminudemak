import React from 'react';
import { interpolate, useCurrentFrame, staticFile, Img } from 'remotion';
import { LowerThird } from '../components/LowerThird';
import { PhoneFrame } from '../components/PhoneFrame';
import { CursorTap } from '../components/CursorTap';

export const Scene4Form: React.FC = () => {
  const frame = useCurrentFrame();

  // Position of RSVP form in phone view
  // Form container starts at ~3380px in the full page
  const scrollY = -3360;

  // Crossfade between empty form and filled form to simulate instant typing/filling
  const filledOpacity = interpolate(frame, [60, 100], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Tap button occurs at frame 300
  const isTapped = frame >= 300;

  return (
    <div className="relative w-full h-full bg-[#03130f] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute w-[1000px] h-[1000px] bg-emerald-600/15 rounded-full blur-[160px] pointer-events-none" />

      <PhoneFrame showSafariBar={true} urlText="rminudemak.org/undangan.html">
        <div className="relative w-full h-full overflow-hidden bg-[#011d17]">
          
          {/* Base Image: Empty form */}
          <div
            style={{ transform: `translateY(${scrollY}px)` }}
            className="w-full absolute top-0 left-0"
          >
            <Img
              src={staticFile('screens/screen_full_warta_empty.png')}
              className="w-full h-auto block"
            />
          </div>

          {/* Overlaid Image: Filled form v2 (Karangangung, PPTQ Asnawiyyah) with smooth crossfade */}
          <div
            style={{
              transform: `translateY(${scrollY}px)`,
              opacity: filledOpacity,
            }}
            className="w-full absolute top-0 left-0 transition-opacity"
          >
            <Img
              src={staticFile('screens/screen_full_warta_filled_v2.png')}
              className="w-full h-auto block"
            />
          </div>

          {/* Feedback loading badge when button is tapped */}
          {isTapped && (
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-40 bg-emerald-950/95 border-2 border-emerald-400 text-white text-xs px-5 py-2.5 rounded-full font-bold shadow-2xl flex items-center gap-2 backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Memvalidasi &amp; Menerbitkan E-Pass...</span>
            </div>
          )}

          {/* Cursor tapping "Konfirmasi Hadir & Buat Kartu Absensi" at frame 300 */}
          {frame >= 250 && frame < 370 && (
            <CursorTap x={380} y={1250} tapFrame={300} />
          )}
        </div>
      </PhoneFrame>

      <LowerThird
        step="04"
        title="Lengkapi Formulir Delegasi Resmi"
        subtitle="Isi data peserta utusan dan ketuk 'Konfirmasi Hadir & Buat Kartu Absensi'"
      />
    </div>
  );
};
