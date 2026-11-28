import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, staticFile, Img } from 'remotion';
import { LowerThird } from '../components/LowerThird';
import { PhoneFrame } from '../components/PhoneFrame';
import { CursorTap } from '../components/CursorTap';
import { EVENT_DATA } from '../constants';

export const Scene1WhatsApp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const msgEntrance = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14 },
  });

  return (
    <div className="relative w-full h-full bg-[#03130f] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute w-[1000px] h-[1000px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Smartphone Mockup */}
      <PhoneFrame showSafariBar={false}>
        {/* WhatsApp App Header Bar */}
        <div className="bg-[#075e54] text-white px-5 pt-12 pb-3.5 flex items-center justify-between shadow-md z-20">
          <div className="flex items-center gap-3">
            <span className="text-xl">←</span>
            <div className="w-11 h-11 rounded-full bg-white p-0.5 overflow-hidden flex items-center justify-center border-2 border-emerald-300">
              <Img src={staticFile('img/logo_rmi.png')} className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-bold text-base leading-tight">PC RMI NU Kabupaten Demak</div>
              <div className="text-[11px] text-emerald-200">Online • Saluran Resmi</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-lg">
            <span>📞</span>
            <span>⋮</span>
          </div>
        </div>

        {/* Chat Area Background */}
        <div className="flex-1 bg-[#eae6df] p-4 flex flex-col justify-end pb-24 relative overflow-hidden">
          {/* Chat Bubble Message */}
          <div
            style={{
              transform: `scale(${msgEntrance}) translateY(${(1 - msgEntrance) * 40}px)`,
              opacity: msgEntrance,
            }}
            className="bg-white rounded-2xl rounded-tl-xs p-5 shadow-sm max-w-[96%] border border-slate-200/60 space-y-2.5"
          >
            <div className="text-xs font-black text-emerald-900 uppercase tracking-wide border-b border-slate-100 pb-1.5">
              UNDANGAN RESMI SAMBANG PESANTREN PW RMI NU JAWA TENGAH (JILID II 2026)
            </div>
            <div className="text-xs text-slate-700 font-semibold leading-relaxed">
              Tuan Rumah: Pengurus Cabang RMI NU Kabupaten Demak<br />
              Nomor: 003.1/PCRMINUD/U/XI/2026
            </div>
            <div className="text-sm text-slate-900 leading-snug pt-1">
              Kepada Yth. :<br />
              <span className="font-black text-base text-emerald-900">{EVENT_DATA.recipientName}</span><br />
              <span className="text-xs font-semibold text-slate-800">{EVENT_DATA.recipientInst}</span><br />
              <span className="text-[11px] text-slate-500">Kecamatan {EVENT_DATA.recipientKec}, Kabupaten Demak</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Menindaklanjuti Surat Resmi Pengurus Cabang RMI NU Kabupaten Demak, kami memohon kehadiran utusan delegasi resmi panjenengan pada agenda akbar:
            </p>
            <div className="text-xs text-slate-800 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div>🗓 <strong>Hari, Tanggal:</strong> {EVENT_DATA.dateText}</div>
              <div>⏰ <strong>Waktu:</strong> {EVENT_DATA.timeText}</div>
              <div>📍 <strong>Tempat:</strong> {EVENT_DATA.locationText}</div>
              <div className="text-emerald-800 font-bold pt-1">📌 <strong>Mandat:</strong> {EVENT_DATA.targetHalaqah}</div>
            </div>

            {/* Clickable Link Box */}
            <div className="p-3 bg-emerald-50 rounded-xl border-2 border-emerald-400/80 text-xs space-y-1 relative shadow-xs">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                <span>👉</span> <strong>Tautan Undangan & Konfirmasi Kehadiran:</strong>
              </div>
              <div className="text-emerald-700 font-mono text-[11px] underline break-all font-semibold">
                https://rminudemak.org/undangan.html?to=KH.+Ibrahim+Cholilullah%2C+S.Pd.&amp;inst=PPTQ+Asnawiyyah&amp;kec=Mranggen&amp;h=1
              </div>
            </div>

            <div className="text-[10px] text-right text-slate-400 font-medium">10:30 WIB ✓✓</div>
          </div>

          {/* Cursor tapping the link at frame 130 */}
          {frame >= 90 && <CursorTap x={380} y={1300} tapFrame={130} />}
        </div>
      </PhoneFrame>

      <LowerThird
        step="01"
        title="Buka Tautan Undangan Resmi"
        subtitle="Sentuh tautan digital yang tertera di pesan WhatsApp panjenengan"
      />
    </div>
  );
};
