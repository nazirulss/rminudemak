import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig, staticFile, Img } from 'remotion';
import { LowerThird } from '../components/LowerThird';
import { PhoneFrame } from '../components/PhoneFrame';
import { CursorTap } from '../components/CursorTap';

export const Scene5Kartu: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // Dramatic focus zoom-in into the card
  const zoomScale = interpolate(frame, [0, 80], [1, 1.04], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Success toast notification popping up after tapping "Simpan Gambar"
  const toastSpring = spring({
    frame: frame - 170,
    fps,
    config: { damping: 12, mass: 0.5 },
  });

  return (
    <div className="relative w-full h-full bg-[#03130f] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute w-[1000px] h-[1000px] bg-amber-500/15 rounded-full blur-[160px] pointer-events-none" />

      <PhoneFrame showSafariBar={true} urlText="rminudemak.org/undangan.html">
        <div
          style={{
            transform: `scale(${entrance * zoomScale})`,
            opacity: entrance,
          }}
          className="relative w-full h-full overflow-hidden bg-[#011d17] flex flex-col origin-center"
        >
          {/* 🌟 100% Identical Real Screen Capture of E-Pass Card (v2 - Karangangung) */}
          <Img
            src={staticFile('screens/screen_epass_v2.png')}
            className="w-full h-full object-cover object-top"
          />

          {/* Toast Notification: Saved to Gallery */}
          {frame >= 170 && (
            <div
              style={{
                transform: `translateX(-50%) translateY(${(1 - toastSpring) * 30}px) scale(${toastSpring})`,
                opacity: toastSpring,
              }}
              className="absolute top-24 left-1/2 z-50 bg-emerald-900/95 border-2 border-emerald-400 text-white px-5 py-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex items-center gap-2.5 backdrop-blur-md"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center font-black text-xs">
                ✓
              </div>
              <div className="text-left">
                <div className="font-black text-xs text-white">Kartu Berhasil Disimpan!</div>
                <div className="text-[10px] text-emerald-200">Tersimpan aman di galeri ponsel panjenengan</div>
              </div>
            </div>
          )}

          {/* Cursor tapping "Simpan Gambar" at frame 150 */}
          {frame >= 100 && frame < 220 && (
            <CursorTap x={250} y={1310} tapFrame={150} />
          )}

          {/* Cursor hovering over "Bagikan Bukti ke WhatsApp" at frame 250 */}
          {frame >= 230 && (
            <CursorTap x={380} y={1370} tapFrame={260} />
          )}
        </div>
      </PhoneFrame>

      <LowerThird
        step="05"
        title="Simpan Gambar Kartu ke Galeri HP"
        subtitle="Ketuk 'Simpan Gambar' agar Kartu Hadir ber-QR Code tersimpan di galeri ponsel"
      />
    </div>
  );
};
