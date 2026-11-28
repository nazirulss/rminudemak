const https = require('https');
const fs = require('fs');
const path = require('path');

const voScripts = [
  {
    filename: 'vo_scene1.mp3',
    text: 'Assalamu alaikum warahmatullahi wabarakatuh. Saat menerima pesan resmi undangan dari PC RMI NU Demak, silakan klik tautan undangan digital yang tertera.'
  },
  {
    filename: 'vo_scene2.mp3',
    text: 'Tautan akan membuka sampul undangan resmi yang telah dipersonalisasi. Sentuh tombol Buka Warta dan Undangan untuk membuka lembar informasi acara.'
  },
  {
    filename: 'vo_scene3.mp3',
    text: 'Sistem auto scroll akan memandu panjenengan meninjau rincian acara. Tersedia lima halaqah tematik yang dapat dipilih sesuai mandat delegasi pesantren panjenengan.'
  },
  {
    filename: 'vo_scene4.mp3',
    text: 'Selanjutnya, lengkapi formulir delegasi resmi: nama pesantren, nama utusan panjenengan, nomor WhatsApp, serta jabatan di pondok. Lalu ketuk Konfirmasi Hadir dan Buat Kartu Absensi.'
  },
  {
    filename: 'vo_scene5.mp3',
    text: 'Alhamdulillah, Kartu Tanda Hadir resmi dengan Kode QR telah terbit. Pastikan panjenengan mengetuk tombol Simpan Gambar Kartu agar tersimpan aman di galeri ponsel.'
  },
  {
    filename: 'vo_scene6.mp3',
    text: 'Pada hari pelaksanaan, tunjukkan gambar Kartu Hadir ini kepada petugas meja tamu di Pondok Pesantren Futuhiyyah Mranggen untuk presensi kilat satu detik. Sampai jumpa.'
  }
];

function downloadTTS(text, destPath) {
  return new Promise((resolve, reject) => {
    // Pecah kalimat jika panjang (Google Translate TTS limit ~200 chars per request)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];

    let idx = 0;
    function nextChunk() {
      if (idx >= sentences.length) {
        fs.writeFileSync(destPath, Buffer.concat(chunks));
        resolve();
        return;
      }

      const segment = sentences[idx].trim();
      idx++;
      if (!segment) {
        nextChunk();
        return;
      }

      const encoded = encodeURIComponent(segment);
      const url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=id&client=tw-ob&q=' + encoded;

      https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        const segData = [];
        res.on('data', d => segData.push(d));
        res.on('end', () => {
          chunks.push(Buffer.concat(segData));
          setTimeout(nextChunk, 300); // jeda sopan antar request
        });
      }).on('error', reject);
    }

    nextChunk();
  });
}

async function main() {
  const targetDir = path.join(__dirname, 'public', 'audio');
  for (const item of voScripts) {
    const dest = path.join(targetDir, item.filename);
    console.log('Generating:', item.filename, '...');
    await downloadTTS(item.text, dest);
    console.log('Saved:', item.filename, 'Size:', fs.statSync(dest).size, 'bytes');
  }
  console.log('All voice over audio generated successfully!');
}

main().catch(err => {
  console.error('Error generating VO:', err);
  process.exit(1);
});
