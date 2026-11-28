import fs from 'node:fs';
import path from 'node:path';

const ASSET_VER = '20261128_1000';

const headAssets = fs.readFileSync('src/partials/head-assets.html', 'utf8').replaceAll('{{ASSET_VER}}', ASSET_VER);
const navbar = fs.readFileSync('src/partials/navbar.html', 'utf8');
const footer = fs.readFileSync('src/partials/footer.html', 'utf8');
const modals = fs.readFileSync('src/partials/modals.html', 'utf8');

const PAGES_CONFIG = [
  {
    outFile: 'index.html',
    srcFile: 'src/pages/beranda.html',
    urlPath: '/',
    title: 'RMI NU Demak — Portal Resmi PC RMINU Kabupaten Demak',
    description: 'Menyatukan langkah, mengawal tradisi salaf, dan membangun kemandirian ekosistem Pondok Pesantren se-Kabupaten Demak.',
    ogTitle: 'RMI NU Demak — Portal Resmi PC RMINU Kabupaten Demak',
    ogDescription: 'Portal Resmi Satu Data & Sistem Informasi Geospasial Pondok Pesantren, Madrasah Diniyah, dan TPQ se-Kabupaten Demak.',
    preloadHero: true,
    useLeaflet: true,
    scripts: ['core-utils.js', 'gis-map.js', 'berita.js']
  },
  {
    outFile: 'profil.html',
    srcFile: 'src/pages/profil.html',
    urlPath: '/profil',
    title: 'Profil & Organogram PC RMI NU Kabupaten Demak',
    description: 'Mengenal sejarah, khidmat, susunan pengurus harian, dan struktur organisasi PC RMI NU Kabupaten Demak masa khidmat 2023–2028.',
    ogTitle: 'Profil & Organogram PC RMI NU Kabupaten Demak',
    ogDescription: 'Struktur kepengurusan dan komitmen pengembangan ekosistem pesantren PC RMI NU Kabupaten Demak.',
    preloadHero: false,
    useLeaflet: false,
    scripts: ['core-utils.js', 'profil-organogram.js']
  },
  {
    outFile: 'direktori.html',
    srcFile: 'src/pages/direktori.html',
    urlPath: '/direktori',
    title: 'Direktori & Peta GIS Pondok Pesantren Demak — RMI NU Demak',
    description: 'Pangkalan Satu Data dan Peta Geospasial Pondok Pesantren, Madrasah Diniyah, dan TPQ se-Kabupaten Demak.',
    ogTitle: 'Direktori & Peta GIS Pesantren Kabupaten Demak',
    ogDescription: 'Cari profil pondok pesantren, Madin, dan TPQ di 14 kecamatan Kabupaten Demak secara interaktif.',
    preloadHero: false,
    useLeaflet: true,
    scripts: ['core-utils.js', 'gis-map.js', 'pesantren-direktori.js']
  },
  {
    outFile: 'layanan.html',
    srcFile: 'src/pages/layanan.html',
    urlPath: '/layanan',
    title: 'Pusat Layanan & Program PC RMI NU Kabupaten Demak',
    description: 'Katalog layanan pendampingan pesantren, pendaftaran data mandiri, standar pesantren ramah anak, dan program kerja PC RMI NU Demak.',
    ogTitle: 'Pusat Layanan & Program PC RMI NU Demak',
    ogDescription: 'Layanan resmi pendampingan kelembagaan pesantren, Madin, dan TPQ di Kabupaten Demak.',
    preloadHero: false,
    useLeaflet: false,
    scripts: ['core-utils.js']
  },
  {
    outFile: 'panduan.html',
    srcFile: 'src/pages/panduan.html',
    urlPath: '/panduan',
    title: 'Panduan Portal Data & 7 Peran — PC RMI NU Demak',
    description: 'Petunjuk resmi pendaftaran akun, tata cara login Email OTP tanpa kata sandi, serta matriks hak akses 7 peran pengelola pesantren Demak.',
    ogTitle: 'Panduan Portal Satu Data RMI NU Demak',
    ogDescription: 'Panduan lengkap operator pondok, MWC kecamatan, dan pengurus cabang dalam mengelola data pesantren.',
    preloadHero: false,
    useLeaflet: false,
    scripts: ['core-utils.js', 'panduan-sambang.js']
  },
  {
    outFile: 'sambang.html',
    srcFile: 'src/pages/sambang.html',
    urlPath: '/sambang',
    title: 'Sambang Pesantren PW RMI NU Jateng — PC RMI NU Demak',
    description: 'Agenda resmi Sambang Pesantren PW RMI NU Jawa Tengah bersama PC RMI NU Kabupaten Demak: halaqah, konsolidasi, dan pendaftaran delegasi.',
    ogTitle: 'Agenda Sambang Pesantren — PC RMI NU Demak',
    ogDescription: 'Informasi lengkap agenda Sambang Pesantren, halaqah, dan registrasi kehadiran delegasi pesantren.',
    preloadHero: false,
    useLeaflet: false,
    scripts: ['core-utils.js', 'panduan-sambang.js']
  },
  {
    outFile: 'berita.html',
    srcFile: 'src/pages/berita.html',
    urlPath: '/berita',
    title: 'Warta Pesantren & Berita Resmi — PC RMI NU Kabupaten Demak',
    description: 'Kumpulan berita terbaru, liputan kegiatan pesantren, kebijakan keagamaan, dan khazanah santri dari PC RMI NU Kabupaten Demak.',
    ogTitle: 'Warta Pesantren — PC RMI NU Kabupaten Demak',
    ogDescription: 'Portal berita resmi dan khazanah intelektual pesantren Kabupaten Demak.',
    preloadHero: false,
    useLeaflet: false,
    scripts: ['core-utils.js', 'berita.js']
  }
];

function buildJsonLd(cfg) {
  const canonicalUrl = `https://rminudemak.org${cfg.urlPath}`;
  const graph = [
    {
      '@type': 'Organization',
      '@id': 'https://rminudemak.org/#organization',
      name: 'RMI PCNU Kabupaten Demak',
      alternateName: "PC Rabithah Ma'ahid Islamiyah Nahdlatul Ulama Kabupaten Demak",
      url: 'https://rminudemak.org/',
      logo: {
        '@type': 'ImageObject',
        url: 'https://rminudemak.org/assets/img/logo_rmi.png'
      },
      description: 'Portal Resmi Satu Data & Sistem Informasi Geospasial Pondok Pesantren, Madrasah Diniyah, dan TPQ se-Kabupaten Demak.',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Kabupaten Demak',
        addressRegion: 'Jawa Tengah',
        addressCountry: 'ID'
      },
      sameAs: ['https://www.instagram.com/rmidemak/']
    },
    {
      '@type': 'WebSite',
      '@id': 'https://rminudemak.org/#website',
      url: 'https://rminudemak.org/',
      name: 'RMI NU Demak — Portal Resmi PC RMINU Kabupaten Demak',
      inLanguage: 'id-ID',
      publisher: { '@id': 'https://rminudemak.org/#organization' }
    },
    {
      '@type': 'ImageObject',
      '@id': 'https://rminudemak.org/#primaryimage',
      url: 'https://rminudemak.org/assets/img/og_beranda_overview.jpg',
      contentUrl: 'https://rminudemak.org/assets/img/og_beranda_overview.jpg',
      width: 1200,
      height: 630,
      caption: 'Portal Resmi RMI PCNU Kabupaten Demak — Pusat Peradaban Santri Kota Wali'
    },
    {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: cfg.title,
      description: cfg.description,
      isPartOf: { '@id': 'https://rminudemak.org/#website' },
      primaryImageOfPage: { '@id': 'https://rminudemak.org/#primaryimage' },
      inLanguage: 'id-ID'
    }
  ];

  if (cfg.urlPath !== '/') {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Beranda', item: 'https://rminudemak.org/' },
        { '@type': 'ListItem', position: 2, name: cfg.title.split('—')[0].trim(), item: canonicalUrl }
      ]
    });
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replace(/</g, '\\u003c');
}

for (const cfg of PAGES_CONFIG) {
  const canonicalUrl = `https://rminudemak.org${cfg.urlPath}`;
  const pageContent = fs.readFileSync(cfg.srcFile, 'utf8');

  const leafletBlock = cfg.useLeaflet
    ? `    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script defer src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>`
    : '';

  const preloadBlock = cfg.preloadHero
    ? `    <link rel="preload" as="image" href="/assets/img/hero_slide_1.webp" type="image/webp" fetchpriority="high" />\n`
    : '';

  const scriptTags = [
    ...cfg.scripts.map((s) => `    <script defer src="/assets/js/${s}?v=${ASSET_VER}"></script>`),
    `    <script defer src="/app.js?v=${ASSET_VER}"></script>`
  ].join('\n');

  const html = `<!DOCTYPE html>
<html class="scroll-smooth" lang="id">
<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>${cfg.title}</title>
    <link rel="icon" type="image/png" sizes="256x256" href="/assets/img/logo_rmi.png" />
    <link rel="apple-touch-icon" sizes="256x256" href="/assets/img/logo_rmi.png" />
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#005c55" />
${preloadBlock}    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:site_name" content="RMI PCNU Kabupaten Demak" />
    <meta property="og:title" content="${cfg.ogTitle}" />
    <meta property="og:description" content="${cfg.ogDescription}" />
    <meta property="og:image" content="https://rminudemak.org/assets/img/og_beranda_overview.jpg" />
    <meta property="og:image:secure_url" content="https://rminudemak.org/assets/img/og_beranda_overview.jpg" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${canonicalUrl}" />
    <meta name="twitter:title" content="${cfg.ogTitle}" />
    <meta name="twitter:description" content="${cfg.ogDescription}" />
    <meta name="twitter:image" content="https://rminudemak.org/assets/img/og_beranda_overview.jpg" />
    <meta name="description" content="${cfg.description}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${canonicalUrl}" />
    <script type="application/ld+json">
${buildJsonLd(cfg)}
    </script>
${headAssets}
${leafletBlock}
</head>
<body class="bg-background text-on-surface flex flex-col min-h-screen overflow-x-hidden">
${navbar}
<main class="flex-grow pt-[52px] md:pt-[64px]">
${pageContent}
</main>
${footer}
${scriptTags}
${modals}
</body>
</html>
`;

  fs.writeFileSync(cfg.outFile, html, 'utf8');
  console.log(`Built ${cfg.outFile} (${Buffer.byteLength(html, 'utf8')} bytes, scripts: ${cfg.scripts.length + 1})`);
}
