// API Serverless Handler untuk Pratinjau Open Graph (WhatsApp, FB, Telegram, Twitter) & Redirect ke SPA
// Mendukung routing berbasis slug SEO-friendly: https://rminudemak.org/berita/{slug}

let cachedArticles = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 menit

// Fallback artikel bawaan jika koneksi API sedang lambat atau offline
const fallbackArticles = [
  {
    id: "BRT-2026-016",
    slug: "rmi-pwnu-jateng-dan-pcnu-demak-gelar-sambang-pesantren",
    judul: "RMI PWNU Jateng dan PCNU Demak Gelar Sambang Pesantren: Sinergi Kebangsaan, Tata Kelola Hukum, dan Transformasi Digital Pesantren",
    ringkasan: "RMI PWNU Jateng dan PCNU Demak bersinergi perkuat ekosistem, sinergi digital, dan mitigasi dinamika pesantren.",
    cover_image_url: "https://lh3.googleusercontent.com/d/1op1Mz5qR68xBHgtr6lg6b7dp_GqZkd8k"
  },
  {
    id: "BRT-2026-001",
    slug: "jaga-marwah-pesantren-rminu-demak-perkuat-peran-bu-nyai",
    judul: "Jaga Marwah Pesantren, RMINU Demak Perkuat Peran Bu Nyai dalam Perlindungan Santri",
    ringkasan: "RMI NU Demak memperkuat peran Bu Nyai dan pengasuh pondok pesantren putri dalam menciptakan lingkungan asrama yang aman, ramah anak, serta mandiri secara ekonomi.",
    cover_image_url: "https://lh3.googleusercontent.com/d/1mOekcQhUGD2eqHMy-8AmEua9BrJK-06Z"
  },
  {
    id: "BRT-2026-002",
    slug: "dorong-penguatan-peran-bu-nyai-ikhtiar-rmi-demak-wujudkan-pesantren-ramah-anak",
    judul: "Dorong Penguatan Peran Bu Nyai, Ikhtiar RMI Demak Wujudkan Pesantren Ramah Anak",
    ringkasan: "Pelatihan fasilitator pesantren ramah anak membekali para Bu Nyai instrumen pencegahan dan mitigasi kekerasan.",
    cover_image_url: "https://lh3.googleusercontent.com/d/1cXO8QC16Fe2VA147fgjeI49uwIWEpM21"
  },
  {
    id: "BRT-2026-003",
    slug: "kolaborasi-rmi-pcnu-dan-pemkab-demak-dorong-kemandirian-ekonomi-pesantren",
    judul: "Kolaborasi RMI PCNU dan Pemkab Demak Dorong Kemandirian Ekonomi Pesantren",
    ringkasan: "Sinergi pembinaan unit usaha pondok pesantren dan inkubasi bisnis santri se-Kabupaten Demak.",
    cover_image_url: "https://lh3.googleusercontent.com/d/1XHm7dyyRp6lJ-yFgqxZYxq9qETxQ61Lb"
  }
];

async function getArticlesFromBackend() {
  const now = Date.now();
  if (cachedArticles && (now - lastCacheTime < CACHE_TTL)) {
    return cachedArticles;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500); // 3.5 detik batas timeout

    const apiUrl = 'https://script.google.com/macros/s/AKfycbw-0Y0IM-uR326H4bkWAvbQ179Q5NrfgJT8ihOf8lY7C_joVwrT136fPRjRqu8U9jhU/exec?action=GET_BERITA';
    const response = await fetch(apiUrl, { signal: controller.signal, redirect: 'follow' });
    clearTimeout(timeout);

    if (response.ok) {
      const json = await response.json();
      if (json && Array.isArray(json.data) && json.data.length > 0) {
        cachedArticles = json.data;
        lastCacheTime = now;
        return cachedArticles;
      }
    }
  } catch (err) {
    // Abaikan error jaringan/timeout agar fallback tetap melayani
  }

  return cachedArticles || fallbackArticles;
}

export default async function handler(req, res) {
  const { id, slug, t, img, desc } = req.query;
  const lookupKey = slug || id;

  const defaultTitle = "RMI PCNU Kabupaten Demak — Pusat Peradaban Santri Kota Wali";
  const defaultDesc = "Portal Resmi Satu Data & Warta Berita Pondok Pesantren, Madrasah Diniyah, dan TPQ se-Kabupaten Demak.";
  const defaultImg = "https://lh3.googleusercontent.com/d/11T-G4tRAy1jR1_peHE8_pAaOoozDCCq2";

  let article = null;

  if (lookupKey) {
    const articles = await getArticlesFromBackend();
    const cleanKey = String(lookupKey).toLowerCase().trim();
    article = articles.find(a => 
      (a.slug && a.slug.toLowerCase() === cleanKey) || 
      (a.id && a.id.toLowerCase() === cleanKey)
    );

    // Jika tidak ditemukan di online data, periksa fallback hardcoded
    if (!article) {
      article = fallbackArticles.find(a => 
        (a.slug && a.slug.toLowerCase() === cleanKey) || 
        (a.id && a.id.toLowerCase() === cleanKey)
      );
    }
  }

  const title = t || (article && article.judul) || defaultTitle;
  const description = desc || (article && (article.ringkasan || article.isi_lengkap)) || defaultDesc;
  const image = img || (article && article.cover_image_url) || defaultImg;
  const finalSlug = (article && article.slug) ? article.slug : (lookupKey || '');

  // URL kanonikal bersih berbasis slug dan rute SPA tujuan
  const canonicalUrl = finalSlug 
    ? `https://rminudemak.org/berita/${encodeURIComponent(finalSlug)}` 
    : 'https://rminudemak.org/#berita';
  const spaRedirectUrl = finalSlug 
    ? `https://rminudemak.org/#berita/${encodeURIComponent(finalSlug)}` 
    : 'https://rminudemak.org/#berita';

  // Deteksi Web Crawler / Bot Pratinjau Medsos (WhatsApp, Facebook, Twitter, Telegram, dll)
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const isCrawler = /bot|crawl|spider|whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|slackbot|discordbot|linkedinbot|pinterest/i.test(userAgent);

  // Format MIME Type gambar
  const imageType = image.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Open Graph / WhatsApp Preview Dinamis Sesuai Berita & Thumbnail -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="RMI PCNU Kabupaten Demak" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
  <meta property="og:image:type" content="${imageType}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(title)}" />
  <meta property="og:url" content="${canonicalUrl}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />

  <link rel="canonical" href="${canonicalUrl}" />

  ${!isCrawler ? `
  <!-- Pengalihan Otomatis untuk Pengunjung Manusia ke Tampilan Penuh SPA -->
  <meta http-equiv="refresh" content="0;url=${spaRedirectUrl}" />
  <script>
    window.location.replace("${spaRedirectUrl}");
  </script>
  ` : ''}
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px 20px; background: #005c55; color: white; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
  <div style="max-width: 600px; background: rgba(255,255,255,0.08); padding: 30px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
    <h1 style="font-size: 20px; font-weight: 800; line-height: 1.4; margin-bottom: 16px; color: #f59e0b;">${escapeHtml(title)}</h1>
    <p style="font-size: 14px; opacity: 0.9; line-height: 1.6; margin-bottom: 24px;">${escapeHtml(description)}</p>
    <p><a href="${spaRedirectUrl}" style="display: inline-block; background: #c99a2c; color: #003831; padding: 12px 24px; border-radius: 12px; font-weight: bold; text-decoration: none; font-size: 14px;">Buka Berita Lengkap &rarr;</a></p>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400');
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
