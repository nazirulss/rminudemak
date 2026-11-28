// Serverless SSR Directory & Kecamatan Hub:
// - /direktori-pesantren
// - /direktori-madin
// - /direktori-tpq
// - /kecamatan/{slug}

import { GAS_API_URL, DEMAK_KECAMATAN, escapeHtml, generatePesantrenSlug } from './_utils.js';

let cachedPesantren = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getPublicPesantren() {
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
    // Fallback ke cache lama jika API timeout
  }

  return cachedPesantren || [];
}

function getJenisConfig(jenis) {
  const configs = {
    pesantren: {
      path: '/direktori-pesantren',
      title: 'Direktori Pondok Pesantren Kabupaten Demak — PC RMI NU Demak',
      h1: 'Direktori Pondok Pesantren Kabupaten Demak',
      desc: 'Daftar resmi pondok pesantren terdata di PC RMI NU Kabupaten Demak lengkap dengan alamat kecamatan, pengasuh, dan tautan profil.',
      intro: 'Pangkalan Satu Data Pondok Pesantren di 14 kecamatan se-Kabupaten Demak yang terintegrasi dengan standar Digdaya Pesantren PBNU.'
    },
    madin: {
      path: '/direktori-madin',
      title: 'Direktori Madrasah Diniyah (Madin) Kabupaten Demak — RMI NU Demak',
      h1: 'Direktori Madrasah Diniyah (Madin) Kabupaten Demak',
      desc: 'Informasi dan daftar lembaga pendidikan Madrasah Diniyah Takmiliyah serta pesantren penyelenggara diniyah di Kabupaten Demak.',
      intro: 'Lembaga pendidikan keagamaan non-formal Madrasah Diniyah (Ula, Wustha, Ulya) di bawah koordinasi dan pendampingan PC RMI NU Kabupaten Demak.'
    },
    tpq: {
      path: '/direktori-tpq',
      title: 'Direktori TPQ & Lembaga Al-Qur\'an Kabupaten Demak — RMI NU Demak',
      h1: 'Direktori TPQ & Pendidikan Al-Qur\'an Kabupaten Demak',
      desc: 'Direktori Taman Pendidikan Al-Qur\'an (TPQ) dan pesantren tahfidz Al-Qur\'an di wilayah Kabupaten Demak.',
      intro: 'Jaringan Taman Pendidikan Al-Qur\'an (TPQ) dan lembaga tahfidzul Qur\'an binaan PC RMI NU Kabupaten Demak.'
    }
  };
  return configs[jenis] || null;
}

export default async function handler(req, res) {
  const { jenis, kecamatan } = req.query || {};
  const list = await getPublicPesantren();

  let pageTitle = '';
  let pageDesc = '';
  let h1Text = '';
  let introText = '';
  let canonicalUrl = 'https://rminudemak.org/direktori-pesantren';
  let filtered = [];
  let isNotFound = false;
  let breadcrumbItems = [
    { name: 'Beranda', item: 'https://rminudemak.org/' }
  ];

  if (kecamatan) {
    const cleanKecSlug = decodeURIComponent(String(kecamatan)).trim().toLowerCase();
    const matchedKec = DEMAK_KECAMATAN.find((k) => k.toLowerCase() === cleanKecSlug);

    if (!matchedKec) {
      isNotFound = true;
      pageTitle = 'Kecamatan Tidak Ditemukan — RMI NU Demak';
      pageDesc = 'Halaman direktori kecamatan tidak ditemukan di portal PC RMI NU Kabupaten Demak.';
      h1Text = 'Kecamatan Tidak Ditemukan';
      introText = 'Silakan pilih salah satu dari 14 kecamatan resmi di Kabupaten Demak di bawah ini.';
      canonicalUrl = `https://rminudemak.org/kecamatan/${encodeURIComponent(cleanKecSlug)}`;
    } else {
      filtered = list.filter((p) => String(p.kecamatan || '').trim().toLowerCase() === matchedKec.toLowerCase());
      pageTitle = `Pondok Pesantren di Kecamatan ${matchedKec}, Demak — RMI NU Demak`;
      pageDesc = `Daftar ${filtered.length} pondok pesantren terdata di Kecamatan ${matchedKec}, Kabupaten Demak lengkap dengan alamat desa, pengasuh, dan profil resmi.`;
      h1Text = `Pondok Pesantren di Kecamatan ${matchedKec}, Demak`;
      introText = `Tercatat ${filtered.length} lembaga pondok pesantren di Kecamatan ${matchedKec}, Kabupaten Demak dalam pangkalan Satu Data PC RMI NU Kabupaten Demak.`;
      canonicalUrl = `https://rminudemak.org/kecamatan/${encodeURIComponent(matchedKec.toLowerCase())}`;
      breadcrumbItems.push(
        { name: 'Direktori Pesantren', item: 'https://rminudemak.org/direktori-pesantren' },
        { name: `Kecamatan ${matchedKec}`, item: canonicalUrl }
      );
    }
  } else {
    const cfg = getJenisConfig(String(jenis || 'pesantren').toLowerCase());
    if (!cfg) {
      isNotFound = true;
      pageTitle = 'Halaman Direktori Tidak Ditemukan — RMI NU Demak';
      pageDesc = 'Halaman direktori tidak ditemukan.';
      h1Text = 'Halaman Tidak Ditemukan';
      introText = '';
    } else {
      pageTitle = cfg.title;
      pageDesc = cfg.desc;
      h1Text = cfg.h1;
      introText = cfg.intro;
      canonicalUrl = `https://rminudemak.org${cfg.path}`;
      breadcrumbItems.push({ name: cfg.h1, item: canonicalUrl });

      if (jenis === 'madin') {
        filtered = list.filter((p) => {
          const hay = `${p.nama_resmi || ''} ${p.kategori_atau_metode || ''} ${(p.jenjang_pendidikan || []).join(' ')}`.toLowerCase();
          return hay.includes('madin') || hay.includes('diniyah') || hay.includes('salaf');
        });
      } else if (jenis === 'tpq') {
        filtered = list.filter((p) => {
          const hay = `${p.nama_resmi || ''} ${p.kategori_atau_metode || ''} ${(p.jenjang_pendidikan || []).join(' ')}`.toLowerCase();
          return hay.includes('tpq') || hay.includes('tpa') || hay.includes('qur') || hay.includes('tahfid');
        });
      } else {
        filtered = list;
      }
    }
  }

  const totalSantri = filtered.reduce((acc, p) => acc + Number(p.santri_mukim || 0) + Number(p.santri_nonmukim || 0), 0);

  const schemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems.map((b, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: b.name,
          item: b.item
        }))
      },
      ...(filtered.length > 0
        ? [
            {
              '@type': 'ItemList',
              name: h1Text,
              numberOfItems: filtered.length,
              itemListElement: filtered.slice(0, 50).map((p, idx) => ({
                '@type': 'ListItem',
                position: idx + 1,
                name: p.nama || p.nama_resmi,
                url: `https://rminudemak.org/pesantren/${encodeURIComponent(generatePesantrenSlug(p))}`
              }))
            }
          ]
        : [])
    ]
  };
  const jsonLd = JSON.stringify(schemaGraph).replace(/</g, '\\u003c');

  const cardsHtml = filtered
    .map((p) => {
      const nama = p.nama || p.nama_resmi || 'Pondok Pesantren';
      const slug = generatePesantrenSlug(p);
      const kec = p.kecamatan || 'Demak';
      const desa = p.desa || '';
      const pengasuh = p.pengasuh_utama || p.pengasuh_atau_kepala || '';
      const santri = Number(p.santri_mukim || 0) + Number(p.santri_nonmukim || 0);
      return `
        <article style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <p style="font-size: 11px; font-weight: 700; color: #005c55; text-transform: uppercase; margin: 0 0 6px;">Kec. ${escapeHtml(kec)}${desa ? ` &bull; ${escapeHtml(desa)}` : ''}</p>
            <h2 style="font-size: 17px; line-height: 1.35; margin: 0 0 8px; color: #0f172a;">
              <a href="/pesantren/${encodeURIComponent(slug)}" style="color: #0f172a; text-decoration: none;">${escapeHtml(nama)}</a>
            </h2>
            ${pengasuh ? `<p style="font-size: 13px; color: #475569; margin: 0 0 6px;">Pengasuh: ${escapeHtml(pengasuh)}</p>` : ''}
            ${santri > 0 ? `<p style="font-size: 12px; color: #64748b; margin: 0;">Jumlah Santri: ${santri.toLocaleString('id-ID')}</p>` : ''}
          </div>
          <p style="margin: 14px 0 0;">
            <a href="/pesantren/${encodeURIComponent(slug)}" style="font-size: 13px; font-weight: 700; color: #005c55; text-decoration: none;">Lihat Profil Lengkap &rarr;</a>
          </p>
        </article>`;
    })
    .join('\n');

  const kecNavHtml = DEMAK_KECAMATAN.map((k) => {
    const kSlug = k.toLowerCase();
    const isActive = kecamatan && String(kecamatan).toLowerCase() === kSlug;
    return `<a href="/kecamatan/${encodeURIComponent(kSlug)}" style="display: inline-block; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; text-decoration: none; ${isActive ? 'background: #005c55; color: #ffffff;' : 'background: #e2e8f0; color: #0f172a;'}">Kec. ${escapeHtml(k)}</a>`;
  }).join(' ');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="${isNotFound ? 'noindex, follow' : 'index, follow'}" />
  <meta name="description" content="${escapeHtml(pageDesc)}" />
  <link rel="icon" type="image/png" sizes="256x256" href="/assets/img/logo_rmi.png" />
  <link rel="canonical" href="${canonicalUrl}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="RMI PCNU Kabupaten Demak" />
  <meta property="og:title" content="${escapeHtml(pageTitle)}" />
  <meta property="og:description" content="${escapeHtml(pageDesc)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="https://rminudemak.org/assets/img/og_beranda_overview.jpg" />
  <script type="application/ld+json">${jsonLd}</script>
</head>
<body style="margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; line-height: 1.6;">
  <header style="background: #022c22; color: #ffffff; padding: 28px 20px;">
    <div style="max-width: 1080px; margin: 0 auto;">
      <nav aria-label="Breadcrumb" style="font-size: 13px; margin-bottom: 12px; color: #a7f3d0;">
        <a href="/" style="color: #a7f3d0; text-decoration: none;">Beranda</a>
        ${kecamatan ? ` &rsaquo; <a href="/direktori-pesantren" style="color: #a7f3d0; text-decoration: none;">Direktori Pesantren</a>` : ''}
        &rsaquo; <span>${escapeHtml(h1Text)}</span>
      </nav>
      <h1 style="font-size: 28px; line-height: 1.25; margin: 0 0 10px;">${escapeHtml(h1Text)}</h1>
      <p style="font-size: 15px; color: #d1fae5; max-width: 760px; margin: 0 0 16px;">${escapeHtml(introText)}</p>
      <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
        <a href="/#direktori" style="display: inline-block; background: #f59e0b; color: #022c22; font-weight: 800; font-size: 13px; padding: 10px 18px; border-radius: 10px; text-decoration: none;">Buka Peta GIS &amp; Filter Interaktif &rarr;</a>
        ${!isNotFound ? `<span style="font-size: 13px; color: #a7f3d0;">${filtered.length} Lembaga${totalSantri > 0 ? ` &bull; ${totalSantri.toLocaleString('id-ID')} Santri` : ''}</span>` : ''}
      </div>
    </div>
  </header>

  <main style="max-width: 1080px; margin: 0 auto; padding: 28px 20px;">
    <section aria-label="Navigasi Kategori & Kecamatan" style="margin-bottom: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px;">
      <p style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #005c55; margin: 0 0 10px;">Direktori Utama &amp; 14 Kecamatan Demak</p>
      <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
        <a href="/direktori-pesantren" style="display: inline-block; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; text-decoration: none; background: #022c22; color: #ffffff;">Semua Pesantren</a>
        <a href="/direktori-madin" style="display: inline-block; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; text-decoration: none; background: #022c22; color: #ffffff;">Direktori Madin</a>
        <a href="/direktori-tpq" style="display: inline-block; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; text-decoration: none; background: #022c22; color: #ffffff;">Direktori TPQ</a>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        ${kecNavHtml}
      </div>
    </section>

    <section style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;">
      ${cardsHtml || '<p style="color: #475569;">Belum ada data lembaga untuk kategori ini.</p>'}
    </section>
  </main>

  <footer style="border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 13px; color: #475569;">
    &copy; 2026 PC RMI NU Kabupaten Demak &bull; <a href="/" style="color: #005c55; font-weight: 600;">rminudemak.org</a>
  </footer>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  res.status(isNotFound ? 404 : 200).send(html);
}
