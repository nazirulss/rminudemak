// API Serverless Handler untuk Pratinjau Open Graph (WhatsApp, FB, Telegram, Twitter) & Redirect ke SPA
// Mendukung routing berbasis slug SEO-friendly: https://rminudemak.org/berita/{slug}

let cachedArticles = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 menit

// Fallback artikel bawaan jika koneksi API sedang lambat atau offline
const fallbackArticles = [
  {
    id: "BRT-2026-7521",
    slug: "perkuat-pola-pengasuhan-dan-manajemen-rmi-siap-rilis-3-buku-panduan-pesantren-di-awal-2027",
    judul: "Perkuat Pola Pengasuhan dan Manajemen, RMI Siap Rilis 3 Buku Panduan Pesantren di Awal 2027",
    ringkasan: "RMI siap rilis 3 buku panduan tata kelola dan pola pengasuhan ramah santri.",
    cover_image_url: "https://lh3.googleusercontent.com/d/1DWP7K-L4YPZZBGAdZ7DZROcaeot_lzJU"
  },
  {
    id: "BRT-2026-7879",
    slug: "menyongsong-kebijakan-ditjen-pesantren-rmi-dorong-kemudahan-imb-dan-tata-kelola-pondok-yang-bermarwah",
    judul: "Menyongsong Kebijakan Ditjen Pesantren: RMI Dorong Kemudahan IMB dan Tata Kelola Pondok yang Bermarwah",
    ringkasan: "RMI dorong kemudahan regulasi IMB dan tata kelola pesantren berbadan hukum.",
    cover_image_url: "https://lh3.googleusercontent.com/d/1Ni4-uJmQxdAj8k-LWNLlxcgsBOaHFm9k"
  },
  {
    id: "BRT-2026-0073",
    slug: "rmi-pcnu-demak-genjot-digitalisasi-pesantren-dari-sistem-scan-barcode-hingga-direktori-online-di-rminudemak-org",
    judul: "RMI PCNU Demak Genjot Digitalisasi Pesantren: Dari Sistem Scan Barcode hingga Direktori Online di rminudemak.org",
    ringkasan: "RMI PCNU Demak genjot digitalisasi pesantren lewat sistem scan barcode dan pendataan ulang. Simak rencana peluncuran Direktori Pesantren & Madin di www.rminudemak.org.",
    cover_image_url: "https://lh3.googleusercontent.com/d/1FMmgwwtrDfEWFmysUIMfA_Sp2zHJI8en"
  },
  {
    id: "BRT-2026-016",
    slug: "rmi-pwnu-jateng-dan-pcnu-demak-gelar-sambang-pesantren",
    judul: "RMI PWNU Jateng dan PCNU Demak Gelar Sambang Pesantren: Sinergi Kebangsaan, Tata Kelola Hukum, dan Transformasi Digital Pesantren",
    ringkasan: "RMI PWNU Jateng dan PCNU Demak bersinergi perkuat ekosistem, sinergi digital, dan mitigasi dinamika pesantren.",
    cover_image_url: "https://lh3.googleusercontent.com/d/1hhcOX6cN4G89hP0d0Ap3_YNf4-uN1Xzl"
  },
  {
    id: "BRT-2026-001",
    slug: "jaga-marwah-pesantren-rminu-demak-perkuat-peran-bu-nyai",
    judul: "Jaga Marwah Pesantren, RMINU Demak Perkuat Peran Bu Nyai dalam Perlindungan Santri",
    ringkasan: "RMI NU Demak memperkuat peran Bu Nyai dan pengasuh pondok pesantren putri dalam menciptakan lingkungan asrama yang aman, ramah anak, serta mandiri secara ekonomi.",
    cover_image_url: "https://lh3.googleusercontent.com/d/19HayeLVWKBo-2Nf-1udr_qUop41nIkme"
  },
  {
    id: "BRT-2026-002",
    slug: "dorong-penguatan-peran-bu-nyai-ikhtiar-rmi-demak-wujudkan-pesantren-ramah-anak",
    judul: "Dorong Penguatan Peran Bu Nyai, Ikhtiar RMI Demak Wujudkan Pesantren Ramah Anak",
    ringkasan: "Pelatihan fasilitator pesantren ramah anak membekali para Bu Nyai instrumen pencegahan dan mitigasi kekerasan.",
    cover_image_url: "https://lh3.googleusercontent.com/d/1yhOTSVJJlbhdVVyIBbGwV8mMc0QtSfiU"
  },
  {
    id: "BRT-2026-003",
    slug: "kolaborasi-rmi-pcnu-dan-pemkab-demak-dorong-kemandirian-ekonomi-pesantren",
    judul: "Kolaborasi RMI PCNU dan Pemkab Demak Dorong Kemandirian Ekonomi Pesantren",
    ringkasan: "Sinergi pembinaan unit usaha pondok pesantren dan inkubasi bisnis santri se-Kabupaten Demak.",
    cover_image_url: "https://lh3.googleusercontent.com/d/1hZP8AoIA6xwZRJyA16WmuruJpHGmPF-v"
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
  const { id, slug, t, img, desc, kw } = req.query;
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

  const isNotFound = Boolean(lookupKey && !article);
  const title = t || (article && article.judul) || defaultTitle;
  const description = desc || (article && (article.ringkasan || article.isi_lengkap)) || defaultDesc;
  let rawImage = img || (article && article.cover_image_url) || defaultImg;
  // Pastikan URL gambar adalah HTTP/HTTPS publik, bukan base64 data URI karena WhatsApp scraper mereject base64
  if (!rawImage || String(rawImage).startsWith('data:') || !String(rawImage).startsWith('http')) {
    rawImage = defaultImg;
  }
  const image = rawImage;
  const keywords = kw || (article && article.keywords) || (article ? `${article.kategori || 'Warta'}, RMI PCNU Demak, Pesantren Demak, Santri Kota Wali` : "RMI NU Demak, Pondok Pesantren Demak, Madrasah Diniyah Demak, Santri Kota Wali");
  const penulis = (article && article.penulis) || "Tim Media RMI PCNU Demak";
  const finalSlug = (article && article.slug) ? article.slug : (lookupKey || '');

  // URL kanonikal bersih berbasis slug dan rute SPA tujuan
  const canonicalUrl = finalSlug 
    ? `https://rminudemak.org/berita/${encodeURIComponent(finalSlug)}` 
    : 'https://rminudemak.org/#berita';
  const spaRedirectUrl = finalSlug 
    ? `https://rminudemak.org/#berita/${encodeURIComponent(finalSlug)}` 
    : 'https://rminudemak.org/#berita';

  // Deteksi Web Crawler / Bot Pencari & Pratinjau Medsos (Googlebot, Bingbot, WhatsApp, Facebook, dll)
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const isCrawler = /bot|crawl|spider|slurp|google-inspectiontool|whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|slackbot|discordbot|linkedinbot|pinterest/i.test(userAgent);

  // Format MIME Type gambar
  const imageType = image.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

  // Siapkan naskah bersih untuk Googlebot & JSON-LD NewsArticle
  const rawBodyText = (article && article.isi_lengkap) ? String(article.isi_lengkap) : description;
  const bodyParagraphs = stripHtmlToParagraphs(rawBodyText);
  const publishedIso = formatIsoDateTime(article && article.published_at);
  const modifiedIso = formatIsoDateTime((article && article.updated_at) || (article && article.published_at));

  const newsArticleJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    "headline": title,
    "description": description,
    "image": [image],
    ...(publishedIso ? { "datePublished": publishedIso } : {}),
    ...(modifiedIso ? { "dateModified": modifiedIso } : {}),
    "author": {
      "@type": "Person",
      "name": penulis
    },
    "publisher": {
      "@type": "Organization",
      "name": "RMI PCNU Kabupaten Demak",
      "url": "https://rminudemak.org/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://rminudemak.org/assets/img/logo_rmi.png"
      }
    }
  }).replace(/</g, '\\u003c');

  const crawlerBodyHtml = `
  <main style="max-width: 760px; margin: 0 auto; padding: 32px 20px; font-family: system-ui, -apple-system, sans-serif; color: #0f172a; background: #ffffff; line-height: 1.7;">
    <article>
      <header style="margin-bottom: 24px;">
        <p style="font-size: 13px; color: #005c55; font-weight: 700; text-transform: uppercase; margin: 0 0 8px;">Warta RMI PCNU Kabupaten Demak</p>
        <h1 style="font-size: 28px; line-height: 1.3; margin: 0 0 12px; color: #022c22;">${escapeHtml(title)}</h1>
        <p style="font-size: 14px; color: #475569; margin: 0;">Oleh ${escapeHtml(penulis)}${publishedIso ? ` &bull; ${escapeHtml(publishedIso.split('T')[0])}` : ''}</p>
      </header>
      <figure style="margin: 0 0 24px;">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" style="width: 100%; max-height: 440px; object-fit: cover; border-radius: 12px;" />
      </figure>
      <p style="font-size: 16px; font-weight: 600; color: #1e293b; margin: 0 0 16px;">${escapeHtml(description)}</p>
      ${bodyParagraphs.map(p => `<p style="font-size: 16px; margin: 0 0 14px;">${escapeHtml(p)}</p>`).join('\n      ')}
      <p style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
        <a href="${spaRedirectUrl}" style="color: #005c55; font-weight: 700; text-decoration: none;">Buka tampilan interaktif di Portal RMI PCNU Demak &rarr;</a>
      </p>
    </article>
  </main>`;

  const humanBodyHtml = `
  <div style="max-width: 540px; background: rgba(255,255,255,0.08); padding: 32px 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
    <div style="width: 44px; height: 44px; border: 4px solid rgba(255,255,255,0.25); border-top-color: #f59e0b; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 18px;"></div>
    <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    <h2 style="font-size: 17px; font-weight: 800; line-height: 1.4; margin-bottom: 10px; color: #f59e0b;">Membuka Berita...</h2>
    <p style="font-size: 13px; opacity: 0.9; line-height: 1.5; margin-bottom: 20px;">${escapeHtml(title)}</p>
    <p><a href="${spaRedirectUrl}" style="display: inline-block; background: #c99a2c; color: #003831; padding: 10px 20px; border-radius: 10px; font-weight: bold; text-decoration: none; font-size: 13px;">Klik di sini jika tidak beralih otomatis &rarr;</a></p>
  </div>
  <script>
    // Cadangan pengalihan jika script head belum dieksekusi
    setTimeout(function() {
      window.location.replace("${spaRedirectUrl}");
    }, 50);
  </script>`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="${isNotFound ? 'noindex, follow' : 'index, follow'}" />
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="keywords" content="${escapeHtml(keywords)}" />
  <meta name="author" content="${escapeHtml(penulis)}" />
  
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
  <meta property="article:tag" content="${escapeHtml(keywords)}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />

  <link rel="canonical" href="${canonicalUrl}" />

  <script type="application/ld+json">${newsArticleJsonLd}</script>

  ${!isCrawler ? `
  <!-- Pengalihan Otomatis untuk Pengunjung Manusia ke Tampilan Penuh SPA -->
  <meta http-equiv="refresh" content="0;url=${spaRedirectUrl}" />
  <script>
    // Pengalihan instan ke aplikasi SPA (sebelum body dirender)
    window.location.replace("${spaRedirectUrl}");
  </script>
  ` : ''}
</head>
<body${!isCrawler ? ` onload="window.location.replace('${spaRedirectUrl}')" style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px 20px; background: #005c55; color: white; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;"` : ' style="margin: 0; background: #ffffff;"'}>
  ${isCrawler ? crawlerBodyHtml : humanBodyHtml}
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Pastikan header bervariasi berdasarkan User-Agent dan tidak membuat CDN menyajikan respon bot crawler ke browser biasa
  res.setHeader('Vary', 'User-Agent');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(isNotFound ? 404 : 200).send(html);
}

function stripHtmlToParagraphs(raw) {
  if (!raw) return [];
  const normalized = String(raw)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ');
  return normalized
    .split(/\r?\n+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function formatIsoDateTime(rawDate) {
  if (!rawDate) return null;
  const d = new Date(rawDate);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
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
