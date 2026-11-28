export const VIDEO_FPS = 30;
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;

// Rincian Frame per Scene (Total 60 Detik = 1800 Frames)
export const SCENE_DURATIONS = {
  scene1: 210, // 0 - 7.0 detik (Pesan WA)
  scene2: 240, // 7.0 - 15.0 detik (Sampul Amplop Digital)
  scene3: 450, // 15.0 - 30.0 detik (Warta & 5 Halaqah)
  scene4: 420, // 30.0 - 44.0 detik (Formulir Presensi)
  scene5: 300, // 44.0 - 54.0 detik (Kartu Hadir E-Pass & QR)
  scene6: 180, // 54.0 - 60.0 detik (Penutup & Sampai Jumpa di Lokasi)
};

export const TOTAL_DURATION_IN_FRAMES =
  SCENE_DURATIONS.scene1 +
  SCENE_DURATIONS.scene2 +
  SCENE_DURATIONS.scene3 +
  SCENE_DURATIONS.scene4 +
  SCENE_DURATIONS.scene5 +
  SCENE_DURATIONS.scene6;

export const EVENT_DATA = {
  title: "Sambang Pesantren Jilid II (2026)",
  organizer: "Pengurus Cabang RMI NU Kabupaten Demak",
  wilayah: "PW RMI NU Jawa Tengah • Tuan Rumah Demak",
  dateText: "Ahad, 22 November 2026",
  timeText: "Pukul 12.30 WIB — Selesai",
  locationText: "Pondok Pesantren Futuhiyyah Mranggen Demak",
  url: "https://rminudemak.org/undangan.html",
  recipientName: "KH. Ibrahim Cholilullah, S.Pd.",
  recipientInst: "PPTQ Asnawiyyah / PP. Futuhiyyah",
  recipientKec: "Mranggen",
  targetHalaqah: "Halaqah 1: Konsolidasi & Koordinasi RMI PW-PC",
};
