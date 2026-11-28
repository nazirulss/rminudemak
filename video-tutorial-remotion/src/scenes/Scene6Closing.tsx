import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig, staticFile, Img } from 'remotion';

export const Scene6Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const badgeSpring = spring({
    frame: frame - 20,
    fps,
    config: { damping: 12 },
  });

  const scanBeamY = interpolate(frame % 45, [0, 45], [0, 180]);

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#002b21] via-[#013f31] to-[#011812] text-white flex flex-col items-center justify-between p-16 overflow-hidden text-center select-none">
      {/* Background Radiance & Glowing Light Orbs */}
      <div className="absolute w-[1200px] h-[1200px] bg-emerald-400/20 rounded-full blur-[180px] pointer-events-none top-1/4" />
      <div className="absolute w-[800px] h-[800px] bg-amber-400/10 rounded-full blur-[140px] pointer-events-none bottom-10" />

      {/* Top Header Badge */}
      <div
        style={{
          transform: `translateY(${(1 - entrance) * -30}px)`,
          opacity: entrance,
        }}
        className="pt-10 z-10 flex flex-col items-center gap-3"
      >
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl border border-amber-300">
          <span>⚡</span> CHECK-IN MEJA TAMU KILAT 1 DETIK
        </div>
        <p className="text-emerald-200 text-sm font-semibold">
          Tunjukkan Kartu E-Pass dari galeri ponsel panjenengan saat tiba di lokasi
        </p>
      </div>

      {/* Centerpiece: Glowing Scanner Card */}
      <div
        style={{
          transform: `scale(${badgeSpring})`,
          opacity: badgeSpring,
        }}
        className="relative z-10 w-[720px] bg-[#01261f]/90 rounded-[44px] border-4 border-emerald-400/70 p-10 flex flex-col items-center justify-center space-y-6 shadow-[0_30px_90px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
      >
        {/* Scanner Laser Simulation */}
        <div className="relative w-48 h-48 rounded-3xl bg-black/50 border-2 border-emerald-400/50 p-4 flex items-center justify-center overflow-hidden shadow-inner">
          <div
            style={{ transform: `translateY(${scanBeamY}px)` }}
            className="absolute left-2 right-2 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#34d399]"
          />
          <div className="w-24 h-24 rounded-full bg-emerald-500 text-white flex items-center justify-center text-5xl font-black shadow-2xl border-4 border-white">
            ✓
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-4xl font-black text-white tracking-tight leading-tight">
            Sampai Jumpa di Lokasi Acara
          </h2>
          <div className="text-2xl text-amber-300 font-black tracking-wide">
            Pondok Pesantren Futuhiyyah
          </div>
          <p className="text-base text-emerald-200/90 font-medium">
            Area SMK Futuhiyyah, Jl. Suburan Timur No. 174, Mranggen, Demak
          </p>
        </div>

        {/* Date & Time Pill */}
        <div className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-black text-xl shadow-lg border border-emerald-300/40 flex items-center justify-center gap-2">
          <span>🗓️</span> Ahad, 22 November 2026 • 12.30 WIB
        </div>
      </div>

      {/* Footer Branding & NU Logo */}
      <div
        style={{
          transform: `translateY(${(1 - entrance) * 30}px)`,
          opacity: entrance,
        }}
        className="pb-10 z-10 flex flex-col items-center space-y-3"
      >
        <div className="w-20 h-20 rounded-full bg-white p-2.5 shadow-2xl border-2 border-emerald-400 flex items-center justify-center">
          <Img src={staticFile('img/logo_rmi.png')} className="w-full h-full object-contain" />
        </div>
        <div className="text-xs font-black tracking-[0.25em] text-emerald-300 uppercase">
          PENGURUS CABANG RMI NU KABUPATEN DEMAK
        </div>
        <p className="text-emerald-100/80 font-serif italic text-lg">
          "RMI Hadir untuk Pesantren dan Madin"
        </p>
      </div>
    </div>
  );
};
