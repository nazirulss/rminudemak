# Video Tutorial Remotion — Undangan Digital Sambang Pesantren 2026

Proyek animasi video tutorial vertikal (9:16 Full HD) dibuat menggunakan [Remotion](https://www.remotion.dev/) untuk memandu delegasi pondok pesantren se-Kabupaten Demak dalam melakukan konfirmasi kehadiran & pencetakan kartu tanda hadir resmi ber-QR Code.

---

## 🚀 Cara Menjalankan di Terminal Antigravity / Komputer:

### 1. Masuk ke Folder Proyek & Instal Dependensi:
```bash
cd video-tutorial-remotion
npm install
```

### 2. Jalankan Live Preview Player (Bisa diedit sambil melihat hasil langsung):
```bash
npm start
```
Buka browser di `http://localhost:3000` untuk melihat animasi, timeline frame, dan suara.

### 3. Render Menjadi File Video MP4:
```bash
npm run build
```
Hasil file video `.mp4` Full HD (`1080 x 1920 px`) akan tersimpan di dalam folder `out/tutorial_undangan_rmi.mp4`.

---

## 📂 Struktur Proyek:
* `src/constants.ts`: Pengaturan durasi frame, rasio layar, dan data teks acara.
* `src/components/PhoneFrame.tsx`: Mockup bingkai smartphone modern.
* `src/components/CursorTap.tsx`: Animasi jari/kursor saat mengetuk tombol.
* `src/components/LowerThird.tsx`: Banner teks langkah-langkah di bawah layar.
* `src/scenes/`: 6 modul scene berurutan (Scene 1 s/d 6).
