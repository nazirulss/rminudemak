// Serverless Sitemap Generator untuk Google Search Console (https://rminudemak.org/sitemap.xml)

import { GAS_API_URL, escapeXml, generatePesantrenSlug } from './_utils.js';

let cachedBerita = null;
let cachedPesantren = null;
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

function formatIsoDate(rawDate) {
  if (!rawDate) return null;
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

async function fetchActionData(actionName, timeoutMs = 9200) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${GAS_API_URL}?action=${actionName}`, {
      signal: controller.signal,
      redirect: 'follow'
    });
    if (response.ok) {
      const json = await response.json();
      if (json && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } finally {
    clearTimeout(timeout);
  }
  return null;
}

async function getSitemapEntries() {
  const now = Date.now();
  if (cachedBerita && cachedPesantren && (now - lastCacheTime < CACHE_TTL)) {
    return { berita: cachedBerita, pesantren: cachedPesantren };
  }

  const [beritaRes, pesantrenRes] = await Promise.allSettled([
    fetchActionData('GET_BERITA'),
    fetchActionData('GET_ALL_PESANTREN')
  ]);

  if (beritaRes.status === 'fulfilled' && beritaRes.value) {
    const entries = beritaRes.value
      .filter((item) => {
        if (!item || !item.slug) return false;
        const status = String(item.status || 'published').toLowerCase().trim();
        return status === 'published' || status === 'publish' || status === 'aktif';
      })
      .map((item) => ({
        slug: String(item.slug).trim(),
        lastmod: formatIsoDate(item.updated_at || item.published_at)
      }));
    if (entries.length > 0) cachedBerita = entries;
  }

  if (pesantrenRes.status === 'fulfilled' && pesantrenRes.value) {
    const entries = pesantrenRes.value
      .filter((p) => {
        if (!p) return false;
        const pub = String(p.status_publikasi || p.visibilitas || 'public').toLowerCase().trim();
        return pub !== 'private' && pub !== 'draft';
      })
      .map((p) => ({
        slug: generatePesantrenSlug(p),
        lastmod: formatIsoDate(p.updated_at)
      }))
      .filter((e) => Boolean(e.slug));
    if (entries.length > 0) cachedPesantren = entries;
  }

  lastCacheTime = now;
  return {
    berita: cachedBerita || fallbackSlugs,
    pesantren: cachedPesantren || []
  };
}

function appendUrls(urlBlocks, seenLocs, baseUrl, prefix, entries, changefreq, priority) {
  for (const entry of entries) {
    if (!entry.slug) continue;
    const loc = `${baseUrl}${prefix}${encodeURIComponent(entry.slug)}`;
    if (seenLocs.has(loc)) continue;
    seenLocs.add(loc);
    const lastmodTag = entry.lastmod ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '';
    urlBlocks.push(
      `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodTag}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    );
  }
}

export default async function handler(req, res) {
  const baseUrl = 'https://rminudemak.org';
  const { berita, pesantren } = await getSitemapEntries();

  const urlBlocks = [
    `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`
  ];
  const seenLocs = new Set([`${baseUrl}/`]);

  appendUrls(urlBlocks, seenLocs, baseUrl, '/berita/', berita, 'weekly', '0.8');
  appendUrls(urlBlocks, seenLocs, baseUrl, '/pesantren/', pesantren, 'monthly', '0.7');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlBlocks.join('\n')}\n</urlset>\n`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  res.status(200).send(xml);
}
