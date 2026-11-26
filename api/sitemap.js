// Serverless Sitemap Generator untuk Google Search Console (https://rminudemak.org/sitemap.xml)

let cachedUrls = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 menit

const fallbackSlugs = [
  {
    slug: 'rmi-pcnu-demak-genjot-digitalisasi-pesantren-dari-sistem-scan-barcode-hingga-direktori-online-di-rminudemak-org',
    lastmod: '2026-11-16'
  },
  {
    slug: 'rmi-pwnu-jateng-dan-pcnu-demak-gelar-sambang-pesantren',
    lastmod: '2026-11-16'
  },
  {
    slug: 'jaga-marwah-pesantren-rminu-demak-perkuat-peran-bu-nyai',
    lastmod: '2026-11-01'
  },
  {
    slug: 'dorong-penguatan-peran-bu-nyai-ikhtiar-rmi-demak-wujudkan-pesantren-ramah-anak',
    lastmod: '2026-11-01'
  },
  {
    slug: 'kolaborasi-rmi-pcnu-dan-pemkab-demak-dorong-kemandirian-ekonomi-pesantren',
    lastmod: '2026-11-01'
  }
];

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatIsoDate(rawDate) {
  if (!rawDate) return null;
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

async function getPublishedBeritaEntries() {
  const now = Date.now();
  if (cachedUrls && (now - lastCacheTime < CACHE_TTL)) {
    return cachedUrls;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const apiUrl = 'https://script.google.com/macros/s/AKfycbw-0Y0IM-uR326H4bkWAvbQ179Q5NrfgJT8ihOf8lY7C_joVwrT136fPRjRqu8U9jhU/exec?action=GET_BERITA';
    const response = await fetch(apiUrl, { signal: controller.signal, redirect: 'follow' });
    clearTimeout(timeout);

    if (response.ok) {
      const json = await response.json();
      if (json && Array.isArray(json.data) && json.data.length > 0) {
        const entries = json.data
          .filter((item) => {
            if (!item || !item.slug) return false;
            const status = String(item.status || 'published').toLowerCase().trim();
            return status === 'published' || status === 'publish' || status === 'aktif';
          })
          .map((item) => ({
            slug: String(item.slug).trim(),
            lastmod: formatIsoDate(item.updated_at || item.published_at)
          }));

        if (entries.length > 0) {
          cachedUrls = entries;
          lastCacheTime = now;
          return cachedUrls;
        }
      }
    }
  } catch (err) {
    // Gunakan cache lama atau fallback jika API Apps Script timeout
  }

  return cachedUrls || fallbackSlugs;
}

export default async function handler(req, res) {
  const baseUrl = 'https://rminudemak.org';
  const beritaEntries = await getPublishedBeritaEntries();

  const urlBlocks = [
    `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`
  ];

  const seenSlugs = new Set();
  for (const entry of beritaEntries) {
    if (!entry.slug || seenSlugs.has(entry.slug)) continue;
    seenSlugs.add(entry.slug);
    const loc = `${baseUrl}/berita/${encodeURIComponent(entry.slug)}`;
    const lastmodTag = entry.lastmod ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '';
    urlBlocks.push(
      `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodTag}\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlBlocks.join('\n')}\n</urlset>\n`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  res.status(200).send(xml);
}
