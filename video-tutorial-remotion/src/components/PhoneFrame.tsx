import React from 'react';

interface PhoneFrameProps {
  children: React.ReactNode;
  showSafariBar?: boolean;
  urlText?: string;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  showSafariBar = false,
  urlText = 'rminudemak.org',
}) => {
  return (
    <div className="relative w-[780px] h-[1620px] bg-[#0c1815] rounded-[58px] p-2.5 shadow-[0_30px_100px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.12)] border-[8px] border-[#1d2d28] overflow-hidden flex flex-col z-20">
      
      {/* 📱 Real iPhone Dynamic Island */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-36 h-6 bg-black rounded-full z-50 flex items-center justify-end px-3 shadow-md pointer-events-none">
        <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-[#222] flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-blue-950/90" />
        </div>
      </div>

      {/* 📶 Real iPhone Top Status Bar */}
      <div className="absolute top-3.5 left-8 right-8 z-40 flex items-center justify-between text-white text-xs font-semibold select-none pointer-events-none drop-shadow-sm">
        <div className="pl-2 tracking-tight font-medium text-[13px]">10:00</div>
        <div className="flex items-center gap-2 pr-2 text-white">
          {/* Signal */}
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-1 h-1.5 bg-white rounded-xs" />
            <span className="w-1 h-2 bg-white rounded-xs" />
            <span className="w-1 h-2.5 bg-white rounded-xs" />
            <span className="w-1 h-3 bg-white rounded-xs" />
          </div>
          {/* 5G / WiFi */}
          <span className="text-[10px] font-bold tracking-tighter">5G</span>
          {/* Battery */}
          <div className="w-5 h-2.5 border border-white/80 rounded-xs p-0.5 flex items-center">
            <div className="w-full h-full bg-emerald-400 rounded-2xs" />
          </div>
        </div>
      </div>

      {/* 📱 Inner Screen Viewport */}
      <div className="relative w-full flex-1 bg-[#011d17] rounded-[48px] overflow-hidden flex flex-col">
        {children}
      </div>

      {/* 🧭 Real iOS Safari Floating Address & Toolbar */}
      {showSafariBar && (
        <div className="absolute bottom-3 left-4 right-4 z-40 bg-black/75 backdrop-blur-xl border border-white/15 rounded-3xl pt-2 pb-2 px-4 shadow-[0_10px_35px_rgba(0,0,0,0.8)] text-white space-y-1.5">
          {/* Floating URL Pill */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-2xl bg-white/10 text-xs text-white/90 font-medium">
            <span className="text-sm font-serif">AA</span>
            <div className="flex items-center gap-1.5 font-sans text-[11px] text-white">
              <span>🔒</span>
              <span className="font-medium tracking-tight">{urlText}</span>
            </div>
            <span className="text-xs">🔄</span>
          </div>

          {/* Safari Bottom Icons */}
          <div className="flex items-center justify-between px-4 text-emerald-400 text-sm pt-0.5 pb-1">
            <span>‹</span>
            <span className="text-slate-500">›</span>
            <span>📤</span>
            <span>📖</span>
            <span>⧉</span>
          </div>
        </div>
      )}

      {/* ⚪ iOS Home Indicator */}
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/50 rounded-full z-50 pointer-events-none" />
    </div>
  );
};
