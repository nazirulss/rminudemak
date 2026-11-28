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

const FALLBACK_PESANTREN_LIST = [
  {
    nama: "ROUDLOTUL MUBAROKAH",
    slug: "roudlotul-mubarokah",
    kecamatan: "Karangawen",
    pengasuh: "Nyai Hj. Nasichatul Fuadah",
    santri: 55,
    kategori: "Salafiyah & Tahfidz",
    foto: "https://lh3.googleusercontent.com/d/139UgfvNclvKK2qokvKfF__6MIC4aaZlF"
  },
  {
    nama: "Pondok Pesantren Fathul Huda",
    slug: "fathul-huda",
    kecamatan: "Sayung",
    pengasuh: "K.H. Zainal Arifin Ma'shum",
    santri: 1170,
    kategori: "Salafiyah & Formal",
    foto: "https://lh3.googleusercontent.com/d/1a3ihmmj3mxIwwsci2kFLibHk9xusUT58"
  },
  {
    nama: "Pondok Pesantren Futuhiyyah",
    slug: "futuhiyyah",
    kecamatan: "Mranggen",
    pengasuh: "K.H. Sa'id Abdurrohim",
    santri: 4300,
    kategori: "Salafiyah Wathoniyah",
    foto: "https://lh3.googleusercontent.com/d/1NCvPdIz8-DUjz2dDCD5zLKYUA3n34agP"
  },
  {
    nama: "Pondok Pesantren Girikusumo",
    slug: "girikusumo",
    kecamatan: "Mranggen",
    pengasuh: "K.H. Munif Muhammad Zuhri",
    santri: 2000,
    kategori: "Thariqah & Turots",
    foto: "https://lh3.googleusercontent.com/d/1a3ihmmj3mxIwwsci2kFLibHk9xusUT58"
  },
  {
    nama: "Pondok Pesantren Asnawiyyah",
    slug: "asnawiyyah",
    kecamatan: "Kebonagung",
    pengasuh: "K.H. Asnawi Cholil",
    santri: 520,
    kategori: "Salafiyah & Tahfidz",
    foto: "https://lh3.googleusercontent.com/d/1mOekcQhUGD2eqHMy-8AmEua9BrJK-06Z"
  },
  {
    nama: "Pondok Pesantren Al-Hidayah",
    slug: "al-hidayah",
    kecamatan: "Demak Kota",
    pengasuh: "K.H. Ahmad Baidlowi Misbah",
    santri: 650,
    kategori: "Salafiyah & Modern",
    foto: "https://lh3.googleusercontent.com/d/1a3ihmmj3mxIwwsci2kFLibHk9xusUT58"
  },
  {
    nama: "Pondok Pesantren Bustanu Usysyaqil Qur'an",
    slug: "bustanu-usysyaqil-quran",
    kecamatan: "Demak Kota",
    pengasuh: "K.H. Harir Muhammad",
    santri: 800,
    kategori: "Tahfidzul Qur'an",
    foto: "https://lh3.googleusercontent.com/d/1X5qDLQmi-Rww2YmblrisP9VhYiIb2k7_"
  },
  {
    nama: "Pondok Pesantren Roudlotut Tholibin",
    slug: "roudlotut-tholibin",
    kecamatan: "Karangtengah",
    pengasuh: "K.H. Abdul Muhaimin",
    santri: 410,
    kategori: "Salafiyah & Turots",
    foto: "https://lh3.googleusercontent.com/d/17kYcDeiWR9QtzTTwjZE1r_xyCtnDLNET"
  },
  {
    nama: "Pondok Pesantren Sirojul Mukhlasin",
    slug: "sirojul-mukhlasin",
    kecamatan: "Guntur",
    pengasuh: "K.H. Ahmad Syafi'i",
    santri: 320,
    kategori: "Salafiyah",
    foto: "https://lh3.googleusercontent.com/d/1ArYG-wLb_WblviGQ8xTGCKaCjpcIs4tT"
  },
  {
    nama: "Pondok Pesantren Darul Huda",
    slug: "darul-huda",
    kecamatan: "Bonang",
    pengasuh: "K.H. Nur Hadi",
    santri: 290,
    kategori: "Salafiyah & Madin",
    foto: "https://lh3.googleusercontent.com/d/1a3ihmmj3mxIwwsci2kFLibHk9xusUT58"
  },
  {
    nama: "Pondok Pesantren Nurul Burhan",
    slug: "nurul-burhan",
    kecamatan: "Wedung",
    pengasuh: "K.H. Burhanuddin",
    santri: 360,
    kategori: "Salafiyah",
    foto: "https://lh3.googleusercontent.com/d/1NCvPdIz8-DUjz2dDCD5zLKYUA3n34agP"
  },
  {
    nama: "Pondok Pesantren Miftahul Ulum",
    slug: "miftahul-ulum",
    kecamatan: "Mijen",
    pengasuh: "K.H. Shodiq Hamzah",
    santri: 480,
    kategori: "Salafiyah & Formal",
    foto: "https://lh3.googleusercontent.com/d/17kYcDeiWR9QtzTTwjZE1r_xyCtnDLNET"
  }
];

const FALLBACK_BERITA_LIST = [
  {
    slug: "perkuat-pola-pengasuhan-dan-manajemen-rmi-siap-rilis-3-buku-panduan-pesantren-di-awal-2027",
    judul: "Perkuat Pola Pengasuhan dan Manajemen, RMI Siap Rilis 3 Buku Panduan Pesantren di Awal 2027",
    ringkasan: "RMI siap rilis 3 buku panduan tata kelola dan pola pengasuhan ramah santri dalam halaqah pimpinan pesantren se-Kabupaten Demak.",
    kategori: "Pengasuhan & Pendidikan",
    media: "Media Online",
    published: "26 Nov 2026",
    cover: "https://lh3.googleusercontent.com/d/1DWP7K-L4YPZZBGAdZ7DZROcaeot_lzJU"
  },
  {
    slug: "menyongsong-kebijakan-ditjen-pesantren-rmi-dorong-kemudahan-imb-dan-tata-kelola-pondok-yang-bermarwah",
    judul: "Menyongsong Kebijakan Ditjen Pesantren: RMI Dorong Kemudahan IMB dan Tata Kelola Pondok yang Bermarwah",
    ringkasan: "RMI dorong kemudahan regulasi IMB dan tata kelola pesantren berbadan hukum serta percepatan sertifikasi aset wakaf pondok.",
    kategori: "Hukum & Tata Kelola",
    media: "Media Online",
    published: "25 Nov 2026",
    cover: "https://lh3.googleusercontent.com/d/1Ni4-uJmQxdAj8k-LWNLlxcgsBOaHFm9k"
  },
  {
    slug: "rmi-pcnu-demak-genjot-digitalisasi-pesantren-dari-sistem-scan-barcode-hingga-direktori-online-di-rminudemak-org",
    judul: "RMI PCNU Demak Genjot Digitalisasi Pesantren: Dari Sistem Scan Barcode hingga Direktori Online di rminudemak.org",
    ringkasan: "RMI PCNU Demak genjot digitalisasi pesantren lewat sistem scan barcode dan pendataan ulang. Simak rencana peluncuran Direktori Pesantren & Madin di www.rminudemak.org.",
    kategori: "Pendidikan & Madin",
    media: "Media Online",
    published: "25 Nov 2026",
    cover: "https://lh3.googleusercontent.com/d/1FMmgwwtrDfEWFmysUIMfA_Sp2zHJI8en"
  },
  {
    slug: "rmi-pwnu-jateng-dan-pcnu-demak-gelar-sambang-pesantren",
    judul: "RMI PWNU Jateng dan PCNU Demak Gelar Sambang Pesantren: Sinergi Kebangsaan, Tata Kelola Hukum, dan Transformasi Digital Pesantren",
    ringkasan: "RMI PWNU Jateng dan PCNU Demak bersinergi perkuat ekosistem, sinergi digital, dan mitigasi dinamika pesantren.",
    kategori: "Warta Organisasi",
    media: "Media Online",
    published: "24 Nov 2026",
    cover: "https://lh3.googleusercontent.com/d/1hhcOX6cN4G89hP0d0Ap3_YNf4-uN1Xzl"
  },
  {
    slug: "jaga-marwah-pesantren-rminu-demak-perkuat-peran-bu-nyai",
    judul: "Jaga Marwah Pesantren, RMINU Demak Perkuat Peran Bu Nyai dalam Perlindungan Santri",
    ringkasan: "RMI NU Demak memperkuat peran Bu Nyai dan pengasuh pondok pesantren putri dalam menciptakan lingkungan asrama yang aman, ramah anak, serta mandiri secara ekonomi.",
    kategori: "Pesantren Ramah Anak",
    media: "Media Online",
    published: "23 Nov 2026",
    cover: "https://lh3.googleusercontent.com/d/19HayeLVWKBo-2Nf-1udr_qUop41nIkme"
  },
  {
    slug: "dorong-penguatan-peran-bu-nyai-ikhtiar-rmi-demak-wujudkan-pesantren-ramah-anak",
    judul: "Dorong Penguatan Peran Bu Nyai, Ikhtiar RMI Demak Wujudkan Pesantren Ramah Anak",
    ringkasan: "Pelatihan fasilitator pesantren ramah anak membekali para Bu Nyai instrumen pencegahan dan mitigasi kekerasan santri.",
    kategori: "Pesantren Ramah Anak",
    media: "Media Online",
    published: "22 Nov 2026",
    cover: "https://lh3.googleusercontent.com/d/1yhOTSVJJlbhdVVyIBbGwV8mMc0QtSfiU"
  }
];

function buildFallbackPesantrenHtml() {
  return FALLBACK_PESANTREN_LIST.map((item) => {
    return `
      <div class="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group relative">
        <div class="h-48 relative bg-slate-100 shrink-0 overflow-hidden">
          <img src="${item.foto}" alt="${item.nama}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          <span class="absolute top-3 left-3 bg-emerald-800 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md tracking-wide">Pesantren</span>
          <span class="absolute bottom-2.5 right-3 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/95 text-emerald-800 shadow-sm border border-emerald-200/70">
            <span class="material-symbols-outlined text-[12px] text-emerald-600">verified_user</span> Ramah Santri
          </span>
        </div>
        <div class="p-4 flex flex-col flex-grow">
          <h3 class="font-extrabold text-[15px] text-slate-900 mb-1 leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
            <a href="/pesantren/${encodeURIComponent(item.slug)}" class="text-inherit no-underline">${item.nama}</a>
          </h3>
          <p class="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1">
            <span class="material-symbols-outlined text-[14px] text-emerald-600 shrink-0">location_on</span>
            <span class="truncate">Kec. ${item.kecamatan}, Kab. Demak</span>
          </p>
          <p class="text-[11px] text-slate-500 flex items-center gap-1 mb-3 truncate">
            <span class="material-symbols-outlined text-[14px] text-slate-400 shrink-0">person</span>
            <span class="truncate">Pengasuh: ${item.pengasuh}</span>
          </p>
          <div class="flex items-center gap-1.5 flex-wrap mb-4">
            <span class="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">${item.kategori}</span>
            <span class="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">${item.santri} Santri</span>
          </div>
          <div class="mt-auto pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
            <a href="/kecamatan/${encodeURIComponent(item.kecamatan.toLowerCase())}" class="px-2.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-colors">
              <span class="material-symbols-outlined text-[14px] text-emerald-600">map</span>
              <span>Kecamatan</span>
            </a>
            <a href="/pesantren/${encodeURIComponent(item.slug)}" class="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-700 text-emerald-800 hover:text-white border border-emerald-200 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-colors no-underline">
              <span class="material-symbols-outlined text-[14px]">visibility</span>
              <span>Detail Profil</span>
            </a>
          </div>
        </div>
      </div>`;
  }).join('\n');
}

function buildFallbackBeritaHtml() {
  return FALLBACK_BERITA_LIST.map((item) => {
    return `
      <div class="group flex flex-col sm:flex-row bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-300">
        <div class="sm:w-2/5 h-48 sm:h-auto relative overflow-hidden flex-shrink-0 bg-slate-900">
          <img src="${item.cover}" alt="${item.judul}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        </div>
        <div class="sm:w-3/5 p-5 flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[#008444] text-[10px] font-bold uppercase tracking-wider">${item.kategori}</span>
              <span class="text-slate-300">•</span>
              <span class="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">${item.media}</span>
            </div>
            <h3 class="text-sm sm:text-base font-bold text-slate-900 mb-2 leading-snug group-hover:text-[#008444] transition-colors line-clamp-2">
              <a href="/berita/${encodeURIComponent(item.slug)}" class="text-inherit no-underline">${item.judul}</a>
            </h3>
            <p class="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
              ${item.ringkasan}
            </p>
          </div>
          <div class="flex items-center justify-between text-[11px] font-medium text-slate-400 pt-2 border-t border-slate-100">
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">calendar_today</span> ${item.published}</span>
            <a href="/berita/${encodeURIComponent(item.slug)}" class="text-emerald-700 hover:text-emerald-900 font-bold text-xs flex items-center gap-1">
              <span>Baca Warta</span>
              <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>`;
  }).join('\n');
}

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

  // Schema Tambahan Khusus Sambang Pesantren (Event)
  if (cfg.urlPath === '/sambang') {
    graph.push({
      '@type': 'Event',
      'name': 'Sambang Pesantren PW RMI NU Jawa Tengah & PC RMI NU Demak',
      'description': 'Agenda konsolidasi, penguatan tata kelola pesantren ramah santri, dan halaqah santri PW RMI NU Jateng bersama PC RMI NU Demak.',
      'startDate': '2026-11-20T08:00:00+07:00',
      'endDate': '2026-12-31T17:00:00+07:00',
      'eventStatus': 'https://schema.org/EventScheduled',
      'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
      'location': {
        '@type': 'Place',
        'name': 'Pondok Pesantren Se-Kabupaten Demak',
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': 'Kabupaten Demak',
          'addressRegion': 'Jawa Tengah',
          'addressCountry': 'ID'
        }
      },
      'organizer': {
        '@id': 'https://rminudemak.org/#organization'
      }
    });
  }

  // Schema Tambahan Khusus Profil & Organogram (AboutPage)
  if (cfg.urlPath === '/profil') {
    graph.push({
      '@type': 'AboutPage',
      '@id': `${canonicalUrl}#about`,
      'mainEntity': {
        '@id': 'https://rminudemak.org/#organization'
      }
    });
  }

  // Schema Tambahan Khusus Panduan (FAQPage)
  if (cfg.urlPath === '/panduan') {
    graph.push({
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'Bagaimana cara mendaftar akun operator pesantren di Portal RMI Demak?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Pengelola atau operator pondok pesantren dapat mendaftar mandiri melalui menu Portal Data, mengisi NSPP resmi, nama pesantren, dan nomor WhatsApp admin terverifikasi.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Apakah login akun portal RMI Demak membutuhkan password?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Tidak. Portal RMI Demak menggunakan autentikasi modern tanpa password (Passwordless OTP) yang dikirimkan secara instan dan aman ke email terdaftar.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Apa saja 7 peran pengelola yang ada di ekosistem RMI Demak?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': '7 peran mencakup Super Admin PC, Admin Cabang RMI, Operator MWC Kecamatan, Pimpinan Pondok Pesantren, Operator Data Pesantren, Admin Madin, dan Admin TPQ.'
          }
        }
      ]
    });
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replace(/</g, '\\u003c');
}

for (const cfg of PAGES_CONFIG) {
  const canonicalUrl = `https://rminudemak.org${cfg.urlPath}`;
  let pageContent = fs.readFileSync(cfg.srcFile, 'utf8');

  // Injeksi SSR Fallback Cards untuk Halaman Direktori agar Googlebot tidak melihat kontainer kosong
  if (cfg.outFile === 'direktori.html') {
    pageContent = pageContent.replace(
      '<div id="grid-pesantren" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-slideFadeIn"></div>',
      `<div id="grid-pesantren" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-slideFadeIn">\n${buildFallbackPesantrenHtml()}\n</div>`
    );
  }

  // Injeksi SSR Fallback Articles untuk Halaman Berita
  if (cfg.outFile === 'berita.html') {
    pageContent = pageContent.replace(
      '<div id="berita-page-list" class="grid grid-cols-1 md:grid-cols-2 gap-6">',
      `<div id="berita-page-list" class="grid grid-cols-1 md:grid-cols-2 gap-6">\n${buildFallbackBeritaHtml()}`
    );
  }

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
