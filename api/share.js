export default function handler(req, res) {
  const { id, t, img, desc } = req.query;

  const defaultTitle = "RMI PCNU Kabupaten Demak — Pusat Peradaban Santri Kota Wali";
  const defaultDesc = "Portal Resmi Satu Data & Sistem Informasi Geospasial Pondok Pesantren, Madrasah Diniyah, dan TPQ se-Kabupaten Demak.";
  const defaultImg = "https://lh3.googleusercontent.com/d/11T-G4tRAy1jR1_peHE8_pAaOoozDCCq2";

  // Database berita terdaftar
  const articles = {
    "1": {
      title: "Ribuan Santri Demak Gelar Aksi Damai Solidaritas Pesantren Nusantara",
      desc: "Aksi damai ribuan santri se-Kabupaten Demak meneguhkan komitmen kebangsaan dan perdamaian nusantara.",
      img: "https://lh3.googleusercontent.com/d/1mOekcQhUGD2eqHMy-8AmEua9BrJK-06Z"
    },
    "2": {
      title: "PCNU Demak Matangkan Kurikulum Madrasah Diniyah Jelang Ujian",
      desc: "Standardisasi kurikulum madrasah diniyah disosialisasikan secara serentak di 14 kecamatan.",
      img: "https://lh3.googleusercontent.com/d/1cXO8QC16Fe2VA147fgjeI49uwIWEpM21"
    },
    "3": {
      title: "Apel Akbar Hari Santri Nasional Kabupaten Demak",
      desc: "Semarak peringatan Hari Santri Nasional menghadirkan puluhan ribu santri dan masyayikh pondok pesantren.",
      img: "https://lh3.googleusercontent.com/d/1XHm7dyyRp6lJ-yFgqxZYxq9qETxQ61Lb"
    }
  };

  const article = (id && articles[id]) || {};
  const title = t || article.title || defaultTitle;
  const description = desc || article.desc || defaultDesc;
  const image = img || article.img || defaultImg;
  const targetUrl = id ? `https://rminudemak.org/?berita=${encodeURIComponent(id)}#berita` : 'https://rminudemak.org/#berita';

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Open Graph / WhatsApp Preview Dinamis Sesuai Berita -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="RMI PCNU Kabupaten Demak" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${targetUrl}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />

  <!-- Pengalihan Otomatis untuk Pengunjung Manusia -->
  <meta http-equiv="refresh" content="0;url=${targetUrl}" />
  <link rel="canonical" href="${targetUrl}" />
</head>
<body style="font-family: sans-serif; text-align: center; padding: 40px; background: #005c55; color: white;">
  <p style="font-size: 16px; font-weight: bold;">Memuat artikel warta...</p>
  <p><a href="${targetUrl}" style="color: #c99a2c; text-decoration: underline;">Klik di sini jika peramban tidak mengalihkan otomatis</a></p>
  <script>
    window.location.replace("${targetUrl}");
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.status(200).send(html);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
