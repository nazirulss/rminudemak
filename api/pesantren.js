// Serverless SSR & Open Graph Handler untuk Profil Pondok Pesantren: https://rminudemak.org/pesantren/{slug}

import { GAS_API_URL, isSearchCrawler, escapeHtml, generatePesantrenSlug } from './_utils.js';

let cachedPesantren = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 menit

async function getPesantrenList() {
  const now = Date.now();
  if (cachedPesantren && (now - lastCacheTime < CACHE_TTL)) {
    return cachedPesantren;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9200);
    const response = await fetch(`${GAS_API_URL}?action=GET_ALL_PESANTREN`, {
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(timeout);

    if (response.ok) {
      const json = await response.json();
      if (json && Array.isArray(json.data) && json.data.length > 0) {
        cachedPesantren = json.data.filter((p) => {
          if (!p) return false;
          const pub = String(p.status_publikasi || p.visibilitas || 'public').toLowerCase().trim();
          return pub !== 'private' && pub !== 'draft';
        });
        lastCacheTime = now;
        return cachedPesantren;
      }
    }
  } catch (err) {
    // Gunakan cache lama bila API timeout
  }

  return cachedPesantren || [];
}

function findBySlugOrId(list, rawKey) {
  if (!rawKey || !Array.isArray(list)) return null;
  const target = decodeURIComponent(String(rawKey)).trim().toLowerCase();
  const cleanTarget = target.replace(/[^a-z0-9]/g, '');

  return (
    list.find(
      (p) =>
        String(p.id || '').toLowerCase() === target ||
        String(p.kode_pesantren || '').toLowerCase() === target ||
        generatePesantrenSlug(p) === target
    ) ||
    list.find(
      (p) => generatePesantrenSlug(p).replace(/[^a-z0-9]/g, '') === cleanTarget
    ) ||
    null
  );
}

export default async function handler(req, res) {
  const { slug, id } = req.query || {};
  const lookupKey = slug || id || '';
  const isCrawler = isSearchCrawler(req.headers && req.headers['user-agent']);

  const list = await getPesantrenList();
  const item = findBySlugOrId(list, lookupKey);

  const fallbackImg = 'https://rminudemak.org/assets/img/og_beranda_overview.jpg';
  const nama = (item && (item.nama || item.nama_resmi)) || 'Direktori Pondok Pesantren Kabupaten Demak';
  const namaPopuler = (item && item.nama_populer) || '';
  const kecamatan = (item && item.kecamatan) || 'Demak';
  const desa = (item && item.desa) || '';
  const alamat = (item && (item.alamat_detail || item.alamat)) || '';
  const pengasuh = (item && (item.pengasuh_utama || item.pengasuh_atau_kepala)) || '';
  const kode = (item && item.kode_pesantren) || '';
  const nspp = (item && item.nspp) || '';
  const tahun = (item && item.tahun_berdiri) || '';
  const kategori = (item && (item.klasifikasi || item.kategori_atau_metode || item.jenis)) || 'Pondok Pesantren';
  const santriMukim = Number((item && item.santri_mukim) || 0);
  const santriNonMukim = Number((item && item.santri_nonmukim) || 0);

  let rawImage = (item && (item.foto_url || item.logo_url)) || fallbackImg;
  if (!String(rawImage).startsWith('http')) {
    rawImage = fallbackImg;
  }

  const finalSlug = item ? generatePesantrenSlug(item) : String(lookupKey).trim();
  const canonicalUrl = finalSlug
    ? `https://rminudemak.org/pesantren/${encodeURIComponent(finalSlug)}`
    : 'https://rminudemak.org/pesantren';
  const spaRedirectUrl = finalSlug
    ? `https://rminudemak.org/pesantren?p=${encodeURIComponent(finalSlug)}`
    : 'https://rminudemak.org/pesantren';

  const pageTitle = item
    ? `${nama}${kecamatan ? ` (${kecamatan})` : ''} — Direktori Pesantren RMI PCNU Demak`
    : 'Direktori Pondok Pesantren — RMI PCNU Kabupaten Demak';

  const lokasiStr = [desa, kecamatan ? `Kec. ${kecamatan}` : '', 'Kabupaten Demak, Jawa Tengah']
    .filter(Boolean)
    .join(', ');

  const pageDesc = item
    ? `Profil resmi ${nama}${namaPopuler ? ` (${namaPopuler})` : ''}${pengasuh ? `, diasuh oleh ${pengasuh}` : ''}. Alamat: ${lokasiStr}. Terdaftar di Satu Data PC RMI NU Kabupaten Demak.`
    : 'Pangkalan Satu Data Pondok Pesantren, Madrasah Diniyah, dan TPQ resmi PC RMI NU Kabupaten Demak.';

  const orgJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: nama,
    ...(namaPopuler ? { alternateName: namaPopuler } : {}),
    url: canonicalUrl,
    image: rawImage,
    description: pageDesc,
    address: {
      '@type': 'PostalAddress',
      streetAddress: alamat || desa || kecamatan,
      addressLocality: kecamatan || 'Demak',
      addressRegion: 'Jawa Tengah',
      addressCountry: 'ID'
    },
    ...(item && item.latitude && item.longitude
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: Number(item.latitude),
            longitude: Number(item.longitude)
          }
        }
      : {})
  }).replace(/</g, '\\u003c');

  const kitabItems = Array.isArray(item && item.kurikulum_kitab) ? item.kurikulum_kitab : [];
  const jenjangItems = Array.isArray(item && item.jenjang_pendidikan) ? item.jenjang_pendidikan : [];

  const crawlerBodyHtml = `
  <main style="max-width: 780px; margin: 0 auto; padding: 32px 20px; font-family: system-ui, -apple-system, sans-serif; color: #0f172a; background: #ffffff; line-height: 1.7;">
    <article>
      <header style="margin-bottom: 20px;">
        <p style="font-size: 13px; color: #005c55; font-weight: 700; text-transform: uppercase; margin: 0 0 8px;">Direktori Resmi PC RMI NU Kabupaten Demak</p>
        <h1 style="font-size: 28px; line-height: 1.3; margin: 0 0 8px; color: #022c22;">${escapeHtml(nama)}</h1>
        ${namaPopuler ? `<p style="font-size: 15px; color: #475569; margin: 0 0 8px;">Dikenal sebagai: ${escapeHtml(namaPopuler)}</p>` : ''}
        <p style="font-size: 14px; color: #475569; margin: 0;">${escapeHtml(lokasiStr)}</p>
      </header>
      <figure style="margin: 0 0 24px;">
        <img src="${escapeHtml(rawImage)}" alt="${escapeHtml(nama)}" style="width: 100%; max-height: 420px; object-fit: cover; border-radius: 12px;" />
      </figure>
      <section style="margin-bottom: 20px;">
        <h2 style="font-size: 18px; color: #022c22; margin: 0 0 10px;">Identitas Lembaga</h2>
        <ul style="padding-left: 20px; margin: 0;">
          ${kode ? `<li><strong>Kode Resmi RMI:</strong> ${escapeHtml(kode)}</li>` : ''}
          ${nspp ? `<li><strong>NSPP:</strong> ${escapeHtml(nspp)}</li>` : ''}
          ${tahun ? `<li><strong>Tahun Berdiri:</strong> ${escapeHtml(String(tahun))}</li>` : ''}
          <li><strong>Tipologi / Klasifikasi:</strong> ${escapeHtml(kategori)}</li>
          ${pengasuh ? `<li><strong>Pengasuh / Pimpinan:</strong> ${escapeHtml(pengasuh)}</li>` : ''}
          ${alamat ? `<li><strong>Alamat Lengkap:</strong> ${escapeHtml(alamat)}, ${escapeHtml(lokasiStr)}</li>` : ''}
          ${santriMukim + santriNonMukim > 0 ? `<li><strong>Total Santri:</strong> ${santriMukim + santriNonMukim} (${santriMukim} mukim, ${santriNonMukim} non-mukim)</li>` : ''}
        </ul>
      </section>
      ${jenjangItems.length > 0 ? `<section style="margin-bottom: 20px;"><h2 style="font-size: 18px; color: #022c22; margin: 0 0 8px;">Jenjang Pendidikan</h2><p style="margin: 0;">${escapeHtml(jenjangItems.join(', '))}</p></section>` : ''}
      ${kitabItems.length > 0 ? `<section style="margin-bottom: 20px;"><h2 style="font-size: 18px; color: #022c22; margin: 0 0 8px;">Kurikulum Kitab Kuning</h2><ul style="padding-left: 20px; margin: 0;">${kitabItems.slice(0, 20).map((k) => `<li>${escapeHtml(k.nama_kitab)}${k.pengarang ? ` (${escapeHtml(k.pengarang)})` : ''}</li>`).join('')}</ul></section>` : ''}
      <p style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
        <a href="${spaRedirectUrl}" style="color: #005c55; font-weight: 700; text-decoration: none;">Lihat profil lengkap, peta lokasi &amp; informasi pendaftaran di Portal RMI PCNU Demak &rarr;</a>
      </p>
    </article>
  </main>`;

  const humanBodyHtml = `
  <div style="max-width: 540px; background: rgba(255,255,255,0.08); padding: 32px 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
    <div style="width: 44px; height: 44px; border: 4px solid rgba(255,255,255,0.25); border-top-color: #f59e0b; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 18px;"></div>
    <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    <h2 style="font-size: 17px; font-weight: 800; line-height: 1.4; margin-bottom: 10px; color: #f59e0b;">Membuka Profil Pesantren...</h2>
    <p style="font-size: 13px; opacity: 0.9; line-height: 1.5; margin-bottom: 20px;">${escapeHtml(nama)}</p>
    <p><a href="${spaRedirectUrl}" style="display: inline-block; background: #c99a2c; color: #003831; padding: 10px 20px; border-radius: 10px; font-weight: bold; text-decoration: none; font-size: 13px;">Klik di sini jika tidak beralih otomatis &rarr;</a></p>
  </div>
  <script>
    setTimeout(function() { window.location.replace("${spaRedirectUrl}"); }, 50);
  </script>`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="${item ? 'index, follow' : 'noindex, follow'}" />
  <meta name="description" content="${escapeHtml(pageDesc)}" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="RMI PCNU Kabupaten Demak" />
  <meta property="og:title" content="${escapeHtml(pageTitle)}" />
  <meta property="og:description" content="${escapeHtml(pageDesc)}" />
  <meta property="og:image" content="${escapeHtml(rawImage)}" />
  <meta property="og:url" content="${canonicalUrl}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(pageDesc)}" />
  <meta name="twitter:image" content="${escapeHtml(rawImage)}" />

  <link rel="canonical" href="${canonicalUrl}" />
  <script type="application/ld+json">${orgJsonLd}</script>
  ${!isCrawler ? `
  <meta http-equiv="refresh" content="0;url=${spaRedirectUrl}" />
  <script>window.location.replace("${spaRedirectUrl}");</script>
  ` : ''}
</head>
<body${!isCrawler ? ` onload="window.location.replace('${spaRedirectUrl}')" style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px 20px; background: #005c55; color: white; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;"` : ' style="margin: 0; background: #ffffff;"'}>
  ${isCrawler ? crawlerBodyHtml : humanBodyHtml}
</body>
</html>`;

  const isNotFound = Boolean(lookupKey && !item);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Vary', 'User-Agent');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(isNotFound ? 404 : 200).send(html);
}
