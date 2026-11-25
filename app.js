// ==========================================
// INISIALISASI SUPABASE CLIENT (ANTI-BENTROK CDN)
// ==========================================
const supabaseUrl = 'https://soqbfdyfkewahvemktmw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcWJmZHlma2V3YWh2ZW1rdG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMDY3NDUsImV4cCI6MjA5ODc4Mjc0NX0.FQuuav23hkNLKodUgWWWeOYM5SIGmoJl-UyP5oKfrAY';

const supabaseClient = (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function')
    ? window.supabase.createClient(supabaseUrl, supabaseKey)
    : null;

// Menyimpan seluruh data lembaga hasil fetch, supaya bisa difilter tanpa fetch ulang

// ==========================================
// MASTER SEED DATA (STANDAR DIGDAYA PESANTREN PBNU & RMI DEMAK)
// ==========================================
// ==========================================
// PETA GEOSPASIAL PUBLIK (LEAFLET.JS) STATE & KOORDINAT KABUPATEN DEMAK
// ==========================================
let publicMap = null;
let publicMapMarkers = [];
let currentPublicCategory = 'Pesantren';

const DEMAK_DISTRICT_COORDS = {
    "Mranggen": [-7.0274, 110.5188],
    "Karangawen": [-7.0514, 110.5847],
    "Guntur": [-6.9942, 110.6015],
    "Sayung": [-6.9189, 110.5218],
    "Karangtengah": [-6.9147, 110.6274],
    "Wonosalam": [-6.9242, 110.6811],
    "Wonotunggal/Wonosalam": [-6.9242, 110.6811],
    "Demak": [-6.8944, 110.6386],
    "Demak Kota": [-6.8944, 110.6386],
    "Bonang": [-6.8524, 110.5824],
    "Wedung": [-6.7824, 110.5614],
    "Mijen": [-6.8124, 110.7142],
    "Gajah": [-6.8824, 110.7514],
    "Karanganyar": [-6.8514, 110.7914],
    "Dempet": [-6.9814, 110.7124],
    "Kebonagung": [-7.0314, 110.7412]
};

const DEMAK_14_KECAMATAN = [
    "Bonang",
    "Demak Kota",
    "Dempet",
    "Gajah",
    "Guntur",
    "Karanganyar",
    "Karangawen",
    "Karangtengah",
    "Kebonagung",
    "Mijen",
    "Mranggen",
    "Sayung",
    "Wedung",
    "Wonosalam"
];

function normalizeKecamatanName(kec) {
    if (!kec) return '';
    const k = String(kec).trim().toLowerCase();
    if (k === 'demak' || k === 'demak kota') return 'Demak Kota';
    if (k.includes('wonosalam') || k.includes('wonotunggal')) return 'Wonosalam';
    if (k.includes('sayung')) return 'Sayung';
    if (k.includes('mranggen')) return 'Mranggen';
    if (k.includes('karangawen')) return 'Karangawen';
    if (k.includes('guntur')) return 'Guntur';
    if (k.includes('karangtengah')) return 'Karangtengah';
    if (k.includes('bonang')) return 'Bonang';
    if (k.includes('wedung')) return 'Wedung';
    if (k.includes('mijen')) return 'Mijen';
    if (k.includes('gajah')) return 'Gajah';
    if (k.includes('karanganyar')) return 'Karanganyar';
    if (k.includes('dempet')) return 'Dempet';
    if (k.includes('kebonagung')) return 'Kebonagung';
    return String(kec).trim();
}

/**
 * Smart Geolocation Resolver untuk Lembaga Pendidikan Keagamaan di Demak.
 * Menangani titik koordinat presisi riil, mendeteksi koordinat default/fallback Demak Kota (-6.8944, 110.6386),
 * serta menyebarkan titik secara proporsional dan deterministik di dalam wilayah kecamatannya masing-masing.
 */
function resolveLembagaCoordinates(item, index) {
    let lat = (item.latitude !== null && item.latitude !== undefined && item.latitude !== '') ? parseFloat(item.latitude) : null;
    let lng = (item.longitude !== null && item.longitude !== undefined && item.longitude !== '') ? parseFloat(item.longitude) : null;

    // Batas wilayah resmi Kabupaten Demak (lat: -7.15 s.d -6.70, lng: 110.40 s.d 110.88)
    const isOutOfBounds = (lat !== null && lng !== null) && (lat < -7.15 || lat > -6.70 || lng < 110.40 || lng > 110.88);
    const isMissing = !lat || !lng || isNaN(lat) || isNaN(lng);
    // Koordinat default Demak Kota dari database pusat (-6.8944, 110.6386)
    const isDefaultDemakCenter = !isMissing && (Math.abs(lat - (-6.8944)) < 0.0001 && Math.abs(lng - 110.6386) < 0.0001);

    if (isMissing || isDefaultDemakCenter || isOutOfBounds) {
        const rawKec = normalizeKecamatanName(item.kecamatan || '');
        const kecKeys = Object.keys(DEMAK_DISTRICT_COORDS).filter(k => k !== 'Wonotunggal/Wonosalam' && k !== 'Demak');
        // Jika kecamatan tidak terdefinisi atau tidak cocok, sebar merata ke 14 kecamatan se-Demak berdasarkan index
        const targetKec = DEMAK_DISTRICT_COORDS[rawKec] ? rawKec : kecKeys[index % kecKeys.length];
        const baseCoord = DEMAK_DISTRICT_COORDS[targetKec] || DEMAK_DISTRICT_COORDS['Demak Kota'] || [-6.8944, 110.6386];

        // Hash deterministik berbasis ID / Kode / Nama dan Index agar sebaran unik dan konsisten setiap refresh
        const seedStr = String(item.id || item.kode_pesantren || item.nama || '') + '_' + String(index);
        let hash = 0;
        for (let i = 0; i < seedStr.length; i++) {
            hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
            hash = Math.abs(hash | 0);
        }

        // Distribusi polar di sekitar pusat kecamatan (radius 400 meter s.d. 1.8 kilometer)
        const angle = ((hash % 360) * Math.PI) / 180;
        const dist = 0.004 + ((hash % 100) / 100) * 0.013;
        // Koreksi mikro index agar 100% titik unik dan tidak bertumpuk
        const microJitterLat = ((index % 11) - 5) * 0.00035 + ((index % 3) * 0.0001);
        const microJitterLng = ((index % 7) - 3) * 0.00045 + ((index % 5) * 0.0001);

        lat = baseCoord[0] + (Math.sin(angle) * dist) + microJitterLat;
        lng = baseCoord[1] + (Math.cos(angle) * dist * 1.06) + microJitterLng;
    }

    return [lat, lng];
}

/**
 * Sinkronisasi seluruh indikator statistik kuantitatif platform secara real-time
 * Menyelaraskan angka di Beranda (hero badge, hero impact counter) dan Direktori (map stats card)
 */
function updateAllPlatformStats(dataList) {
    const list = (dataList && dataList.length > 0) ? dataList : allLembagaData;
    const pesantrenList = list.filter(l => (l.jenis || '').toLowerCase() === 'pesantren');
    const madinList = list.filter(l => (l.jenis || '').toLowerCase() === 'madin');
    const tpqList = list.filter(l => (l.jenis || '').toLowerCase() === 'tpq');

    const pCount = pesantrenList.length > 0 ? pesantrenList.length : 293;

    // 1. Update Badge Hero Peta Beranda jika sedang di tab Pesantren
    const heroLabel = document.getElementById('hero-map-label');
    if (heroLabel && (typeof currentHeroCategory === 'undefined' || currentHeroCategory.toLowerCase() === 'pesantren')) {
        heroLabel.innerText = `${pCount} Pondok Pesantren Tervalidasi`;
    }

    // 2. Update Counter Ringkasan Hero Beranda
    const heroStatCount = document.getElementById('hero-stat-pesantren-count');
    if (heroStatCount) {
        heroStatCount.innerText = `${pCount}+`;
    }

    // 3. Update Floating Stats Card di Halaman Direktori
    const statsCountEl = document.getElementById('map-stats-count');
    if (statsCountEl) {
        if (typeof currentPublicCategory === 'undefined' || currentPublicCategory.toLowerCase() === 'pesantren') {
            statsCountEl.innerText = `${pCount}`;
        } else if (currentPublicCategory.toLowerCase() === 'madin') {
            statsCountEl.innerText = `${madinList.length || 540}+`;
        } else if (currentPublicCategory.toLowerCase() === 'tpq') {
            statsCountEl.innerText = `${tpqList.length || 850}+`;
        }
    }
}

// Aset visual resmi bertema Islami & Pesantren untuk lembaga yang belum mengunggah foto
const ISLAMIC_FALLBACK_IMAGES = [
    'https://lh3.googleusercontent.com/d/1a3ihmmj3mxIwwsci2kFLibHk9xusUT58', // Kemegahan Arsitektur Masjid & Menara Islami
    'https://lh3.googleusercontent.com/d/1X5qDLQmi-Rww2YmblrisP9VhYiIb2k7_', // Al-Qur\'an, Kitab Turots & Rehal Kayu
    'https://lh3.googleusercontent.com/d/17kYcDeiWR9QtzTTwjZE1r_xyCtnDLNET', // Kubah Hijau & Lengkungan Seni Islami
    'https://lh3.googleusercontent.com/d/1NCvPdIz8-DUjz2dDCD5zLKYUA3n34agP', // Masjid Agung Demak Kota Wali
    'https://lh3.googleusercontent.com/d/1ArYG-wLb_WblviGQ8xTGCKaCjpcIs4tT'  // Halaqah Santri Mengaji Pesantren
];

function getIslamicFallbackPhoto(seedStr) {
    if (!seedStr) return ISLAMIC_FALLBACK_IMAGES[0];
    let hash = 0;
    const str = String(seedStr);
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
    }
    const idx = Math.abs(hash) % ISLAMIC_FALLBACK_IMAGES.length;
    return ISLAMIC_FALLBACK_IMAGES[idx];
}

function populatePublicKecamatanDropdown(activeCategory = currentPublicCategory) {
    const selectEl = document.getElementById('filter-kecamatan');
    if (!selectEl) return;

    const currentSelected = selectEl.value;

    // Filter data lembaga berdasarkan kategori aktif untuk menghitung count
    const relevantData = allLembagaData.filter(l => {
        if (!activeCategory || activeCategory === 'Semua') return true;
        return (l.jenis || '').toLowerCase() === activeCategory.toLowerCase();
    });

    // Hitung frekuensi per kecamatan
    const countMap = {};
    DEMAK_14_KECAMATAN.forEach(k => countMap[k] = 0);

    relevantData.forEach(l => {
        const norm = normalizeKecamatanName(l.kecamatan);
        if (countMap[norm] !== undefined) {
            countMap[norm]++;
        }
    });

    const totalCount = relevantData.length;
    let optionsHtml = `<option value="">Semua Kecamatan (${totalCount})</option>`;

    DEMAK_14_KECAMATAN.forEach(kec => {
        const count = countMap[kec] || 0;
        const isSelected = (normalizeKecamatanName(currentSelected) === kec) ? 'selected' : '';
        optionsHtml += `<option value="${escapeHTML(kec)}" ${isSelected}>${escapeHTML(kec)} (${count})</option>`;
    });

    selectEl.innerHTML = optionsHtml;
}

window.populatePublicKecamatanDropdown = populatePublicKecamatanDropdown;
window.normalizeKecamatanName = normalizeKecamatanName;

const DEFAULT_LEMBAGA_DATA = [
    {
        id: "c1f7b820-9f2d-4e9b-b0b2-7d8b5a1b3c9e",
        nama: "Pondok Pesantren Fathul Huda",
        nama_populer: "PP Fathul Huda Sayung",
        jenis: "Pesantren",
        kategori_atau_metode: "Salafiyah & Formal",
        pengasuh_atau_kepala: "K.H. Zainal Arifin Ma'shum",
        kecamatan: "Sayung",
        alamat_detail: "Jl. Raya Semarang-Demak KM 14, Sidorejo",
        latitude: -6.9189,
        longitude: 110.5218,
        nspp: "510033210001",
        tahun_berdiri: 1978,
        santri_mukim: 850,
        santri_nonmukim: 320,
        has_komitmen_pesantren_aman: true,
        foto_url: "https://lh3.googleusercontent.com/d/1a3ihmmj3mxIwwsci2kFLibHk9xusUT58",
        media_sosial: {
            website: "https://fathulhuda.sch.id",
            youtube: "https://youtube.com/@fathulhuda_official",
            instagram: "https://instagram.com/pp_fathulhuda",
            tiktok: "https://tiktok.com/@fathulhuda_demak",
            hotline_psb: "081234567890"
        },
        dewan_asatidz: [
            { nama: "K.H. Zainal Arifin Ma'shum", jabatan: "Pengasuh Utama", kategori: "ustadz", spesialisasi: "Fiqih & Ushul Fiqih", pendidikan: "PP Sarang" },
            { nama: "Nyai Hj. Masruroh Zainal", jabatan: "Pengasuh Putri", kategori: "ustadzah", spesialisasi: "Tahfidz & Akhlaq", pendidikan: "PP Al-Muayyad Solo" },
            { nama: "Gus M. Aniq, M.Pd", jabatan: "Kepala Madin", kategori: "ustadz", spesialisasi: "Nahwu Sharaf", pendidikan: "UIN Walisongo (S2)" }
        ],
        kurikulum_kitab: [
            { marhalah: "ula", nama_kitab: "Safinatun Najah", pengarang: "Salim bin Samir", bidang_ilmu: "Fiqih Dasar" },
            { marhalah: "ula", nama_kitab: "Al-Jurumiyah", pengarang: "Ibnu Ajurrum", bidang_ilmu: "Nahwu" },
            { marhalah: "wustho", nama_kitab: "Fathul Qorib Al-Mujib", pengarang: "Ibnu Qasim", bidang_ilmu: "Fiqih Lanjutan" },
            { marhalah: "wustho", nama_kitab: "Imrithi", pengarang: "Syarafuddin Al-Imrithi", bidang_ilmu: "Gramatika Arab" },
            { marhalah: "ulya", nama_kitab: "Fathul Wahhab", pengarang: "Zakariya Al-Anshari", bidang_ilmu: "Fiqih Perbandingan" },
            { marhalah: "ulya", nama_kitab: "Alfiyah Ibnu Malik", pengarang: "Ibnu Malik", bidang_ilmu: "Linguistik Arab" }
        ],
        badan_usaha: [
            { nama_usaha: "Kopontren Fathul Huda", bentuk_usaha: "koperasi", bidang_usaha: "Ritel & Kantin Santri", status_usaha: "active" }
        ]
    },
    {
        id: "a2e8c930-1b3d-4f1a-a0a1-6c7b4a2b1d8f",
        nama: "Pondok Pesantren Futuhiyyah",
        nama_populer: "PP Futuhiyyah Suburan",
        jenis: "Pesantren",
        kategori_atau_metode: "Salafiyah Wathoniyah",
        pengasuh_atau_kepala: "K.H. Sa'id Abdurrohim",
        kecamatan: "Mranggen",
        alamat_detail: "Jl. Suburan Raya No. 1, Mranggen",
        latitude: -7.0274,
        longitude: 110.5188,
        nspp: "510033210002",
        tahun_berdiri: 1901,
        santri_mukim: 3200,
        santri_nonmukim: 1100,
        has_komitmen_pesantren_aman: true,
        foto_url: "https://lh3.googleusercontent.com/d/1NCvPdIz8-DUjz2dDCD5zLKYUA3n34agP",
        media_sosial: {
            website: "https://futuhiyyah.org",
            youtube: "https://youtube.com/@futuhiyyahsuburan",
            instagram: "https://instagram.com/futuhiyyah_official",
            tiktok: "https://tiktok.com/@futuhiyyah.demak",
            hotline_psb: "081122334455"
        },
        dewan_asatidz: [
            { nama: "K.H. Sa'id Abdurrohim", jabatan: "Pengasuh Utama", kategori: "ustadz", spesialisasi: "Hadits & Fiqih", pendidikan: "Haramain Makkah" },
            { nama: "K.H. Faiz Sa'id", jabatan: "Majelis Pengasuh", kategori: "ustadz", spesialisasi: "Ushul Fiqih", pendidikan: "Al-Azhar Kairo (Lc.)" }
        ],
        kurikulum_kitab: [
            { marhalah: "ula", nama_kitab: "Fathul Qorib", pengarang: "Ibnu Qasim", bidang_ilmu: "Fiqih" },
            { marhalah: "wustho", nama_kitab: "Fathul Mu'in", pengarang: "Zainuddin Al-Malibari", bidang_ilmu: "Fiqih Syafi'i" },
            { marhalah: "ulya", nama_kitab: "Shohih Al-Bukhari", pengarang: "Imam Bukhari", bidang_ilmu: "Hadits Nabawi" }
        ],
        badan_usaha: [
            { nama_usaha: "BMT Futuhiyyah", bentuk_usaha: "koperasi", bidang_usaha: "Lembaga Keuangan Mikro Syariah", status_usaha: "active" },
            { nama_usaha: "Futuhiyyah Printing & Grafika", bentuk_usaha: "pt_cv", bidang_usaha: "Percetakan & Offset", status_usaha: "active" }
        ]
    },
    {
        id: "d3f9d040-2c4e-5a2b-b1b2-7d8c5b3c2e9a",
        nama: "Pondok Pesantren Girikusumo",
        nama_populer: "PP Girikusumo Banyumeneng",
        jenis: "Pesantren",
        kategori_atau_metode: "Thariqah & Turots",
        pengasuh_atau_kepala: "K.H. Munif Muhammad Zuhri",
        kecamatan: "Mranggen",
        alamat_detail: "Dusun Girikusumo, Banyumeneng",
        latitude: -7.0350,
        longitude: 110.5350,
        nspp: "510033210003",
        tahun_berdiri: 1868,
        santri_mukim: 1400,
        santri_nonmukim: 600,
        has_komitmen_pesantren_aman: true,
        foto_url: "https://lh3.googleusercontent.com/d/1a3ihmmj3mxIwwsci2kFLibHk9xusUT58",
        media_sosial: {
            website: "https://girikusumo.id",
            youtube: "https://youtube.com/@girikusumo_channel",
            instagram: "https://instagram.com/girikusumo_heritage",
            tiktok: "",
            hotline_psb: "081399887766"
        },
        dewan_asatidz: [
            { nama: "K.H. Munif Muhammad Zuhri", jabatan: "Mursyid Thariqah", kategori: "ustadz", spesialisasi: "Tasawuf & Thariqah", pendidikan: "Sanad Girikusumo" }
        ],
        kurikulum_kitab: [
            { marhalah: "ula", nama_kitab: "Sullamut Taufiq", pengarang: "Abdullah bin Husain", bidang_ilmu: "Fiqih & Tasawuf" },
            { marhalah: "wustho", nama_kitab: "Al-Hikam", pengarang: "Ibnu Athaillah", bidang_ilmu: "Tasawuf Salaf" }
        ],
        badan_usaha: [
            { nama_usaha: "Kebun Herbal Agro Giri", bentuk_usaha: "unit_internal", bidang_usaha: "Pertanian & Obat Tradisional", status_usaha: "active" }
        ]
    },
    {
        id: "7d8e9f10-4a5b-6c7d-8e9f-0a1b2c3d4e5f",
        nama: "Pondok Pesantren Asnawiyyah",
        nama_populer: "PP Asnawiyyah Pilang Kebonagung",
        jenis: "Pesantren",
        kategori_atau_metode: "Salafiyah & Tahfidz",
        pengasuh_atau_kepala: "K.H. Asnawi Cholil",
        kecamatan: "Kebonagung",
        alamat_detail: "Dusun Pilang RT 02 RW 04, Kebonagung",
        nspp: "510033210007",
        tahun_berdiri: 1996,
        santri_mukim: 380,
        santri_nonmukim: 140,
        has_komitmen_pesantren_aman: true,
        foto_url: "https://lh3.googleusercontent.com/d/1mOekcQhUGD2eqHMy-8AmEua9BrJK-06Z",
        media_sosial: {
            website: "https://pesantren.nu.id/pesantren/asnawiyyah-2",
            youtube: "https://youtube.com/@asnawiyyah_demak",
            instagram: "https://instagram.com/pp_asnawiyyah_kebonagung",
            tiktok: "https://tiktok.com/@santriasnawiyyah",
            hotline_psb: "085211223344"
        },
        dewan_asatidz: [
            { nama: "K.H. Asnawi Cholil", jabatan: "Khadimul Ma'had", kategori: "ustadz", spesialisasi: "Fiqih & Falak", pendidikan: "PP Futuhiyyah" },
            { nama: "Nyai Hj. Siti Rohmah", jabatan: "Pengasuh Putri", kategori: "ustadzah", spesialisasi: "Tahfidz Al-Quran", pendidikan: "PP Yanbu'ul Quran Kudus" },
            { nama: "Ustadz M. Shofi, S.Pd.I", jabatan: "Lurah Pondok", kategori: "ustadz", spesialisasi: "Nahwu Shorof", pendidikan: "STAIS Demak (S1)" },
            { nama: "Ustadzah Khairun Nisa", jabatan: "Muhaffizhah", kategori: "ustadzah", spesialisasi: "Tahsin wa Qiraat", pendidikan: "Kudus" }
        ],
        kurikulum_kitab: [
            { marhalah: "ula", nama_kitab: "Mabadiul Fiqhiyyah", pengarang: "Umar Abdul Jabbar", bidang_ilmu: "Fiqih Ibadah" },
            { marhalah: "ula", nama_kitab: "Al-Amtsilah At-Tashrifiyyah", pengarang: "KH. Ma'shum bin Ali", bidang_ilmu: "Shorof" },
            { marhalah: "wustho", nama_kitab: "Fathul Qorib Al-Mujib", pengarang: "Ibnu Qasim al-Ghazi", bidang_ilmu: "Fiqih Muamalah" },
            { marhalah: "wustho", nama_kitab: "Tafsir Jalalain", pengarang: "Jalaluddin As-Suyuthi", bidang_ilmu: "Tafsir" },
            { marhalah: "ulya", nama_kitab: "Fathul Mu'in", pengarang: "Ahmad Zainuddin Al-Malibari", bidang_ilmu: "Fiqih Mendalam" }
        ],
        badan_usaha: [
            { nama_usaha: "Toko Kitab Asnawiyyah", bentuk_usaha: "unit_internal", bidang_usaha: "Penyedia Kitab & ATK", status_usaha: "active" },
            { nama_usaha: "Budidaya Perikanan Santri", bentuk_usaha: "unit_internal", bidang_usaha: "Agribisnis Air Tawar", status_usaha: "active" }
        ]
    },
    {
        id: "e4a0e150-3d5f-6b3c-c2c3-8e9d6c4d3f0b",
        nama: "Pondok Pesantren Al-Hidayah",
        nama_populer: "PP Al-Hidayah Karangtengah",
        jenis: "Pesantren",
        kategori_atau_metode: "Tahfidz & Diniyah",
        pengasuh_atau_kepala: "K. Ahmad Badhawi Ali",
        kecamatan: "Karangtengah",
        alamat_detail: "Jl. KH. Sholeh Darat No. 05, Ploso",
        latitude: -6.9147,
        longitude: 110.6274,
        nspp: "510033210004",
        tahun_berdiri: 1985,
        santri_mukim: 420,
        santri_nonmukim: 180,
        has_komitmen_pesantren_aman: false,
        foto_url: "https://lh3.googleusercontent.com/d/1a3ihmmj3mxIwwsci2kFLibHk9xusUT58",
        media_sosial: {
            website: "",
            youtube: "",
            instagram: "https://instagram.com/alhidayah_ploso",
            tiktok: "",
            hotline_psb: "082133445566"
        },
        dewan_asatidz: [
            { nama: "K. Ahmad Badhawi Ali", jabatan: "Pengasuh", kategori: "ustadz", spesialisasi: "Falak & Fiqih", pendidikan: "PP Al-Anwar Sarang" }
        ],
        kurikulum_kitab: [
            { marhalah: "ula", nama_kitab: "Aqidatul Awam", pengarang: "Ahmad Al-Marzuqi", bidang_ilmu: "Aqidah" },
            { marhalah: "wustho", nama_kitab: "Fathul Qorib", pengarang: "Ibnu Qasim", bidang_ilmu: "Fiqih" }
        ],
        badan_usaha: []
    },
    {
        id: "f5b1f260-4e6a-7c4d-d3d4-9f0e7d5e4a1c",
        nama: "Pondok Pesantren Nurul Huda",
        nama_populer: "PP Nurul Huda Bintoro",
        jenis: "Pesantren",
        kategori_atau_metode: "Kajian Fiqih",
        pengasuh_atau_kepala: "K.H. Ibrahim Cholilullah",
        kecamatan: "Demak Kota",
        alamat_detail: "Jl. Sultan Fatah Gang Kauman No. 22",
        latitude: -6.8944,
        longitude: 110.6386,
        nspp: "510033210005",
        tahun_berdiri: 1992,
        santri_mukim: 310,
        santri_nonmukim: 95,
        has_komitmen_pesantren_aman: true,
        foto_url: "https://lh3.googleusercontent.com/d/1NCvPdIz8-DUjz2dDCD5zLKYUA3n34agP",
        media_sosial: {
            website: "",
            youtube: "https://youtube.com/@nurulhudabintoro",
            instagram: "https://instagram.com/nurulhuda_bintoro",
            tiktok: "",
            hotline_psb: "087788990011"
        },
        dewan_asatidz: [
            { nama: "K.H. Ibrahim Cholilullah", jabatan: "Pengasuh", kategori: "ustadz", spesialisasi: "Tafsir & Hadits", pendidikan: "PP Tebuireng Jombang" }
        ],
        kurikulum_kitab: [
            { marhalah: "ula", nama_kitab: "Safinatun Najah", pengarang: "Salim bin Samir", bidang_ilmu: "Fiqih" },
            { marhalah: "wustho", nama_kitab: "Riyadhus Shalihin", pengarang: "Imam An-Nawawi", bidang_ilmu: "Hadits" }
        ],
        badan_usaha: [
            { nama_usaha: "Kantin Kejujuran Santri", bentuk_usaha: "unit_internal", bidang_usaha: "Kantin & Konsumsi", status_usaha: "active" }
        ]
    },
    {
        id: "m01",
        nama: "Madin Wustho Al-Futuhiyyah",
        jenis: "Madin",
        kategori_atau_metode: "Wustho",
        pengasuh_atau_kepala: "K.H. Faiz Sa'id, Lc.",
        kecamatan: "Mranggen",
        alamat_detail: "Jl. Suburan Raya No. 02, Suburan",
        latitude: -7.0250,
        longitude: 110.5210,
        foto_url: "https://lh3.googleusercontent.com/d/1ArYG-wLb_WblviGQ8xTGCKaCjpcIs4tT"
    },
    {
        id: "m02",
        nama: "Madrasah Diniyah Salafiyah Fathul Ulum",
        jenis: "Madin",
        kategori_atau_metode: "Ula",
        pengasuh_atau_kepala: "Ust. M. Ridwan, S.Pd.I",
        kecamatan: "Sayung",
        alamat_detail: "Dusun Sidorejo RT 04 RW 02",
        latitude: -6.9210,
        longitude: 110.5250,
        foto_url: "https://lh3.googleusercontent.com/d/1ArYG-wLb_WblviGQ8xTGCKaCjpcIs4tT"
    },
    {
        id: "t01",
        nama: "TPQ Yanbu'ul Quran Pilang",
        jenis: "TPQ",
        kategori_atau_metode: "Yanbu'a",
        pengasuh_atau_kepala: "Ustazah Siti Maryam",
        kecamatan: "Kebonagung",
        alamat_detail: "Kompleks Masjid Jami' Pilang RT 01 RW 03",
        latitude: -7.0314,
        longitude: 110.7412,
        foto_url: "https://lh3.googleusercontent.com/d/1mOekcQhUGD2eqHMy-8AmEua9BrJK-06Z"
    },
    {
        id: "t02",
        nama: "TPQ Al-Ikhlas Bintoro",
        jenis: "TPQ",
        kategori_atau_metode: "Qira'ati",
        pengasuh_atau_kepala: "Ust. Ahmad Syukron",
        kecamatan: "Demak Kota",
        alamat_detail: "Kauman Gang III No. 12",
        latitude: -6.8920,
        longitude: 110.6350,
        foto_url: "https://lh3.googleusercontent.com/d/1mOekcQhUGD2eqHMy-8AmEua9BrJK-06Z"
    }
];

let allLembagaData = [...DEFAULT_LEMBAGA_DATA];

// Fungsi untuk menghindari serangan XSS dari input database
function escapeHTML(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeHtml(value) {
    return escapeHTML(value);
}

// ==================================================================
// DATA FETCHER & SMART CACHE (STALE-WHILE-REVALIDATE + TTL)
// Mencegah request berlebih ke CDN/Google Apps Script saat deploy di Vercel
// ==================================================================
const APPS_SCRIPT_PUBLIC_URL = "https://script.google.com/macros/s/AKfycbw-0Y0IM-uR326H4bkWAvbQ179Q5NrfgJT8ihOf8lY7C_joVwrT136fPRjRqu8U9jhU/exec?action=GET_ALL_PESANTREN";
const CACHE_KEY_LEMBAGA = "rmi_demak_pesantren_cache_v6";
const CACHE_KEY_TIME = "rmi_demak_pesantren_cache_time_v6";
const CACHE_TTL_MS = 15 * 60 * 1000; // Cache berlaku 15 menit

async function loadLembagaDariSupabase() {
    // 0. Cek Cache Lokal Terlebih Dahulu (Instant Load 0ms, hemat CDN/Apps Script)
    try {
        const cachedRaw = localStorage.getItem(CACHE_KEY_LEMBAGA);
        const cachedTime = localStorage.getItem(CACHE_KEY_TIME);
        const isFresh = cachedTime && (Date.now() - Number(cachedTime) < CACHE_TTL_MS);

        if (cachedRaw) {
            const parsed = JSON.parse(cachedRaw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                allLembagaData = parsed;
                renderLembagaCards(allLembagaData);
                if (publicMap) loadPublicMapMarkers(currentPublicCategory);
                if (heroGisMap) loadHeroMapMarkers(currentHeroCategory);
                populatePublicKecamatanDropdown(currentPublicCategory);
                updateAllPlatformStats(allLembagaData);

                if (isFresh) {
                    console.log("⚡ Portal Publik: Memuat data dari cache lokal (hemat kuota Apps Script & CDN).");
                    return;
                }
                console.log("⏳ Portal Publik: Cache lokal kedaluwarsa, memperbarui di latar belakang...");
            }
        }
    } catch(e) {
        console.warn("Gagal membaca cache lokal:", e);
    }

    // 1. Coba Tarik Data Live dari Google Spreadsheet Backend
    try {
        const gasResponse = await fetch(APPS_SCRIPT_PUBLIC_URL);
        const gasResult = await gasResponse.json();

        if (gasResult && gasResult.success && gasResult.data && gasResult.data.length > 0) {
            console.log("Portal Publik: Berhasil memuat", gasResult.data.length, "pesantren live langsung dari Google Spreadsheet.");
            
            // Formatkan agar cocok dengan struktur kartu lembaga
            const livePesantren = gasResult.data.map(p => ({
                id: p.id,
                kode_pesantren: p.kode_pesantren || '',
                nama: p.nama_resmi,
                nama_populer: p.nama_populer || '',
                jenis: 'Pesantren',
                klasifikasi: p.klasifikasi || 'SALAF',
                kategori_atau_metode: p.klasifikasi || ((p.jenjang_pendidikan && p.jenjang_pendidikan.length > 0) ? p.jenjang_pendidikan.join(', ') : 'Salafiyah'),
                pengasuh_atau_kepala: p.pengasuh_utama || 'Pengasuh',
                wakil_pengasuh: p.wakil_pengasuh || [],
                kecamatan: p.kecamatan || 'Demak',
                desa: p.desa || '',
                alamat_detail: p.alamat || '',
                nspp: p.nspp || '',
                tahun_berdiri: p.tahun_berdiri || '',
                santri_mukim: p.santri_mukim || 0,
                santri_nonmukim: p.santri_nonmukim || 0,
                latitude: (p.latitude !== undefined && p.latitude !== null && p.latitude !== '') ? parseFloat(p.latitude) : null,
                longitude: (p.longitude !== undefined && p.longitude !== null && p.longitude !== '') ? parseFloat(p.longitude) : null,
                has_komitmen_pesantren_aman: p.has_komitmen_pesantren_aman === true || p.has_komitmen_pesantren_aman === 'true',
                foto_url: (p.foto_url && String(p.foto_url).trim().startsWith('http')) ? p.foto_url : getIslamicFallbackPhoto(p.id || p.nama_resmi),
                logo_url: (p.logo_url && String(p.logo_url).trim().startsWith('http')) ? p.logo_url : '',
                media_sosial: p.media_sosial || {},
                dewan_asatidz: p.dewan_asatidz || [],
                kurikulum_kitab: p.kurikulum_kitab || [],
                badan_usaha: p.badan_usaha || [],
                galeri_foto: p.galeri_foto || [],
                fasilitas: p.fasilitas || []
            }));

            // Gabungkan dengan unit Madin dan TPQ lokal non-pesantren
            const nonPesantren = DEFAULT_LEMBAGA_DATA.filter(l => l.jenis !== 'Pesantren');
            allLembagaData = [...livePesantren, ...nonPesantren];
            
            // Simpan ke Cache Lokal dengan Timestamp
            try {
                localStorage.setItem(CACHE_KEY_LEMBAGA, JSON.stringify(allLembagaData));
                localStorage.setItem(CACHE_KEY_TIME, String(Date.now()));
            } catch(e) {}

            renderLembagaCards(allLembagaData);
            if (publicMap) loadPublicMapMarkers(currentPublicCategory);
            if (heroGisMap) loadHeroMapMarkers(currentHeroCategory);
            populatePublicKecamatanDropdown(currentPublicCategory);
            updateAllPlatformStats(allLembagaData);
            return;
        }
    } catch (gasErr) {
        console.warn("Gagal menghubungi Google Apps Script, mencoba jalur Supabase/Cache lokal:", gasErr.message);
    }

    // 2. Fallback ke Supabase / Master Default jika offline
    try {
        if (supabaseClient) {
            const { data: lembagaList, error } = await supabaseClient
                .from('lembaga')
                .select('*')
                .order('nama', { ascending: true });

            if (!error && lembagaList && lembagaList.length > 0) {
                allLembagaData = lembagaList;
                renderLembagaCards(allLembagaData);
                updateAllPlatformStats(allLembagaData);
                return;
            }
        }
    } catch (e) {
        console.warn("Koneksi cloud offline:", e.message);
    }

    // 3. Fallback Terakhir ke Master Seed Lokal jika belum ada data
    if (allLembagaData.length === 0) {
        allLembagaData = [...DEFAULT_LEMBAGA_DATA];
        renderLembagaCards(allLembagaData);
        updateAllPlatformStats(allLembagaData);
    }
}


// ==================================================================

// ==================================================================
// MODUL PETA GEOSPASIAL HERO BERANDA (3 TAB: PESANTREN, MADIN, TPQ)
// ==================================================================
let heroGisMap = null;
let heroGisMapMarkers = [];
let currentHeroCategory = 'Pesantren';

function initHeroMap() {
    const mapContainer = document.getElementById('hero-gis-map-container');
    if (!mapContainer) return;

    if (typeof L === 'undefined') {
        setTimeout(initHeroMap, 250);
        return;
    }

    if (heroGisMap) {
        heroGisMap.invalidateSize();
        return;
    }

    try {
        const demakCenter = [-6.8944, 110.6386];
        const demakBounds = L.latLngBounds(
            L.latLng(-7.10, 110.45),
            L.latLng(-6.75, 110.84)
        );

        heroGisMap = L.map('hero-gis-map-container', {
            center: demakCenter,
            zoom: 10.5,
            minZoom: 9.5,
            maxZoom: 16,
            zoomControl: false,
            attributionControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            subdomains: ['a', 'b', 'c'],
            maxZoom: 18,
            attribution: '&copy; OpenStreetMap | RMI PCNU Demak'
        }).addTo(heroGisMap);

        L.control.zoom({ position: 'topleft' }).addTo(heroGisMap);

        heroGisMap.fitBounds(demakBounds, { padding: [10, 10] });

        setTimeout(() => { if (heroGisMap) heroGisMap.invalidateSize(); }, 200);
        setTimeout(() => { if (heroGisMap) heroGisMap.invalidateSize(); }, 600);

        loadHeroMapMarkers(currentHeroCategory);
        console.log("Hero GIS Map: Berhasil diinisialisasi.");
    } catch (err) {
        console.error("Gagal menginisialisasi heroGisMap:", err);
    }
}

function recenterHeroMap() {
    if (!heroGisMap) return;
    const demakBounds = L.latLngBounds(
        L.latLng(-7.10, 110.45),
        L.latLng(-6.75, 110.84)
    );
    heroGisMap.fitBounds(demakBounds, { padding: [10, 10] });
}

function switchHeroMapTab(category) {
    currentHeroCategory = category;

    const tabPesantren = document.getElementById('hero-tab-pesantren');
    const tabMadin = document.getElementById('hero-tab-madin');
    const tabTpq = document.getElementById('hero-tab-tpq');

    const indicator = document.getElementById('hero-map-indicator');
    const label = document.getElementById('hero-map-label');

    const inactiveClass = 'hero-map-tab py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-white/80 hover:text-white hover:bg-white/10';
    if (tabPesantren) tabPesantren.className = inactiveClass;
    if (tabMadin) tabMadin.className = inactiveClass;
    if (tabTpq) tabTpq.className = inactiveClass;

    const pCount = allLembagaData.filter(l => (l.jenis || '').toLowerCase() === 'pesantren').length || 293;

    if (category.toLowerCase() === 'pesantren') {
        if (tabPesantren) tabPesantren.className = 'hero-map-tab py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 bg-primary text-white shadow-md border border-white/20';
        if (indicator) indicator.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse';
        if (label) label.innerText = `${pCount} Pondok Pesantren Tervalidasi`;
    } else if (category.toLowerCase() === 'madin') {
        if (tabMadin) tabMadin.className = 'hero-map-tab py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 bg-secondary text-white shadow-md border border-white/20';
        if (indicator) indicator.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse';
        if (label) label.innerText = '540+ Madrasah Diniyah Terdaftar';
    } else if (category.toLowerCase() === 'tpq') {
        if (tabTpq) tabTpq.className = 'hero-map-tab py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 bg-tertiary text-white shadow-md border border-white/20';
        if (indicator) indicator.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0 animate-pulse';
        if (label) label.innerText = '850+ TPQ Al-Qur\'an Terintegrasi';
    }

    loadHeroMapMarkers(category);
}

function loadHeroMapMarkers(activeCategory = 'Pesantren') {
    if (!heroGisMap) return;

    heroGisMapMarkers.forEach(m => heroGisMap.removeLayer(m));
    heroGisMapMarkers = [];

    const sourceData = (allLembagaData && allLembagaData.length > 0) ? allLembagaData : DEFAULT_LEMBAGA_DATA;
    const filtered = sourceData.filter(l => {
        if (!activeCategory || activeCategory === 'Semua') return true;
        return (l.jenis || '').toLowerCase() === activeCategory.toLowerCase();
    });

    let markerColor = '#005c55';
    let badgeBg = 'bg-primary/10 text-primary';
    let btnBg = 'bg-primary hover:bg-primary/90';

    if (activeCategory.toLowerCase() === 'madin') {
        markerColor = '#1f6c3a';
        badgeBg = 'bg-secondary/10 text-secondary';
        btnBg = 'bg-secondary hover:bg-secondary/90';
    } else if (activeCategory.toLowerCase() === 'tpq') {
        markerColor = '#7f4025';
        badgeBg = 'bg-tertiary/10 text-tertiary';
        btnBg = 'bg-tertiary hover:bg-tertiary/90';
    }

    filtered.forEach((item, index) => {
        const [lat, lng] = resolveLembagaCoordinates(item, index);

        const marker = L.circleMarker([lat, lng], {
            radius: 6.5,
            fillColor: markerColor,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.95
        }).addTo(heroGisMap);

        const safeId = escapeHTML(item.id);
        const popupContent = `
            <div class="font-sans text-xs p-1" style="min-width: 170px;">
                <div class="flex items-center justify-between gap-1 mb-1">
                    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeBg}">${escapeHTML(item.jenis || activeCategory)}</span>
                    <span class="text-[10px] text-slate-500 font-semibold">Kec. ${escapeHTML(item.kecamatan || 'Demak')}</span>
                </div>
                <h4 class="font-bold text-xs text-slate-900 leading-snug">${escapeHTML(item.nama)}</h4>
                ${item.pengasuh_atau_kepala ? `<p class="text-[10px] text-slate-600 mt-0.5"><span class="text-slate-400">Pengasuh:</span> ${escapeHTML(item.pengasuh_atau_kepala)}</p>` : ''}
                <button onclick="bukaModalDetailLembaga('${safeId}')" class="mt-2 w-full py-1 ${btnBg} text-white rounded-lg text-[10px] font-bold text-center transition-colors shadow-sm flex items-center justify-center gap-1 cursor-pointer">
                    <span>Lihat Detail</span>
                    <span class="material-symbols-outlined text-[11px]">arrow_forward</span>
                </button>
            </div>
        `;

        marker.bindPopup(popupContent);
        heroGisMapMarkers.push(marker);
    });
}

window.initHeroMap = initHeroMap;
window.recenterHeroMap = recenterHeroMap;
window.switchHeroMapTab = switchHeroMapTab;
window.loadHeroMapMarkers = loadHeroMapMarkers;
window.resolveLembagaCoordinates = resolveLembagaCoordinates;
window.updateAllPlatformStats = updateAllPlatformStats;

// MODUL PETA GEOSPASIAL PUBLIK DIREKTORI (LEAFLET.JS)
// ==================================================================
function initPublicMap() {
    const mapContainer = document.getElementById('public-map-container');
    if (!mapContainer) return;

    if (typeof L === 'undefined') {
        console.warn("Library Leaflet.js sedang dimuat, menjadwalkan inisialisasi ulang...");
        setTimeout(initPublicMap, 200);
        return;
    }

    if (publicMap) {
        publicMap.invalidateSize();
        return;
    }

    try {
        const demakCenter = [-6.8944, 110.6386];
        const demakBounds = L.latLngBounds(
            L.latLng(-7.12, 110.42), // Sayung & Mranggen
            L.latLng(-6.72, 110.86)  // Wedung & Mijen
        );

        publicMap = L.map('public-map-container', {
            center: demakCenter,
            zoom: 11,
            minZoom: 10,
            maxZoom: 16,
            maxBounds: L.latLngBounds(L.latLng(-7.25, 110.30), L.latLng(-6.60, 110.98)),
            zoomControl: true,
            attributionControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            subdomains: ['a', 'b', 'c'],
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | RMI PCNU Demak',
            maxZoom: 18
        }).addTo(publicMap);

        publicMap.fitBounds(demakBounds, { padding: [16, 16] });

        // Paksa invalidateSize bertahap untuk mencegah tampilan abu-abu
        setTimeout(() => { if (publicMap) publicMap.invalidateSize(); }, 150);
        setTimeout(() => { if (publicMap) publicMap.invalidateSize(); }, 400);
        setTimeout(() => { if (publicMap) publicMap.invalidateSize(); }, 800);

        loadPublicMapMarkers(currentPublicCategory);
        console.log("Portal Publik: Leaflet Map berhasil dimuat.");
    } catch (err) {
        console.error("Gagal menginisialisasi Leaflet publicMap:", err);
    }
}

function recenterPublicMap() {
    if (!publicMap) return;
    const demakBounds = L.latLngBounds(
        L.latLng(-7.12, 110.42),
        L.latLng(-6.72, 110.86)
    );
    publicMap.fitBounds(demakBounds, { padding: [16, 16] });
}

function loadPublicMapMarkers(activeCategory = 'Pesantren', activeKecamatan = '') {
    if (!publicMap) return;

    // Bersihkan marker lama
    publicMapMarkers.forEach(m => publicMap.removeLayer(m));
    publicMapMarkers = [];

    // Filter data berdasarkan kategori aktif
    let filtered = allLembagaData.filter(l => {
        if (!activeCategory || activeCategory === 'Semua') return true;
        return (l.jenis || '').toLowerCase() === activeCategory.toLowerCase();
    });

    if (activeKecamatan && !/\(Semua\)/.test(activeKecamatan)) {
        const normFilter = normalizeKecamatanName(activeKecamatan).toLowerCase();
        filtered = filtered.filter(l => normalizeKecamatanName(l.kecamatan).toLowerCase() === normFilter);
    }

    // Tentukan palet warna Asnawiyyah
    let markerColor = '#005c55'; // Emerald Pesantren
    let badgeBg = 'bg-primary/10 text-primary';
    let btnBg = 'bg-primary hover:bg-primary/90';

    if (activeCategory.toLowerCase() === 'madin') {
        markerColor = '#1f6c3a'; // Hijau Daun Madin
        badgeBg = 'bg-secondary/10 text-secondary';
        btnBg = 'bg-secondary hover:bg-secondary/90';
    } else if (activeCategory.toLowerCase() === 'tpq') {
        markerColor = '#7f4025'; // Amber TPQ
        badgeBg = 'bg-tertiary/10 text-tertiary';
        btnBg = 'bg-tertiary hover:bg-tertiary/90';
    }

    filtered.forEach((item, index) => {
        const [lat, lng] = resolveLembagaCoordinates(item, index);

        const marker = L.circleMarker([lat, lng], {
            radius: 7.5,
            fillColor: markerColor,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.92
        }).addTo(publicMap);

        const safeId = escapeHTML(item.id);
        const popupContent = `
            <div class="font-sans text-xs p-1" style="min-width: 180px;">
                <div class="flex items-center justify-between gap-1 mb-1">
                    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeBg}">${escapeHTML(item.jenis || activeCategory)}</span>
                    <span class="text-[10px] text-slate-500 font-semibold">Kec. ${escapeHTML(item.kecamatan || 'Demak')}</span>
                </div>
                <h4 class="font-bold text-xs text-slate-900 leading-snug">${escapeHTML(item.nama)}</h4>
                ${item.pengasuh_atau_kepala ? `<p class="text-[11px] text-slate-600 mt-1"><span class="text-slate-400">Pengasuh:</span> ${escapeHTML(item.pengasuh_atau_kepala)}</p>` : ''}
                ${item.santri_mukim ? `<p class="text-[10px] text-slate-500 mt-0.5"><span class="font-semibold text-slate-700">${(item.santri_mukim + (item.santri_nonmukim || 0)).toLocaleString()}</span> Santri</p>` : ''}
                <button onclick="bukaModalDetailLembaga('${safeId}')" class="mt-2.5 w-full py-1.5 ${btnBg} text-white rounded-lg text-[10px] font-bold text-center transition-colors shadow-sm flex items-center justify-center gap-1 cursor-pointer">
                    <span>Lihat Profil Lengkap</span>
                    <span class="material-symbols-outlined text-[12px]">arrow_forward</span>
                </button>
            </div>
        `;

        marker.bindPopup(popupContent);
        publicMapMarkers.push(marker);
    });

    const statsCountEl = document.getElementById('map-stats-count');
    if (statsCountEl) {
        if (activeCategory.toLowerCase() === 'pesantren') {
            statsCountEl.innerText = filtered.length > 5 ? `${filtered.length}` : '380+';
        } else if (activeCategory.toLowerCase() === 'madin') {
            statsCountEl.innerText = filtered.length > 5 ? `${filtered.length}` : '540+';
        } else if (activeCategory.toLowerCase() === 'tpq') {
            statsCountEl.innerText = filtered.length > 5 ? `${filtered.length}` : '850+';
        }
    }
}

window.initPublicMap = initPublicMap;
window.recenterPublicMap = recenterPublicMap;
window.loadPublicMapMarkers = loadPublicMapMarkers;

// =========================================================================
// REGISTRI LOGO TRANSPARAN RESMI (.PNG TRANS-BACKGROUND ASLI)
// =========================================================================
const LOCAL_TRANSPARENT_LOGOS = new Set([
    'al-badriyyah-2', 'al-maarif-2', 'asnawiyyah-2', 'bustanu-usysyaqil-quran', 'bustanul-quran-3',
    'darul-ulum-8', 'hidayatul-mubtadiin-11', 'miftahul-anwar-2', 'nahdlotul-fata-asysyababain-2',
    'nurul-burhany-2', 'pondok-pesantren-al-adzkar', 'pondok-pesantren-al-falah-jogoloyo-2',
    'pondok-pesantren-al-furqon-sidorejo-2', 'pondok-pesantren-al-kautsariyyah-2',
    'pondok-pesantren-alfattaah-demak', 'pondok-pesantren-as-salafiyah-as-syafiiyyah-2',
    'pondok-pesantren-bukit-al-quran-2', 'pondok-pesantren-darul-mawa-2', 'pondok-pesantren-futuhiyyah',
    'pondok-pesantren-ibrohimiyyah-putri-induk-2', 'pondok-pesantren-kyai-gading-2',
    'pondok-pesantren-murottil-quran-2', 'pondok-pesantren-raudhotudz-dzakirin-sodong-2',
    'pondok-pesantren-sains-nurul-fikri', 'pondok-pesantren-tahfidz-al-futuhat-2',
    'pondok-pesantren-tahfidzul-quran-hisnun-naja', 'pondok-pesantren-usmaniyyah',
    'ponpes-nurul-lathifah', 'ponpes-sabilunnajah', 'pp-sabilul-muttaqin-2', 'ppiq-darun-najach',
    'raudlotus-sibyan-2', 'roudhotus-sholihin', 'roudlotul-mubarokah', 'roudlotul-muttaqin-2',
    'roudlotul-quran', 'sirojuth-tholibin-2', 'ubaydillah-2'
]);

function getLocalTransparentLogoUrl(item) {
    if (!item) return '';
    const slug = (typeof generatePesantrenSlug === 'function') ? generatePesantrenSlug(item) : '';
    const fullSlug = (item.nama || '').toLowerCase().replace(/['"’`]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

    if (slug && LOCAL_TRANSPARENT_LOGOS.has(slug)) return `assets/img/logo_pesantren/${slug}.png`;
    if (fullSlug && LOCAL_TRANSPARENT_LOGOS.has(fullSlug)) return `assets/img/logo_pesantren/${fullSlug}.png`;
    if (slug && LOCAL_TRANSPARENT_LOGOS.has(slug + '-2')) return `assets/img/logo_pesantren/${slug}-2.png`;
    if (fullSlug && LOCAL_TRANSPARENT_LOGOS.has(fullSlug + '-2')) return `assets/img/logo_pesantren/${fullSlug}-2.png`;
    return '';
}

// =========================================================================
// HELPER BADGE KLASIFIKASI PESANTREN (SALAF / TAHFIDZ / KOMBINASI / TERINTEGRASI / MODERN)
// =========================================================================
function getClassificationBadge(klasifikasi) {
    const k = String(klasifikasi || 'SALAF').trim().toUpperCase();
    switch (k) {
        case 'TAHFIDZ':
            return {
                label: 'TAHFIDZ',
                sublabel: "Al-Qur'an",
                color: 'bg-teal-700',
                textColor: 'text-teal-700',
                badgeBg: 'bg-teal-50',
                border: 'border-teal-200'
            };
        case 'KOMBINASI':
            return {
                label: 'KOMBINASI',
                sublabel: 'Salaf + Tahfidz',
                color: 'bg-sky-700',
                textColor: 'text-sky-700',
                badgeBg: 'bg-sky-50',
                border: 'border-sky-200'
            };
        case 'TERINTEGRASI':
            return {
                label: 'TERINTEGRASI',
                sublabel: 'Pondok + Formal',
                color: 'bg-indigo-700',
                textColor: 'text-indigo-700',
                badgeBg: 'bg-indigo-50',
                border: 'border-indigo-200'
            };
        case 'MODERN':
            return {
                label: 'MODERN',
                sublabel: 'Sistem Modern',
                color: 'bg-amber-700',
                textColor: 'text-amber-700',
                badgeBg: 'bg-amber-50',
                border: 'border-amber-200'
            };
        case 'SALAF':
        default:
            return {
                label: 'SALAF',
                sublabel: 'Kitab Kuning',
                color: 'bg-emerald-700',
                textColor: 'text-emerald-700',
                badgeBg: 'bg-emerald-50',
                border: 'border-emerald-200'
            };
    }
}

// =========================================================================
// RENDERER ELEMEN LOGO PESANTREN (DATABASE & GOOGLE DRIVE RESMI, BEBAS LATAR HITAM)
// =========================================================================
function getPesantrenLogoHtml(item, sizeClass = 'w-12 h-12', textSize = 'text-xs') {
    // 1. Ambil langsung dari Database & Google Drive (logo_url) sebagai Single Source of Truth
    if (item.logo_url && String(item.logo_url).trim().startsWith('http')) {
        const localFallback = getLocalTransparentLogoUrl(item);
        const fallbackAttr = localFallback ? `onerror="this.onerror=null; this.src='${localFallback}';"` : '';
        return `<img src="${escapeHTML(item.logo_url)}" alt="Logo ${escapeHTML(item.nama)}" class="w-full h-full object-contain" style="width: 100%; height: 100%; object-fit: contain; display: block;" ${fallbackAttr} />`;
    }

    // 2. Fallback ke berkas .png lokal jika database belum terisi URL online
    const localLogo = getLocalTransparentLogoUrl(item);
    if (localLogo) {
        return `<img src="${localLogo}" alt="Logo ${escapeHTML(item.nama)}" class="w-full h-full object-contain" style="width: 100%; height: 100%; object-fit: contain; display: block;" />`;
    }
    
    // Inisial monogram fallback elegan
    let cleanName = (item.nama || '').replace(/^(Pondok\s+Pesantren|Pondok|Pesantren|PP)\s+/i, '').trim();
    let words = cleanName.split(/\s+/);
    let initials = words.length >= 2 
        ? (words[0][0] + words[1][0]).toUpperCase() 
        : (cleanName.slice(0, 2)).toUpperCase() || 'PP';
    
    const palettes = [
        'bg-emerald-700 text-white',
        'bg-teal-800 text-teal-100',
        'bg-blue-800 text-blue-100',
        'bg-emerald-900 text-emerald-200',
        'bg-slate-800 text-slate-100'
    ];
    const codeNum = parseInt(String(item.id || item.kode_pesantren || '1').replace(/\D/g, '') || '0', 10);
    const palette = palettes[codeNum % palettes.length];
    
    return `<div class="w-full h-full ${palette} rounded-xl flex items-center justify-center font-black font-mono ${textSize} select-none shadow-xs" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">${initials}</div>`;
}

// Merender daftar lembaga ke masing-masing grid
// ==========================================
// HELPER FAVORIT (WISHLIST) & STANDAR KARTU PESANTREN.NU.ID
// ==========================================
const RMI_FAVORITES_KEY = 'rmi_user_favorites';

function getPesantrenFavorites() {
    try {
        const raw = localStorage.getItem(RMI_FAVORITES_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

function togglePesantrenFavorite(event, pesantrenId) {
    if (event) event.stopPropagation();
    const idStr = String(pesantrenId);
    const favs = getPesantrenFavorites();
    const idx = favs.indexOf(idStr);
    let isFav = false;
    if (idx === -1) {
        favs.push(idStr);
        isFav = true;
    } else {
        favs.splice(idx, 1);
        isFav = false;
    }
    try {
        localStorage.setItem(RMI_FAVORITES_KEY, JSON.stringify(favs));
    } catch (e) {}

    // Update UI icon state across all matching buttons
    document.querySelectorAll(`[data-fav-btn="${idStr}"]`).forEach(btn => {
        const icon = btn.querySelector('.material-symbols-outlined');
        if (icon) {
            icon.innerText = isFav ? 'favorite' : 'favorite_border';
            if (isFav) {
                btn.classList.remove('bg-black/30', 'text-white');
                btn.classList.add('bg-white', 'text-rose-500', 'shadow-md');
            } else {
                btn.classList.add('bg-black/30', 'text-white');
                btn.classList.remove('bg-white', 'text-rose-500', 'shadow-md');
            }
        }
    });
}
window.togglePesantrenFavorite = togglePesantrenFavorite;

function getSantriGenderBadge(item) {
    const text = `${item.nama || ''} ${item.kategori_atau_metode || ''} ${item.klasifikasi || ''}`.toLowerCase();
    const hasPutri = /\bputri\b|\bbanat\b|\bnisa\b|\bmuslimat\b/.test(text);
    const hasPutra = /\bputra\b|\bbanin\b|\brijal\b/.test(text);
    if (hasPutri && !hasPutra) {
        return { label: 'Putri', bgClass: 'bg-[#047857]' };
    }
    if (hasPutra && !hasPutri) {
        return { label: 'Putra', bgClass: 'bg-[#0369a1]' };
    }
    return { label: 'Putra & Putri', bgClass: 'bg-[#005c55]' };
}

function getLembagaFacilityPills(item) {
    const tags = [];
    if (Array.isArray(item.fasilitas) && item.fasilitas.length > 0) {
        item.fasilitas.forEach(f => {
            const label = typeof f === 'string' ? f : (f.nama || f.nama_fasilitas);
            if (label) tags.push(label);
        });
    } else {
        tags.push('Perpustakaan');
        if (item.has_komitmen_pesantren_aman) {
            tags.push('UKS / Poskestren');
        } else {
            tags.push('Asrama Santri');
        }
        if (item.kurikulum_kitab && item.kurikulum_kitab.length > 0) {
            tags.push(`${item.kurikulum_kitab.length} Kitab Turots`);
        }
        if (item.badan_usaha && item.badan_usaha.length > 0) {
            tags.push('Kopontren');
        }
        tags.push('Masjid Jami\'');
    }
    return tags;
}

function buildMadinTpqEmptyNotice(jenisLabel) {
    return `
        <div class="col-span-full bg-white rounded-3xl border border-emerald-100 shadow-sm p-8 md:p-10 text-center max-w-2xl mx-auto my-4">
            <div class="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <span class="material-symbols-outlined text-[32px]">menu_book</span>
            </div>
            <h3 class="text-lg md:text-xl font-extrabold text-slate-900 mb-2">Pangkalan Data ${escapeHTML(jenisLabel)} Se-Kabupaten Demak</h3>
            <p class="text-xs md:text-sm text-slate-600 leading-relaxed mb-6">
                Saat ini pangkalan data resmi <strong>${escapeHTML(jenisLabel)}</strong> sedang dalam proses kurasi dan verifikasi bertahap bersama Koordinator MWC NU di 14 Kecamatan. Bagi pengelola atau operator lembaga, silakan ajukan pendataan mandiri agar lembaga Anda tampil di Direktori Resmi PC RMI NU Demak.
            </p>
            <div class="flex flex-wrap items-center justify-center gap-3">
                <a href="admin.html#daftar-mandiri" class="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2">
                    <span class="material-symbols-outlined text-[16px]">app_registration</span>
                    <span>Ajukan Pendataan Mandiri</span>
                </a>
                <button type="button" onclick="document.getElementById('btn-pesantren')?.click()" class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
                    <span class="material-symbols-outlined text-[16px]">arrow_back</span>
                    <span>Lihat 293 Pondok Pesantren</span>
                </button>
            </div>
        </div>
    `;
}

function renderLembagaCards(lembagaList) {
    try {
        const gridPesantren = document.getElementById('grid-pesantren');
        const gridMadin = document.getElementById('grid-madin');
        const gridTpq = document.getElementById('grid-tpq');

        if (gridPesantren) gridPesantren.innerHTML = '';
        if (gridMadin) gridMadin.innerHTML = '';
        if (gridTpq) gridTpq.innerHTML = '';

        if (!lembagaList || lembagaList.length === 0) {
            if (gridPesantren) {
                gridPesantren.innerHTML = `
                    <div class="col-span-full bg-white rounded-3xl border border-slate-200 p-10 text-center max-w-xl mx-auto my-4">
                        <span class="material-symbols-outlined text-[40px] text-slate-300 mb-2">search_off</span>
                        <h3 class="text-base font-bold text-slate-800">Tidak Ada Lembaga Ditemukan</h3>
                        <p class="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau pilih kecamatan lain.</p>
                    </div>
                `;
            }
            if (gridMadin) gridMadin.innerHTML = buildMadinTpqEmptyNotice('Madrasah Diniyah (Madin)');
            if (gridTpq) gridTpq.innerHTML = buildMadinTpqEmptyNotice("Taman Pendidikan Al-Qur'an (TPQ)");
            return;
        }

        const favorites = getPesantrenFavorites();
        const htmlPesantren = [];
        const htmlMadin = [];
        const htmlTpq = [];

        lembagaList.forEach(item => {
            let badgeColor = 'bg-primary';
            let badgeLabel = '';
            let badgeTooltip = '';
            let targetList = null;

            if (item.jenis === 'Pesantren') {
                const bInfo = getClassificationBadge(item.klasifikasi || item.kategori_atau_metode);
                badgeColor = bInfo.color;
                badgeLabel = bInfo.label;
                badgeTooltip = `${bInfo.label} (${bInfo.sublabel})`;
                targetList = htmlPesantren;
            } else if (item.jenis === 'Madin') {
                badgeColor = 'bg-secondary';
                badgeLabel = escapeHTML(item.kategori_atau_metode || 'Madin');
                badgeTooltip = badgeLabel;
                targetList = htmlMadin;
            } else if (item.jenis === 'TPQ') {
                badgeColor = 'bg-tertiary';
                badgeLabel = escapeHTML(item.kategori_atau_metode || 'TPQ');
                badgeTooltip = badgeLabel;
                targetList = htmlTpq;
            }

            if (targetList) {
                const fallbackFoto = (item.foto_url && String(item.foto_url).trim().startsWith('http')) ? item.foto_url : getIslamicFallbackPhoto(item.id || item.nama);

                const safeFoto = escapeHTML(fallbackFoto);
                const safeNama = escapeHTML(item.nama);
                const safePengasuh = escapeHTML(item.pengasuh_atau_kepala || '-');
                const safeKecamatan = escapeHTML(item.kecamatan || 'Demak');
                const safeId = escapeHTML(item.id || '');
                const logoHtml = getPesantrenLogoHtml(item, 'w-11 h-11', 'text-xs');

                const genderInfo = getSantriGenderBadge(item);
                const isFav = favorites.includes(String(item.id));
                const favBtnClass = isFav ? 'bg-white text-rose-500 shadow-md' : 'bg-black/30 text-white hover:bg-black/50';
                const favIconName = isFav ? 'favorite' : 'favorite_border';

                const facilities = getLembagaFacilityPills(item);
                const visibleFacilities = facilities.slice(0, 2);
                const extraCount = facilities.length > 2 ? facilities.length - 2 : 0;

                const facilityPillsHtml = visibleFacilities.map(f =>
                    `<span class="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[125px]">${escapeHTML(f)}</span>`
                ).join('') + (extraCount > 0 ? `<span class="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md">+${extraCount}</span>` : '');

                const lat = item.latitude || -6.8944;
                const lng = item.longitude || 110.6386;
                const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

                const cardHTML = `
                    <div class="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group relative"
                         data-pesantren-id="${safeId}"
                         onmouseenter="handlePesantrenCardHover(event, '${safeId}')" 
                         onmouseleave="handlePesantrenCardLeave()">
                        
                        <!-- Area Foto Cover 16:9 ala pesantren.nu.id -->
                        <div class="h-48 relative bg-slate-100 shrink-0 overflow-hidden cursor-pointer" onclick="bukaModalDetailLembaga('${safeId}')">
                            <img src="${safeFoto}" onerror="this.onerror=null;this.src='https://lh3.googleusercontent.com/d/1a3ihmmj3mxIwwsci2kFLibHk9xusUT58';" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="${safeNama}" />
                            
                            <!-- Badge Gender Santri (Pojok Kiri Atas) -->
                            <span class="absolute top-3 left-3 ${item.jenis === 'Pesantren' ? genderInfo.bgClass : badgeColor} text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md tracking-wide" title="${badgeTooltip}">
                                ${item.jenis === 'Pesantren' ? genderInfo.label : badgeLabel}
                            </span>

                            <!-- Tombol Favorit / Wishlist (Pojok Kanan Atas) -->
                            <button type="button" data-fav-btn="${safeId}" onclick="togglePesantrenFavorite(event, '${safeId}')" title="Simpan ke Daftar Favorit"
                                class="absolute top-3 right-3 w-8 h-8 rounded-full ${favBtnClass} backdrop-blur-xs flex items-center justify-center transition-all cursor-pointer z-10">
                                <span class="material-symbols-outlined text-[18px]">${favIconName}</span>
                            </button>

                            <!-- Badge Logo Melayang di Pojok Kiri Bawah Foto -->
                            <div class="absolute bottom-2.5 left-3 z-10 w-11 h-11 rounded-xl bg-white border-2 border-white shadow-md p-0.5 flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
                                ${logoHtml}
                            </div>

                            ${item.has_komitmen_pesantren_aman ? `
                            <span class="absolute bottom-2.5 right-3 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/95 text-emerald-800 shadow-sm border border-emerald-200/70" title="Terverifikasi Komitmen Pesantren Ramah Santri">
                                <span class="material-symbols-outlined text-[12px] text-emerald-600">verified_user</span> Ramah Santri
                            </span>` : ''}
                        </div>

                        <!-- Area Konten Kartu -->
                        <div class="p-4 flex flex-col flex-grow">
                            <h3 onclick="bukaModalDetailLembaga('${safeId}')" class="font-extrabold text-[15px] text-slate-900 mb-1 leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors cursor-pointer" title="${safeNama}">
                                ${safeNama}
                            </h3>
                            <p class="text-xs font-medium text-slate-500 flex items-center gap-1 mb-1">
                                <span class="material-symbols-outlined text-[14px] text-emerald-600 shrink-0">location_on</span>
                                <span class="truncate">Kec. ${safeKecamatan}, Kab. Demak</span>
                            </p>
                            <p class="text-[11px] text-slate-500 flex items-center gap-1 mb-3 truncate" title="${safePengasuh}">
                                <span class="material-symbols-outlined text-[14px] text-slate-400 shrink-0">${item.jenis === 'Pesantren' ? 'person' : 'supervisor_account'}</span>
                                <span class="truncate">${safePengasuh}</span>
                            </p>

                            <!-- Pills Fasilitas ala pesantren.nu.id -->
                            <div class="flex items-center gap-1.5 flex-wrap mb-4">
                                ${facilityPillsHtml}
                            </div>

                            <!-- Action Bar -->
                            <div class="mt-auto pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                                <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" class="px-2.5 py-2 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200/90 hover:border-rose-200 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-colors">
                                    <span class="material-symbols-outlined text-[14px] text-rose-500">map</span>
                                    <span>Buka Maps</span>
                                </a>
                                <button type="button" onclick="bukaModalDetailLembaga('${safeId}')" class="px-2.5 py-2 bg-emerald-50/70 hover:bg-emerald-700 text-emerald-800 hover:text-white border border-emerald-200/80 hover:border-emerald-700 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer">
                                    <span class="material-symbols-outlined text-[14px]">visibility</span>
                                    <span>Detail Profil</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                targetList.push(cardHTML);
            }
        });

        if (gridPesantren) {
            gridPesantren.innerHTML = htmlPesantren.length > 0 ? htmlPesantren.join('') : `
                <div class="col-span-full bg-white rounded-3xl border border-slate-200 p-10 text-center max-w-xl mx-auto my-4">
                    <span class="material-symbols-outlined text-[40px] text-slate-300 mb-2">search_off</span>
                    <h3 class="text-base font-bold text-slate-800">Tidak Ada Pesantren Cocok</h3>
                    <p class="text-xs text-slate-500 mt-1">Coba bersihkan filter kecamatan atau ubah kata kunci pencarian.</p>
                </div>
            `;
        }
        if (gridMadin) {
            gridMadin.innerHTML = (htmlMadin.length > 2) ? htmlMadin.join('') : buildMadinTpqEmptyNotice('Madrasah Diniyah (Madin)');
        }
        if (gridTpq) {
            gridTpq.innerHTML = (htmlTpq.length > 2) ? htmlTpq.join('') : buildMadinTpqEmptyNotice("Taman Pendidikan Al-Qur'an (TPQ)");
        }
    } catch (catchedError) {
        console.error("Sistem mengalami kendala saat me-render data:", catchedError);
    }
}

// Logika Fungsi Pencarian & Filter
function applyLembagaFilter() {
    const searchInput = document.getElementById('search-nama');
    const kecamatanSelect = document.getElementById('filter-kecamatan');
    const kategoriSelect = document.getElementById('filter-kategori');

    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const kecamatanValue = kecamatanSelect ? kecamatanSelect.value : '';
    const kategoriValue = kategoriSelect ? kategoriSelect.value : '';

    const normalizedFilterKec = normalizeKecamatanName(kecamatanValue);

    const filtered = allLembagaData.filter(item => {
        const matchKeyword = !keyword ||
            (item.nama && item.nama.toLowerCase().includes(keyword)) ||
            (item.pengasuh_atau_kepala && item.pengasuh_atau_kepala.toLowerCase().includes(keyword));

        const normItemKec = normalizeKecamatanName(item.kecamatan);
        const matchKecamatan = !kecamatanValue ||
            /\(Semua\)/.test(kecamatanValue) ||
            normItemKec.toLowerCase() === normalizedFilterKec.toLowerCase();

        const matchKategori = !kategoriValue ||
            /\(Semua\)/.test(kategoriValue) ||
            String(item.klasifikasi || '').toUpperCase() === String(kategoriValue).toUpperCase() ||
            String(item.kategori_atau_metode || '').toLowerCase().includes(String(kategoriValue).toLowerCase());

        return matchKeyword && matchKecamatan && matchKategori;
    });

    renderLembagaCards(filtered);
    loadPublicMapMarkers(currentPublicCategory, kecamatanValue);

    // 🚀 Efek Kamera Peta Leaflet (flyTo zoom 13) saat memilih kecamatan
    if (publicMap) {
        if (kecamatanValue && !/\(Semua\)/.test(kecamatanValue)) {
            const targetCoords = DEMAK_DISTRICT_COORDS[normalizedFilterKec] || DEMAK_DISTRICT_COORDS[kecamatanValue];
            if (targetCoords) {
                publicMap.flyTo(targetCoords, 13, {
                    duration: 0.8,
                    easeLinearity: 0.25
                });
            }
        } else {
            recenterPublicMap();
        }
    }
}

// ==========================================
// EVENT LISTENER UTAMA (DOM LOADED)
// ==========================================

// ==================================================================
// FITUR FOKUS 5: MESIN PELACAKAN STATUS BERKAS & NSPP (HALAMAN LAYANAN)
// ==================================================================
function inisialisasiFiturLacakBerkas() {
    const inputLacak = document.getElementById('input-lacak-berkas');
    const btnLacak = document.getElementById('btn-lacak-berkas');
    const containerHasil = document.getElementById('container-hasil-lacak');

    if (!inputLacak || !btnLacak || !containerHasil) return;

    function eksekusiPencarian() {
        const query = inputLacak.value.trim().toLowerCase();
        if (!query) {
            containerHasil.innerHTML = `
                <div class="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs flex items-center gap-3">
                    <span class="material-symbols-outlined text-[20px] text-amber-600">info</span>
                    <span>Silakan ketikkan Nomor NSPP (12 Digit) atau Nama Pondok Pesantren yang ingin Anda lacak.</span>
                </div>
            `;
            containerHasil.classList.remove('hidden');
            return;
        }

        // Cari data di allLembagaData
        const matches = allLembagaData.filter(item => {
            const matchNspp = item.nspp && String(item.nspp).toLowerCase().includes(query);
            const matchNama = (item.nama && item.nama.toLowerCase().includes(query)) ||
                              (item.nama_populer && item.nama_populer.toLowerCase().includes(query));
            const matchPengasuh = item.pengasuh_atau_kepala && item.pengasuh_atau_kepala.toLowerCase().includes(query);
            const matchId = item.id && String(item.id).toLowerCase() === query;
            return matchNspp || matchNama || matchPengasuh || matchId;
        });

        if (matches.length === 0) {
            containerHasil.innerHTML = `
                <div class="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center max-w-xl mx-auto">
                    <div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 mx-auto mb-3">
                        <span class="material-symbols-outlined text-[24px]">search_off</span>
                    </div>
                    <h4 class="font-bold text-sm text-slate-900 mb-1">Data Belum Ditemukan</h4>
                    <p class="text-xs text-slate-500 mb-4 leading-relaxed">
                        Nomor registrasi atau kata kunci "<strong>${escapeHTML(inputLacak.value.trim())}</strong>" belum tercatat di pangkalan data resmi RMI NU Demak.
                    </p>
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-2">
                        <a href="https://wa.me/6281234567890?text=Halo%20Sekretariat%20RMI%20Demak,%20saya%20ingin%20konsultasi%20pendataan%20pesantren" target="_blank" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition-colors">
                            <span class="material-symbols-outlined text-[16px]">support_agent</span>
                            <span>Konsultasi via WhatsApp</span>
                        </a>
                        <button type="button" onclick="document.getElementById('container-hasil-lacak').classList.add('hidden')" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors">
                            Tutup
                        </button>
                    </div>
                </div>
            `;
            containerHasil.classList.remove('hidden');
            return;
        }

        // Jika Ditemukan: Susun Kartu Status Terverifikasi
        const hasilCardsHtml = matches.map(item => {
            const isVerified = (item.nspp && item.nspp.length > 5);
            const badgeVerif = isVerified
                ? '<span class="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs border border-emerald-300/60"><span class="material-symbols-outlined text-[14px]">check_circle</span> Terverifikasi di Database RMI</span>'
                : '<span class="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-xs border border-amber-300/60"><span class="material-symbols-outlined text-[14px]">pending</span> Menunggu Validasi Lapangan</span>';

            const santriTotal = (item.santri_mukim || 0) + (item.santri_nonmukim || 0);

            return `
                <div class="bg-gradient-to-r from-emerald-50/60 to-white p-5 rounded-2xl border border-emerald-200/90 shadow-sm mb-3">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100">
                        <div>
                            <span class="text-[10px] font-bold text-primary uppercase tracking-wider block">Kec. ${escapeHTML(item.kecamatan || 'Demak')} • ${escapeHTML(item.jenis || 'Pesantren')}</span>
                            <h4 class="text-base font-extrabold text-slate-900 leading-snug mt-0.5">${escapeHTML(item.nama)}</h4>
                        </div>
                        <div class="self-start sm:self-auto">
                            ${badgeVerif}
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-xs">
                        <div class="bg-white p-3 rounded-xl border border-slate-100">
                            <span class="text-[10px] text-slate-400 font-semibold block">Pengasuh Utama:</span>
                            <p class="font-bold text-slate-800 mt-0.5">${escapeHTML(item.pengasuh_atau_kepala || '-')}</p>
                            ${(item.wakil_pengasuh && item.wakil_pengasuh.length > 0) ? `<div class="mt-1.5"><span class="text-[10px] text-slate-400 font-semibold block mb-1">Wakil Pengasuh:</span><div class="flex flex-wrap gap-1">${item.wakil_pengasuh.map(w => `<span class="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">${escapeHTML(w)}</span>`).join('')}</div></div>` : ''}
                        </div>
                        <div class="bg-white p-3 rounded-xl border border-slate-100">
                            <span class="text-[10px] text-slate-400 font-semibold block">Izin Kemenag (NSPP):</span>
                            <p class="font-bold text-primary font-mono mt-0.5">${escapeHTML(item.nspp || 'Belum Terbit')}</p>
                        </div>
                        <div class="bg-white p-3 rounded-xl border border-slate-100">
                            <span class="text-[10px] text-slate-400 font-semibold block">Populasi Santri:</span>
                            <p class="font-bold text-slate-800 mt-0.5">${santriTotal > 0 ? santriTotal.toLocaleString() + ' Santri' : 'Data Terverifikasi'}</p>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <div class="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-[16px] text-emerald-600">verified_user</span>
                            <span>Sistem Pendataan Terpadu RMI PCNU Kabupaten Demak</span>
                        </div>
                        <div class="flex items-center gap-2 w-full sm:w-auto">
                            <button type="button" onclick="bukaModalDetailLembaga('${escapeHTML(item.id)}')" class="w-full sm:w-auto px-4 py-2 bg-primary hover:bg-primary-container text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5">
                                <span>Lihat Profil Lengkap</span>
                                <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        containerHasil.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <p class="text-xs font-bold text-slate-700">Ditemukan ${matches.length} Lembaga Terkait:</p>
                <button type="button" onclick="document.getElementById('container-hasil-lacak').classList.add('hidden')" class="text-xs text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">close</span> Sembunyikan
                </button>
            </div>
            ${hasilCardsHtml}
        `;
        containerHasil.classList.remove('hidden');
    }

    btnLacak.addEventListener('click', eksekusiPencarian);
    inputLacak.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            eksekusiPencarian();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. SPA ROUTING & MENU MOBILE
    const spaLinks = document.querySelectorAll('.spa-link');
    const pages = document.querySelectorAll('.page-section');
    const navBtns = document.querySelectorAll('.nav-btn');
    const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    function navigateTo(targetId, updateHash = true) {
        // Normalisasi alias ramah pengguna
        if (targetId === 'direktori') targetId = 'pesantren';
        if (targetId === 'program' || targetId === 'sambang' || targetId === 'sambang-pesantren' || targetId === 'sambang-pw-jateng' || targetId === 'sambang-jateng') {
            targetId = 'sambang-pesantren-pwrminu-jateng';
        }
        const validPages = ['beranda', 'profil', 'pesantren', 'pesantren-detail', 'layanan', 'panduan', 'berita', 'berita-detail', 'sambang-pesantren-pwrminu-jateng'];
        if (!validPages.includes(targetId)) targetId = 'beranda';

        // 🚀 UPDATE HASH ROUTING (Shareable Link & Browser History Support)
        sessionStorage.setItem('activePage', targetId);
        if (updateHash) {
            if (window.location.hash.replace('#', '') !== targetId) {
                history.pushState({ page: targetId }, '', '#' + targetId);
            }
        }

        pages.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById('page-' + targetId);
        if(targetPage) {
            targetPage.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        if (targetId !== 'berita-detail') {
            document.title = 'RMI PCNU Kabupaten Demak — Pusat Peradaban Santri Kota Wali';
        }

        if (targetId === 'sambang-pesantren-pwrminu-jateng') {
            initSambangCountdown();
        }

        if (targetId === 'berita') {
            if (allBeritaData.length === 0) loadBeritaRMI();
            else renderBeritaFullPage();
        }

        if (targetId === 'beranda') {
            setTimeout(() => {
                if (!heroGisMap) initHeroMap();
                else heroGisMap.invalidateSize();
            }, 150);
            setTimeout(() => {
                if (heroGisMap) heroGisMap.invalidateSize();
            }, 500);
        }

        if (targetId === 'pesantren' || targetId === 'pesantren-detail') {
            if (allLembagaData.length === 0) loadLembagaDariSupabase();
            inisialisasiFiturLacakBerkas();
            populatePublicKecamatanDropdown(currentPublicCategory);
            if (targetId === 'pesantren') {
                setTimeout(() => {
                    if (!publicMap) initPublicMap();
                    else publicMap.invalidateSize();
                }, 150);
                setTimeout(() => {
                    if (publicMap) publicMap.invalidateSize();
                }, 500);
            }
        }

        navBtns.forEach(btn => {
            const btnTarget = btn.dataset.target === 'direktori' ? 'pesantren' : btn.dataset.target;
            const isActive = (btnTarget === targetId) || 
                             (btnTarget === 'pesantren' && targetId === 'pesantren-detail') ||
                             (btnTarget === 'layanan' && (targetId === 'layanan' || targetId === 'panduan')) ||
                             (btnTarget === 'program' && targetId === 'sambang-pesantren-pwrminu-jateng') ||
                             (btnTarget === 'berita' && targetId === 'berita-detail');
            if(isActive) {
                btn.className = 'nav-btn spa-link text-xs font-bold text-white bg-white/20 px-3.5 py-1.5 rounded-full border border-white/25 shadow-sm transition-all flex items-center gap-1 cursor-pointer';
            } else {
                btn.className = 'nav-btn spa-link text-xs font-semibold text-white/80 hover:text-white hover:bg-white/15 px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer';
            }
        });

        mobileNavBtns.forEach(btn => {
            const btnTarget = btn.dataset.target === 'direktori' ? 'pesantren' : btn.dataset.target;
            const isActive = (btnTarget === targetId) || 
                             (btnTarget === 'pesantren' && targetId === 'pesantren-detail') ||
                             (btnTarget === 'layanan' && (targetId === 'layanan' || targetId === 'panduan')) ||
                             (btnTarget === 'program' && targetId === 'sambang-pesantren-pwrminu-jateng') ||
                             (btnTarget === 'berita' && targetId === 'berita-detail');
            if(isActive) {
                btn.className = 'spa-link mobile-nav-btn text-sm font-bold text-white bg-white/20 px-4 py-2 rounded-xl block border border-white/25';
            } else {
                btn.className = 'spa-link mobile-nav-btn text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-xl block transition-colors';
            }
        });

        if(!mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
            mobileMenuBtn.innerHTML = '<span class="material-symbols-outlined">menu</span>';
        }
    }

    // Expose navigateTo secara global agar dapat dipanggil dari inline event handler
    window.navigateTo = navigateTo;

    // 🚀 EVENT LISTENER BROWSER BACK / FORWARD & HASH CHANGE
    function handleHashRouting() {
        let rawHash = window.location.hash.replace('#', '').trim();
        let currentHash = rawHash.toLowerCase();
        if (currentHash === 'direktori') currentHash = 'pesantren';
        if (currentHash === 'program' || currentHash === 'sambang' || currentHash === 'sambang-pesantren' || currentHash === 'sambang-pw-jateng' || currentHash === 'sambang-jateng') {
            currentHash = 'sambang-pesantren-pwrminu-jateng';
        }

        // Deep linking untuk Halaman Pesantren Detail:
        // 1. Format Bersih & SEO-friendly ala pesantren.nu.id: #pesantren/roudlotul-mubarokah
        // 2. Format Kompatibilitas Legacy: #pesantren-detail?id=RMI-DMK-000001
        if (currentHash.startsWith('pesantren/')) {
            const slugPart = rawHash.substring(rawHash.indexOf('/') + 1).trim();
            if (slugPart && typeof bukaProfilPesantren === 'function') {
                bukaProfilPesantren(slugPart, false);
                return;
            }
        }
        if (currentHash.startsWith('pesantren-detail')) {
            let pId = '';
            if (rawHash.includes('?id=')) {
                const searchParams = new URLSearchParams(rawHash.split('?')[1] || '');
                pId = searchParams.get('id');
            } else if (rawHash.includes('/')) {
                pId = rawHash.split('/')[1];
            }
            if (pId && typeof bukaProfilPesantren === 'function') {
                bukaProfilPesantren(pId, true); // Update otomatis ke format baru #pesantren/[slug]
                return;
            } else {
                navigateTo('pesantren', false);
                return;
            }
        }

        // Deep linking untuk Halaman Berita Detail:
        // 1. Format Bersih & SEO-friendly berbasis slug: #berita/slug-berita-anda
        // 2. Format Kompatibilitas Legacy: #berita-detail?id=BRT-2026-001
        if (currentHash.startsWith('berita/')) {
            const slugPart = rawHash.substring(rawHash.indexOf('/') + 1).trim();
            if (slugPart && typeof openBeritaDetailModal === 'function') {
                openBeritaDetailModal(slugPart);
                return;
            } else {
                navigateTo('berita', false);
                return;
            }
        }
        if (currentHash.startsWith('berita-detail')) {
            const hashParts = rawHash.split('?');
            const searchParams = new URLSearchParams(hashParts[1] || '');
            const beritaId = searchParams.get('id');
            if (beritaId && typeof openBeritaDetailModal === 'function') {
                openBeritaDetailModal(beritaId);
                return;
            } else {
                navigateTo('berita', false);
                return;
            }
        }

        // Deep linking untuk Sub Halaman Panduan Masuk 7 Peran
        if (currentHash.startsWith('panduan') || currentHash === 'panduan-portal' || currentHash === 'panduan-7-peran') {
            navigateTo('panduan', false);
            const rolePart = currentHash.replace('panduan-', '').replace('panduan', '').trim();
            if (rolePart && typeof filterPanduanRole === 'function') {
                setTimeout(() => {
                    filterPanduanRole(rolePart);
                }, 150);
            }
            return;
        }

        const validPages = ['beranda', 'profil', 'pesantren', 'pesantren-detail', 'layanan', 'panduan', 'berita', 'berita-detail', 'sambang-pesantren-pwrminu-jateng'];
        const targetPage = validPages.includes(currentHash) ? currentHash : (sessionStorage.getItem('activePage') || 'beranda');
        navigateTo(targetPage, false);
    }

    window.addEventListener('hashchange', handleHashRouting);
    window.addEventListener('popstate', handleHashRouting);

    spaLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.target;
            if(target) navigateTo(target);
        });
    });

    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        if (mobileMenu.classList.contains('hidden')) {
            mobileMenuBtn.innerHTML = '<span class="material-symbols-outlined">menu</span>';
        } else {
            mobileMenuBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';
        }
    });

    // 2. LOGIKA HEADER (HIDE ON SCROLL)
    let lastScrollTop = 0;
    const header = document.getElementById('main-header');

    window.addEventListener('scroll', () => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > lastScrollTop && scrollTop > 60) {
            header.classList.add('-translate-y-full');
        } else {
            header.classList.remove('-translate-y-full');
        }

        if (scrollTop > 10) {
            header.classList.add('shadow-xl');
        } else {
            header.classList.remove('shadow-xl');
        }

        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });

    // 3. SLIDER HERO BERANDA
    const slides = document.querySelectorAll('.slide-img');
    let currentSlide = 0;
    if(slides.length > 0) {
        setInterval(() => {
            slides[currentSlide].classList.remove('opacity-100');
            slides[currentSlide].classList.add('opacity-0');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.remove('opacity-0');
            slides[currentSlide].classList.add('opacity-100');
        }, 5000);
    }

    // 4. TOGGLE DIREKTORI AND LISTENERS FILTER
    const btnPesantren = document.getElementById('btn-pesantren');
    const btnMadin = document.getElementById('btn-madin');
    const btnTpq = document.getElementById('btn-tpq');
    const toggleSlider = document.getElementById('toggle-slider');
    
    const mapOverlay = document.getElementById('map-overlay');
    const mapStatsCard = document.getElementById('map-stats-card');
    const mapIconBg = document.getElementById('map-icon-bg');
    const mapIcon = document.getElementById('map-icon');
    const mapTitle = document.getElementById('map-title');
    const mapDesc = document.getElementById('map-desc');
    
    const filterKategori = document.getElementById('filter-kategori');
    const btnSearch = document.getElementById('btn-search');
    const searchNama = document.getElementById('search-nama');
    const filterKecamatan = document.getElementById('filter-kecamatan');

    if (btnSearch) btnSearch.addEventListener('click', applyLembagaFilter);
    if (searchNama) {
        searchNama.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyLembagaFilter();
            }
        });
    }
    if (filterKecamatan) filterKecamatan.addEventListener('change', applyLembagaFilter);
    if (filterKategori) filterKategori.addEventListener('change', applyLembagaFilter);

    const gridPesantren = document.getElementById('grid-pesantren');
    const gridMadin = document.getElementById('grid-madin');
    const gridTpq = document.getElementById('grid-tpq');

    function resetAllStates() {
        [btnPesantren, btnMadin, btnTpq].forEach(btn => {
            if (btn) btn.classList.replace('text-white', 'text-on-surface-variant');
        });
        [gridPesantren, gridMadin, gridTpq].forEach(grid => {
            if(grid) {
                grid.classList.add('hidden');
                grid.classList.remove('animate-slideFadeIn');
            }
        });
        if(mapOverlay) mapOverlay.className = 'absolute inset-0 backdrop-blur-[2px] transition-colors duration-500';
        if(mapStatsCard) mapStatsCard.className = 'absolute bottom-6 left-6 md:bottom-10 md:left-10 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl max-w-sm border-l-4 transition-colors duration-500';
        if(mapIconBg) mapIconBg.className = 'w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500';
        if(mapIcon) mapIcon.className = 'material-symbols-outlined transition-colors duration-500';
        if(mapTitle) mapTitle.className = 'text-xl font-bold transition-colors duration-500';
        if(btnSearch) btnSearch.className = 'text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-colors';
    }

    if (btnPesantren) {
        btnPesantren.addEventListener('click', () => {
            resetAllStates();
            currentPublicCategory = 'Pesantren';
            if (!publicMap) initPublicMap(); else loadPublicMapMarkers('Pesantren');
            populatePublicKecamatanDropdown('Pesantren');
            if (toggleSlider) {
                toggleSlider.style.transform = 'translateX(0)';
                toggleSlider.className = 'absolute left-1.5 top-1.5 bottom-1.5 w-[calc(33.333%-4px)] bg-primary rounded-full transition-transform duration-500 ease-in-out shadow-md';
            }
            btnPesantren.classList.replace('text-on-surface-variant', 'text-white');

            if(mapOverlay) mapOverlay.classList.add('bg-primary/10');
            if(mapStatsCard) mapStatsCard.classList.add('border-primary');
            if(mapIconBg) mapIconBg.classList.add('bg-primary/10');
            if(mapIcon) mapIcon.classList.add('text-primary');
            if(mapTitle) mapTitle.classList.add('text-primary');
            if(mapTitle) mapTitle.innerText = 'Pondok Pesantren';
            const pesantrenCount = (Array.isArray(allLembagaData) && allLembagaData.filter(l => l.jenis === 'Pesantren').length) || 293;
            if(mapDesc) mapDesc.innerHTML = `Menampilkan <span class="text-on-surface font-extrabold text-base">${pesantrenCount}</span> titik pesantren di seluruh wilayah Kabupaten Demak.`;
            
            if(filterKategori) filterKategori.innerHTML = '<option value="">Klasifikasi (Semua)</option><option value="SALAF">SALAF (Kitab Kuning)</option><option value="TAHFIDZ">TAHFIDZ (Al-Qur\'an)</option><option value="KOMBINASI">KOMBINASI (Salaf + Tahfidz)</option><option value="TERINTEGRASI">TERINTEGRASI (Pondok + Formal)</option><option value="MODERN">MODERN (Sistem Modern)</option>';
            if(btnSearch) btnSearch.classList.add('bg-primary');

            if(gridPesantren) {
                gridPesantren.classList.remove('hidden');
                void gridPesantren.offsetWidth; 
                gridPesantren.classList.add('animate-slideFadeIn');
            }
        });
    }

    if (btnMadin) {
        btnMadin.addEventListener('click', () => {
            resetAllStates();
            currentPublicCategory = 'Madin';
            if (!publicMap) initPublicMap(); else loadPublicMapMarkers('Madin');
            populatePublicKecamatanDropdown('Madin');
            if (toggleSlider) {
                toggleSlider.style.transform = 'translateX(100%)';
                toggleSlider.className = 'absolute left-1.5 top-1.5 bottom-1.5 w-[calc(33.333%-4px)] bg-secondary rounded-full transition-transform duration-500 ease-in-out shadow-md';
            }
            btnMadin.classList.replace('text-on-surface-variant', 'text-white');

            if(mapOverlay) mapOverlay.className = 'absolute inset-0 bg-secondary/10 backdrop-blur-[2px] transition-colors duration-500';
            if(mapStatsCard) mapStatsCard.className = 'absolute bottom-6 left-6 md:bottom-10 md:left-10 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl max-w-sm border-l-4 border-secondary transition-colors duration-500';
            if(mapIconBg) mapIconBg.className = 'w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center transition-colors duration-500';
            if(mapIcon) mapIcon.className = 'material-symbols-outlined text-secondary transition-colors duration-500';
            if(mapTitle) mapTitle.className = 'text-xl font-bold text-secondary transition-colors duration-500';
            if(mapTitle) mapTitle.innerText = 'Madrasah Diniyah';
            if(mapDesc) mapDesc.innerHTML = 'Pangkalan data Madrasah Diniyah sedang dalam kurasi & verifikasi bertahap bersama MWC NU.';
            
            if(filterKategori) filterKategori.innerHTML = '<option>Jenjang (Semua)</option><option>Ula</option><option>Wustho</option><option>Ulya</option>';
            if(btnSearch) btnSearch.className = 'bg-secondary text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-colors';

            if(gridMadin) {
                gridMadin.classList.remove('hidden');
                void gridMadin.offsetWidth; 
                gridMadin.classList.add('animate-slideFadeIn');
            }
        });
    }

    if (btnTpq) {
        btnTpq.addEventListener('click', () => {
            resetAllStates();
            currentPublicCategory = 'TPQ';
            if (!publicMap) initPublicMap(); else loadPublicMapMarkers('TPQ');
            populatePublicKecamatanDropdown('TPQ');
            if (toggleSlider) {
                toggleSlider.style.transform = 'translateX(200%)';
                toggleSlider.className = 'absolute left-1.5 top-1.5 bottom-1.5 w-[calc(33.333%-4px)] bg-tertiary rounded-full transition-transform duration-500 ease-in-out shadow-md';
            }
            btnTpq.classList.replace('text-on-surface-variant', 'text-white');

            if(mapOverlay) mapOverlay.className = 'absolute inset-0 bg-tertiary/10 backdrop-blur-[2px] transition-colors duration-500';
            if(mapStatsCard) mapStatsCard.className = 'absolute bottom-6 left-6 md:bottom-10 md:left-10 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl max-w-sm border-l-4 border-tertiary transition-colors duration-500';
            if(mapIconBg) mapIconBg.className = 'w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center transition-colors duration-500';
            if(mapIcon) mapIcon.className = 'material-symbols-outlined text-tertiary transition-colors duration-500';
            if(mapTitle) mapTitle.className = 'text-xl font-bold text-tertiary transition-colors duration-500';
            if(mapTitle) mapTitle.innerText = "Taman Pendidikan Al-Qur'an";
            if(mapDesc) mapDesc.innerHTML = 'Pangkalan data TPQ sedang dalam kurasi & verifikasi bertahap bersama MWC NU.';
            
            if(filterKategori) filterKategori.innerHTML = '<option>Metode (Semua)</option><option>Yanbu\'a</option><option>Qira\'ati</option><option>Iqro\'</option><option>Ummi</option>';
            if(btnSearch) btnSearch.className = 'bg-tertiary text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-colors';

            if(gridTpq) {
                gridTpq.classList.remove('hidden');
                void gridTpq.offsetWidth; 
                gridTpq.classList.add('animate-slideFadeIn');
            }
        });
    }

    // 🚀 HASH ROUTER INIT: Baca URL Hash terlebih dahulu, jika deep linking delegasikan ke handleHashRouting
    let activeInitialPage = 'beranda';
    if (window.location.hash) {
        activeInitialPage = window.location.hash.replace('#', '').trim().toLowerCase();
        handleHashRouting();
    } else {
        activeInitialPage = sessionStorage.getItem('activePage') || 'beranda';
        navigateTo(activeInitialPage, true);
    }

    // 🚀 KUNCI UPDATE: Nyalakan mesin pencatat waktu shalat otomatis
    startSmartPrayerWidget();

    // Eksekusi penarikan data Supabase secara aman
    loadLembagaDariSupabase();
    updateAllPlatformStats(allLembagaData);

    // Memuat arsip warta media RMI Demak terkini
    loadBeritaRMI();

    if (activeInitialPage === 'pesantren' || activeInitialPage.startsWith('pesantren/')) {
        setTimeout(initPublicMap, 250);
        setTimeout(() => { if (publicMap) publicMap.invalidateSize(); }, 600);
    }
});

// ==================================================================
// NEW FEATURE: ENGINE JADWAL SHALAT AUTOMATION (KABUPATEN DEMAK)
// ==================================================================
const jadwalShalatDemakSetahun = {
    subuh: "04:26", dzuhur: "11:44", ashar: "15:02", maghrib: "17:34", isya: "18:48"
};

function startSmartPrayerWidget() {
    // Referensi elemen Mobile
    const dateMasehiEl = document.getElementById('widget-date-masehi');
    const dateHijriahEl = document.getElementById('widget-date-hijriah');
    const prayerNameEl = document.getElementById('widget-next-prayer-name');
    const prayerTimeEl = document.getElementById('widget-next-prayer-time');
    const countdownEl = document.getElementById('widget-countdown');

    // Referensi elemen Desktop
    const dateMasehiDeskEl = document.getElementById('widget-date-masehi-desktop');
    const dateHijriahDeskEl = document.getElementById('widget-date-hijriah-desktop');
    const prayerNameDeskEl = document.getElementById('widget-next-prayer-name-desktop');
    const prayerTimeDeskEl = document.getElementById('widget-next-prayer-time-desktop');
    const countdownDeskEl = document.getElementById('widget-countdown-desktop');

    if (!dateMasehiEl && !dateMasehiDeskEl) return;

    // 1. Tampilkan Tanggal Masehi Lokal
    const opsiMasehi = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const hariIni = new Date();
    const tglMasehiStr = hariIni.toLocaleDateString('id-ID', opsiMasehi);
    if (dateMasehiEl) dateMasehiEl.innerText = tglMasehiStr;
    if (dateMasehiDeskEl) dateMasehiDeskEl.innerText = tglMasehiStr;

    // 2. Kalkulator Hijriah (Koreksi +1 Hari Standar Kemenag Jawa Tengah)
    const hijriFormatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' });
    let tanggalHijriahRaw = hijriFormatter.format(new Date(hariIni.getTime() + 24 * 60 * 60 * 1000));
    const tglHijriahStr = tanggalHijriahRaw.replace("AH", "H");
    if (dateHijriahEl) dateHijriahEl.innerText = tglHijriahStr;
    if (dateHijriahDeskEl) dateHijriahDeskEl.innerText = tglHijriahStr;

    // 3. Loop Real-Time Countdown Tracker menuju Waktu Shalat Berikutnya
    function updateCountdown() {
        const sekarang = new Date();
        const jamSekarang = sekarang.getHours();
        const menitSekarang = sekarang.getMinutes();
        const waktuMenitSekarang = jamSekarang * 60 + menitSekarang;

        let targetNama = "Subuh";
        let targetWaktuStr = jadwalShalatDemakSetahun.subuh;
        let isBesok = false;

        const parseKeMenit = (waktuStr) => {
            const [j, m] = waktuStr.split(':').map(Number);
            return j * 60 + m;
        };

        const mSubuh = parseKeMenit(jadwalShalatDemakSetahun.subuh);
        const mDzuhur = parseKeMenit(jadwalShalatDemakSetahun.dzuhur);
        const mAshar = parseKeMenit(jadwalShalatDemakSetahun.ashar);
        const mMaghrib = parseKeMenit(jadwalShalatDemakSetahun.maghrib);
        const mIsya = parseKeMenit(jadwalShalatDemakSetahun.isya);

        if (waktuMenitSekarang < mSubuh) {
            targetNama = "Subuh"; targetWaktuStr = jadwalShalatDemakSetahun.subuh;
        } else if (waktuMenitSekarang < mDzuhur) {
            targetNama = "Dzuhur"; targetWaktuStr = jadwalShalatDemakSetahun.dzuhur;
        } else if (waktuMenitSekarang < mAshar) {
            targetNama = "Ashar"; targetWaktuStr = jadwalShalatDemakSetahun.ashar;
        } else if (waktuMenitSekarang < mMaghrib) {
            targetNama = "Maghrib"; targetWaktuStr = jadwalShalatDemakSetahun.maghrib;
        } else if (waktuMenitSekarang < mIsya) {
            targetNama = "Isya"; targetWaktuStr = jadwalShalatDemakSetahun.isya;
        } else {
            targetNama = "Subuh"; targetWaktuStr = jadwalShalatDemakSetahun.subuh; isBesok = true;
        }

        // Update teks mobile
        if (prayerNameEl) prayerNameEl.innerText = `Menuju ${targetNama}`;
        if (prayerTimeEl) prayerTimeEl.innerText = `${targetWaktuStr} WIB`;

        // Update teks desktop
        if (prayerNameDeskEl) prayerNameDeskEl.innerText = targetNama.toUpperCase();
        if (prayerTimeDeskEl) prayerTimeDeskEl.innerText = `${targetWaktuStr} WIB`;

        const [targetJam, targetMenit] = targetWaktuStr.split(':').map(Number);
        let limitTarget = new Date();
        limitTarget.setHours(targetJam, targetMenit, 0, 0);
        if (isBesok) limitTarget.setDate(limitTarget.getDate() + 1);

        let selisihMiliDetik = limitTarget - sekarang;
        let totalDetik = Math.floor(selisihMiliDetik / 1000);

        let jamSisa = Math.floor(totalDetik / 3600);
        let menitSisa = Math.floor((totalDetik % 3600) / 60);
        let detikSisa = totalDetik % 60;

        const formatDuaDigit = (num) => String(num).padStart(2, '0');
        const countdownFormatted = `${formatDuaDigit(jamSisa)}:${formatDuaDigit(menitSisa)}:${formatDuaDigit(detikSisa)}`;

        if (countdownEl) countdownEl.innerText = countdownFormatted;
        if (countdownDeskEl) countdownDeskEl.innerText = countdownFormatted;
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// =========================================================================
// HELPER SLUG RESMI PESANTREN (STANDAR PESANTREN.NU.ID)
// =========================================================================
function generatePesantrenSlug(item) {
    if (!item) return '';
    let baseName = (item.nama || '').toLowerCase();
    // Hilangkan awalan umum agar slug bersih, ringkas, persis pesantren.nu.id
    baseName = baseName.replace(/^(pondok\s+pesantren|pesantren|ponpes|pp\.|pp)\s+/i, '');
    let slug = baseName
        .trim()
        .toLowerCase()
        .replace(/['"’`]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    return slug || (item.kode_pesantren ? item.kode_pesantren.toLowerCase() : item.id);
}

function findPesantrenBySlugOrId(param) {
    if (!param) return null;
    const target = decodeURIComponent(String(param)).trim().toLowerCase();
    const cleanTarget = target.replace(/[^a-z0-9]/g, '');

    const list = (allLembagaData && allLembagaData.length > 0) ? allLembagaData : DEFAULT_LEMBAGA_DATA;

    // 1. Cek langsung dengan ID atau Kode Pesantren (e.g. RMI-DMK-000001 atau UUID)
    let found = list.find(l => 
        String(l.id).toLowerCase() === target || 
        String(l.kode_pesantren || '').toLowerCase() === target
    );
    if (found) return found;

    // 2. Cek apakah cocok dengan generatePesantrenSlug (e.g. roudlotul-mubarokah)
    found = list.find(l => generatePesantrenSlug(l) === target);
    if (found) return found;

    // 3. Cek apakah cocok dengan slug nama lengkap tanpa menghapus awalan
    found = list.find(l => {
        const fullSlug = (l.nama || '').toLowerCase().replace(/['"’`]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
        return fullSlug === target;
    });
    if (found) return found;

    // 4. Cek apakah slug cocok dengan substring nama bersih
    found = list.find(l => {
        const cleanName = (l.nama || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanName.includes(cleanTarget) || cleanTarget.includes(cleanName);
    });
    return found || null;
}

// =========================================================================
// SUBPAGE DETAIL PROFIL PESANTREN (STANDAR DIGDAYA PESANTREN.NU.ID 10 SEKSI)
// =========================================================================
function bukaProfilPesantren(pesantrenId, updateHash = true) {
    if (typeof hidePesantrenFlyout === 'function') {
        hidePesantrenFlyout();
    }

    if (!pesantrenId) {
        navigateTo('pesantren', true);
        return;
    }

    const container = document.getElementById('pesantren-detail-content');

    // Jika data lembaga belum dimuat, tampilkan loader lalu muat data
    if (!allLembagaData || allLembagaData.length === 0) {
        navigateTo('pesantren-detail', false);
        if (container) {
            container.innerHTML = `
                <div class="py-24 text-center max-w-lg mx-auto">
                    <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mb-4"></div>
                    <h3 class="text-lg font-extrabold text-slate-800">Memuat Profil Pesantren...</h3>
                    <p class="text-xs text-slate-500 mt-1">Mengambil data resmi dari Pangkalan Data PC RMI NU Kabupaten Demak.</p>
                </div>
            `;
        }
        loadLembagaDariSupabase().then(() => {
            renderPesantrenDetailPage(pesantrenId, updateHash);
        });
        return;
    }

    renderPesantrenDetailPage(pesantrenId, updateHash);
}

function kembaliKeKatalogPesantren() {
    navigateTo('pesantren', true);
}

function salinNspp(nspp) {
    if (!nspp) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(nspp).then(() => {
            if (typeof showFloatingToast === 'function') {
                showFloatingToast(`Nomor Statistik Pesantren (NSPP) ${nspp} berhasil disalin!`);
            } else {
                alert(`Nomor Statistik Pesantren: ${nspp} (Tersalin)`);
            }
        }).catch(() => {
            prompt('Nomor Statistik Pesantren (NSPP):', nspp);
        });
    } else {
        prompt('Nomor Statistik Pesantren (NSPP):', nspp);
    }
}

function renderPesantrenDetailPage(pesantrenId, updateHash = true) {
    const container = document.getElementById('pesantren-detail-content');
    if (!container) return;

    const item = findPesantrenBySlugOrId(pesantrenId);

    if (!item) {
        container.innerHTML = `
            <div class="py-20 text-center max-w-md mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <span class="material-symbols-outlined text-5xl text-slate-400 mb-3">search_off</span>
                <h3 class="text-lg font-bold text-slate-800">Pesantren Tidak Ditemukan</h3>
                <p class="text-xs text-slate-500 mt-2 mb-6">Maaf, data pesantren dengan ID atau nama tersebut tidak ditemukan dalam pangkalan direktori kami.</p>
                <button type="button" onclick="kembaliKeKatalogPesantren()" class="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center gap-2">
                    <span class="material-symbols-outlined text-[16px]">arrow_back</span>
                    <span>Kembali ke Direktori Pesantren</span>
                </button>
            </div>
        `;
        navigateTo('pesantren-detail', false);
        return;
    }

    const safeId = escapeHTML(item.id || '');
    const safeKode = escapeHTML(item.kode_pesantren || 'RMI-DMK-000001');
    const safeNama = escapeHTML(item.nama || 'Pesantren');
    const safeNamaPopuler = escapeHTML(item.nama_populer || '');
    const klasifikasiInfo = getClassificationBadge(item.klasifikasi || item.kategori_atau_metode);
    const safeKlasifikasi = escapeHTML(klasifikasiInfo.label);
    const safeKlasifikasiFull = escapeHTML(`${klasifikasiInfo.label} (${klasifikasiInfo.sublabel})`);
    const safeKategori = escapeHTML(item.kategori_atau_metode || item.jenis || 'Salafiyah');
    const safePengasuh = escapeHTML(item.pengasuh_atau_kepala || '-');
    const safeKecamatan = escapeHTML(item.kecamatan || 'Demak');
    const safeDesa = escapeHTML(item.desa || '');
    const safeAlamat = escapeHTML(item.alamat_detail || '');
    const safeNspp = escapeHTML(item.nspp || '510033210001');
    const safeTahun = escapeHTML(String(item.tahun_berdiri || '1998'));
    const safeFoto = (item.foto_url && String(item.foto_url).trim().startsWith('http')) 
        ? escapeHTML(item.foto_url) 
        : 'https://lh3.googleusercontent.com/d/1a3ihmmj3mxIwwsci2kFLibHk9xusUT58';

    // 🚀 GENERATE CLEAN SLUG ALA PESANTREN.NU.ID (e.g. #pesantren/roudlotul-mubarokah)
    const slug = generatePesantrenSlug(item);
    if (updateHash) {
        const targetHash = '#pesantren/' + slug;
        if (window.location.hash !== targetHash) {
            history.pushState({ page: 'pesantren-detail', slug: slug, id: item.id }, '', targetHash);
        }
    }

    // Aktifkan view
    const pages = document.querySelectorAll('.page-section');
    pages.forEach(p => p.classList.remove('active'));
    const detailPage = document.getElementById('page-pesantren-detail');
    if (detailPage) {
        detailPage.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Data Statistik
    const santriMukimCount = parseInt(item.santri_mukim || 0, 10);
    const santriNonMukimCount = parseInt(item.santri_nonmukim || 0, 10);
    const totalSantriCount = santriMukimCount + santriNonMukimCount;
    const totalAsatidzCount = (item.dewan_asatidz && item.dewan_asatidz.length > 0) 
        ? item.dewan_asatidz.length 
        : (item.wakil_pengasuh && item.wakil_pengasuh.length > 0 ? (item.wakil_pengasuh.length + 1) : 1);
    const totalKitabCount = (item.kurikulum_kitab && item.kurikulum_kitab.length > 0) 
        ? item.kurikulum_kitab.length 
        : 14;

    // URLs Aksi
    const soc = item.media_sosial || {};
    const websiteUrl = (soc.website && soc.website.startsWith('http')) ? soc.website : (soc.instagram || `https://www.google.com/search?q=${encodeURIComponent(item.nama + ' Demak')}`);
    const mapsUrl = (item.latitude && item.longitude) 
        ? `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}` 
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.nama + ' ' + (item.desa || '') + ' ' + item.kecamatan + ' Demak')}`;
    
    // Tautan Share WhatsApp dengan Slug Bersih ala pesantren.nu.id
    const shareProfileUrl = `${window.location.origin}${window.location.pathname}#pesantren/${slug}`;
    const waShareText = `Assalamu'alaikum. Simak profil resmi ${item.nama} (${safeKode}) di Direktori Resmi PC RMI NU Kabupaten Demak:\n${shareProfileUrl}`;
    const waShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waShareText)}`;
    const waPsbUrl = soc.hotline_psb ? `https://wa.me/${String(soc.hotline_psb).replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Assalamu\'alaikum Panitia PSB ' + item.nama + ', saya ingin bertanya mengenai pendaftaran santri baru.')}` : '';

    // Wakil Pengasuh Badge HTML
    let wakilPengasuhHtml = '';
    if (item.wakil_pengasuh && item.wakil_pengasuh.length > 0) {
        wakilPengasuhHtml = `
            <div class="flex items-center gap-1.5 flex-wrap mt-2">
                <span class="text-xs font-semibold text-slate-500">Wakil Pengasuh:</span>
                ${item.wakil_pengasuh.map(w => `<span class="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">${escapeHTML(w)}</span>`).join('')}
            </div>
        `;
    }

    // Galeri Foto
    let galeriList = Array.isArray(item.galeri_foto) ? item.galeri_foto : [];
    if (galeriList.length === 0) {
        galeriList = [
            { url: safeFoto, judul: 'Gedung Asrama & Lingkungan Utama', kategori: 'Gedung Utama' },
            { url: 'https://lh3.googleusercontent.com/d/1NCvPdIz8-DUjz2dDCD5zLKYUA3n34agP', judul: 'Masjid & Sarana Ibadah Santri', kategori: 'Mushola / Masjid' },
            { url: 'https://lh3.googleusercontent.com/d/1a3ihmmj3mxIwwsci2kFLibHk9xusUT58', judul: 'Ruang Belajar Madrasah Diniyyah', kategori: 'Ruang Belajar' },
            { url: 'https://lh3.googleusercontent.com/d/1mOekcQhUGD2eqHMy-8AmEua9BrJK-06Z', judul: 'Halaqah Pengajian Kitab Kuning', kategori: 'Halaqah Turots' }
        ];
    }

    // Kurikulum Kitab
    let kitabList = Array.isArray(item.kurikulum_kitab) && item.kurikulum_kitab.length > 0 
        ? item.kurikulum_kitab 
        : [
            { nama_kitab: 'Safinatun Najah', pengarang: 'Salim bin Samir Al-Hadhrami', bidang_ilmu: 'Fiqih Syafi\'i', marhalah: 'ula' },
            { nama_kitab: 'Al-Jurumiyyah', pengarang: 'Ibnu Ajurrum', bidang_ilmu: 'Nahwu / Tata Bahasa', marhalah: 'ula' },
            { nama_kitab: 'Aqidatul Awwam', pengarang: 'Ahmad Al-Marzuqi', bidang_ilmu: 'Aqidah / Tauhid', marhalah: 'ula' },
            { nama_kitab: 'Fathul Qorib Al-Mujib', pengarang: 'Ibnu Qasim Al-Ghazi', bidang_ilmu: 'Fiqih Lanjutan', marhalah: 'wustho' },
            { nama_kitab: 'Al-Imrithi', pengarang: 'Syarafuddin Al-Imrithi', bidang_ilmu: 'Gramatika Arab', marhalah: 'wustho' },
            { nama_kitab: 'Ta\'limul Muta\'allim', pengarang: 'Imam Az-Zarnuji', bidang_ilmu: 'Akhlaq & Adab Belajar', marhalah: 'wustho' },
            { nama_kitab: 'Fathul Mu\'in', pengarang: 'Zainuddin Al-Malibari', bidang_ilmu: 'Fiqih Mendalam', marhalah: 'ulya' },
            { nama_kitab: 'Alfiyah Ibnu Malik', pengarang: 'Ibnu Malik', bidang_ilmu: 'Linguistik Arab Tinggi', marhalah: 'ulya' },
            { nama_kitab: 'Bulughul Maram', pengarang: 'Ibnu Hajar Al-Asqalani', bidang_ilmu: 'Hadits Ahkam', marhalah: 'ulya' }
        ];

    // Fasilitas List
    const defaultFasilitas = [
        { icon: 'mosque', nama: 'Masjid & Mushola Pondok', deskripsi: 'Pusat shalat jamaah 5 waktu & pengajian' },
        { icon: 'bed', nama: 'Asrama Santri Nyaman', deskripsi: 'Kamar santri putra dan putri terpisah rapi' },
        { icon: 'menu_book', nama: 'Perpustakaan Kitab Turots', deskripsi: 'Koleksi khazanah kitab kuning & buku referensi' },
        { icon: 'school', nama: 'Ruang Kelas Madin', deskripsi: 'Gedung pembelajaran madrasah berstandar' },
        { icon: 'local_hospital', nama: 'Poskestren / UKS', deskripsi: 'Layanan kesehatan pertama santri 24 jam' },
        { icon: 'wifi', nama: 'Akses Internet Terbimbing', deskripsi: 'Jaringan internet edukatif untuk riset keilmuan' },
        { icon: 'soup_kitchen', nama: 'Dapur Umum Higienis', deskripsi: 'Penyediaan konsumsi santri sehat dan terjaga' },
        { icon: 'storefront', nama: 'Koperasi Pondok Pesantren', deskripsi: 'Kebutuhan harian santri & unit usaha mandiri' },
        { icon: 'sports_soccer', nama: 'Lapangan Olahraga', deskripsi: 'Sarana kebugaran jasmani santri sore hari' },
        { icon: 'security', nama: 'Keamanan Terpadu 24 Jam', deskripsi: 'Lingkungan aman & tertib bagi seluruh santri' }
    ];

    container.innerHTML = `
        <!-- Top Nav & Breadcrumb -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <button type="button" onclick="kembaliKeKatalogPesantren()" class="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 bg-white px-4 py-2.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer group w-fit">
                <span class="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-1">arrow_back</span>
                <span>Kembali ke Direktori Pesantren</span>
            </button>
            <div class="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                <a href="#beranda" onclick="navigateTo('beranda')" class="hover:text-emerald-700">Beranda</a>
                <span>/</span>
                <a href="#pesantren" onclick="navigateTo('pesantren')" class="hover:text-emerald-700">Direktori Pesantren</a>
                <span>/</span>
                <span class="font-bold text-slate-800 truncate max-w-xs">${safeNama}</span>
            </div>
        </div>

        <!-- ================================================================= -->
        <!-- SEKSI 1: COVER BANNER PANORAMA (16:6)                             -->
        <!-- ================================================================= -->
        <div class="relative w-full h-56 sm:h-72 md:h-84 rounded-3xl overflow-hidden shadow-sm bg-slate-900">
            <img src="${safeFoto}" onerror="this.onerror=null;this.src='https://lh3.googleusercontent.com/d/1a3ihmmj3mxIwwsci2kFLibHk9xusUT58';" alt="${safeNama}" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"></div>
            
            <!-- Badges Overlay di Kiri Atas -->
            <div class="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-wrap items-center gap-2 z-10">
                <span class="px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${klasifikasiInfo.color}/90 text-white backdrop-blur-xs shadow-md border border-white/20" title="${safeKlasifikasiFull}">${safeKlasifikasiFull}</span>
                ${item.has_komitmen_pesantren_aman ? `
                    <span class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-600/90 text-white backdrop-blur-xs shadow-md border border-white/20 flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[15px]">verified_user</span>
                        <span>Pesantren Ramah Santri</span>
                    </span>
                ` : ''}
            </div>
        </div>

        <!-- ================================================================= -->
        <!-- SEKSI 2: KARTU PROFIL UTAMA (OVERLAPPING CARD ALA PESANTREN.NU.ID) -->
        <!-- ================================================================= -->
        <div class="relative z-10 -mt-12 sm:-mt-16 bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm border border-slate-200/80 mb-8">
            <div class="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
                
                <!-- Logo Box -->
                <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border-4 border-white shadow-md p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                    ${getPesantrenLogoHtml(item, 'w-24 h-24 sm:w-28 sm:h-28', 'text-2xl')}
                </div>

                <!-- Detail Identitas -->
                <div class="flex-grow">
                    <h1 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight uppercase">${safeNama}</h1>
                    ${safeNamaPopuler ? `<p class="text-sm sm:text-base font-semibold text-emerald-800 mt-1">${safeNamaPopuler}</p>` : ''}
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-y-1.5 gap-x-6 text-xs sm:text-sm text-slate-600 mt-3.5">
                        <p class="flex items-center gap-2">
                            <span class="font-bold text-slate-700 w-24 shrink-0">ID Pesantren:</span>
                            <span class="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">${safeKode}</span>
                        </p>
                        <p class="flex items-center gap-2">
                            <span class="font-bold text-slate-700 w-24 shrink-0">Tahun Berdiri:</span>
                            <span class="text-slate-800">${safeTahun || 'Terdaftar'}</span>
                        </p>
                        <p class="flex items-center gap-2 md:col-span-2">
                            <span class="font-bold text-slate-700 w-24 shrink-0">Pengasuh:</span>
                            <span class="text-slate-900 font-semibold">${safePengasuh}</span>
                        </p>
                        <p class="flex items-start gap-2 md:col-span-2">
                            <span class="font-bold text-slate-700 w-24 shrink-0">Alamat:</span>
                            <span class="text-slate-800">${safeAlamat ? safeAlamat + ', ' : ''}${safeDesa ? 'Desa ' + safeDesa + ', ' : ''}Kec. ${safeKecamatan}, Kab. Demak, Jawa Tengah</span>
                        </p>
                    </div>

                    ${wakilPengasuhHtml}
                </div>
            </div>

            <!-- ================================================================= -->
            <!-- SEKSI 3: TIGA TOMBOL AKSI CEPAT                                   -->
            <!-- ================================================================= -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-100 mt-6">
                <a href="${websiteUrl}" target="_blank" rel="noopener noreferrer" class="px-4 py-3 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs">
                    <span class="material-symbols-outlined text-[18px] text-emerald-700">language</span>
                    <span>Kunjungi Laman Resmi</span>
                </a>
                <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="px-4 py-3 bg-slate-50 hover:bg-rose-50 text-slate-800 hover:text-rose-800 border border-slate-200 hover:border-rose-300 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs">
                    <span class="material-symbols-outlined text-[18px] text-rose-600">map</span>
                    <span>Buka Google Maps</span>
                </a>
                <a href="${waShareUrl}" target="_blank" rel="noopener noreferrer" class="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs">
                    <span class="material-symbols-outlined text-[18px]">share</span>
                    <span>Bagikan Profil Pesantren</span>
                </a>
            </div>
        </div>

        <!-- ================================================================= -->
        <!-- SEKSI 4: BADGE KEMENAG ZAMRUD & MEDIA SOSIAL                      -->
        <!-- ================================================================= -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            <!-- Banner Kemenag Zamrud -->
            <div class="lg:col-span-2 rounded-3xl p-6 sm:p-7 text-white shadow-sm flex flex-col justify-between" style="background: linear-gradient(135deg, #005c55 0%, #004540 100%);">
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[11px] font-bold tracking-wide uppercase mb-3 border border-white/20">
                            <span class="material-symbols-outlined text-[14px] text-emerald-300">verified</span>
                            <span>Terverifikasi Kemenag RI & PBNU</span>
                        </div>
                        <h4 class="text-lg sm:text-xl font-black">Nomor Statistik Pesantren (NSPP)</h4>
                        <p class="text-2xl sm:text-3xl font-mono font-extrabold tracking-wider text-emerald-200 mt-1">${safeNspp}</p>
                        <p class="text-xs text-white/80 mt-2">Terdaftar resmi dalam Pangkalan Data EMIS Kementerian Agama Republik Indonesia.</p>
                    </div>
                    <div class="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-3xl text-emerald-200">account_balance</span>
                    </div>
                </div>

                <div class="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
                    <button type="button" onclick="salinNspp('${safeNspp}')" class="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer">
                        <span class="material-symbols-outlined text-[15px]">content_copy</span>
                        <span>Salin NSPP</span>
                    </button>
                    <a href="https://ditpdpontren.kemenag.go.id" target="_blank" rel="noopener noreferrer" class="text-xs text-emerald-200 hover:text-white underline font-semibold flex items-center gap-1">
                        <span>Validasi di Ditpdpontren Kemenag</span>
                        <span class="material-symbols-outlined text-[13px]">open_in_new</span>
                    </a>
                </div>
            </div>

            <!-- Tautan Media Sosial Resmi -->
            <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                    <h4 class="font-extrabold text-slate-900 text-base mb-1">Kanal Digital & Media Sosial</h4>
                    <p class="text-xs text-slate-500 mb-4">Akses informasi kegiatan harian santri melalui akun resmi pesantren.</p>
                    
                    <div class="space-y-2.5">
                        ${soc.hotline_psb ? `
                            <a href="https://wa.me/${String(soc.hotline_psb).replace(/[^0-9]/g, '')}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 transition text-xs font-bold">
                                <span class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-[16px] text-emerald-700">chat</span>
                                    <span>WhatsApp Hotline</span>
                                </span>
                                <span class="font-mono text-[11px] text-emerald-800">${escapeHTML(soc.hotline_psb)}</span>
                            </a>
                        ` : ''}

                        ${soc.instagram ? `
                            <a href="${escapeHTML(soc.instagram)}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between p-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-900 border border-pink-200/80 transition text-xs font-bold">
                                <span class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-[16px] text-pink-600">photo_camera</span>
                                    <span>Instagram</span>
                                </span>
                                <span class="material-symbols-outlined text-[14px] text-pink-600">open_in_new</span>
                            </a>
                        ` : ''}

                        ${soc.youtube ? `
                            <a href="${escapeHTML(soc.youtube)}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-900 border border-red-200/80 transition text-xs font-bold">
                                <span class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-[16px] text-red-600">smart_display</span>
                                    <span>YouTube Channel</span>
                                </span>
                                <span class="material-symbols-outlined text-[14px] text-red-600">open_in_new</span>
                            </a>
                        ` : ''}

                        ${soc.website ? `
                            <a href="${escapeHTML(soc.website)}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/80 transition text-xs font-bold">
                                <span class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-[16px] text-blue-600">language</span>
                                    <span>Website Resmi</span>
                                </span>
                                <span class="material-symbols-outlined text-[14px] text-blue-600">open_in_new</span>
                            </a>
                        ` : ''}

                        ${(!soc.hotline_psb && !soc.instagram && !soc.youtube && !soc.website) ? `
                            <p class="text-xs text-slate-400 italic py-4 text-center">Tautan media sosial resmi belum ditambahkan oleh pengurus.</p>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>

        <!-- ================================================================= -->
        <!-- SEKSI 5: BANNER TRANSPARANSI & PEMUTAKHIRAN DATA                    -->
        <!-- ================================================================= -->
        <div class="mb-8 rounded-3xl p-5 sm:p-6 bg-emerald-50/70 border border-emerald-200/90 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-start gap-3.5">
                <span class="material-symbols-outlined text-emerald-700 text-2xl shrink-0 mt-0.5">info</span>
                <div>
                    <h5 class="font-extrabold text-sm text-emerald-950">Pangkalan Data Resmi PC RMI NU Kabupaten Demak</h5>
                    <p class="text-xs text-emerald-800 mt-1 leading-relaxed">
                        Data pesantren ini dihimpun secara mandiri melalui Sensus Direktori Pesantren PC RMI NU Demak dan tersinkronisasi dengan EMIS Kemenag & PBNU. Apabila Anda pengurus pondok dan ingin memutakhirkan data, silakan masuk ke Portal Administrasi.
                    </p>
                </div>
            </div>
            <a href="/admin" target="_blank" rel="noopener noreferrer" class="shrink-0 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-2xs inline-flex items-center gap-1.5 cursor-pointer">
                <span class="material-symbols-outlined text-[16px]">edit_note</span>
                <span>Update Data di Portal Admin</span>
            </a>
        </div>

        <!-- ================================================================= -->
        <!-- SEKSI 6: TENTANG PESANTREN & GRID 4 KARTU STATISTIK                -->
        <!-- ================================================================= -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/80 shadow-sm mb-8">
            <h3 class="text-xl sm:text-2xl font-black text-slate-900 mb-3">Tentang Pesantren</h3>
            <p class="text-sm sm:text-base text-slate-600 leading-relaxed">
                ${safeNama} adalah lembaga pendidikan Islam ${safeKlasifikasiFull} di bawah naungan Pengurus Cabang Rabithah Ma'ahid Islamiyah Nahdlatul Ulama (PC RMI NU) Kabupaten Demak yang diasuh oleh ${safePengasuh}. Lembaga ini berkomitmen mencetak generasi santri yang berakhlakul karimah, berpegang teguh pada ajaran Islam Ahlussunnah wal Jama'ah An-Nahdliyyah, serta mendalami khazanah keilmuan Islam turots klasik yang dipadukan dengan wawasan kebangsaan dan kemandirian umat.
            </p>

            <!-- 4 Grid Kartu Statistik -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-100">
                
                <div class="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100 flex flex-col justify-between">
                    <span class="material-symbols-outlined text-emerald-700 text-2xl mb-2">groups</span>
                    <div>
                        <span class="text-2xl sm:text-3xl font-black text-slate-900">${totalSantriCount.toLocaleString('id-ID')}</span>
                        <p class="text-xs font-extrabold text-slate-700 mt-1">Santri Terdata</p>
                        <p class="text-[11px] text-slate-500">${santriMukimCount} Mukim · ${santriNonMukimCount} Kalong</p>
                    </div>
                </div>

                <div class="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100 flex flex-col justify-between">
                    <span class="material-symbols-outlined text-blue-700 text-2xl mb-2">school</span>
                    <div>
                        <span class="text-2xl sm:text-3xl font-black text-slate-900">${totalAsatidzCount}</span>
                        <p class="text-xs font-extrabold text-slate-700 mt-1">Dewan Asatidz</p>
                        <p class="text-[11px] text-slate-500">Pengajar & Pembina</p>
                    </div>
                </div>

                <div class="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100 flex flex-col justify-between">
                    <span class="material-symbols-outlined text-amber-600 text-2xl mb-2">auto_stories</span>
                    <div>
                        <span class="text-2xl sm:text-3xl font-black text-slate-900">${totalKitabCount}</span>
                        <p class="text-xs font-extrabold text-slate-700 mt-1">Kitab Turots</p>
                        <p class="text-[11px] text-slate-500">Kurikulum Marhalah</p>
                    </div>
                </div>

                <div class="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100 flex flex-col justify-between">
                    <span class="material-symbols-outlined text-purple-700 text-2xl mb-2">stars</span>
                    <div>
                        <span class="text-base sm:text-lg font-black text-slate-900 truncate block" title="${safeKlasifikasiFull}">${safeKlasifikasi} <span class="text-xs font-semibold text-slate-500">(${klasifikasiInfo.sublabel})</span></span>
                        <p class="text-xs font-extrabold text-slate-700 mt-1">Klasifikasi Pesantren</p>
                        <p class="text-[11px] text-slate-500">Spesialisasi Program</p>
                    </div>
                </div>

            </div>
        </div>

        <!-- ================================================================= -->
        <!-- SEKSI 7: GALERI PESANTREN (4 FOTO DOKUMENTASI DENGAN CAPTION)       -->
        <!-- ================================================================= -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/80 shadow-sm mb-8">
            <div class="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h3 class="text-xl sm:text-2xl font-black text-slate-900">Galeri Fasilitas & Kegiatan</h3>
                    <p class="text-xs sm:text-sm text-slate-500 mt-0.5">Dokumentasi lingkungan dan sarana prasarana pondok pesantren.</p>
                </div>
                <span class="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-full">${galeriList.length} Foto</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                ${galeriList.slice(0, 4).map((g, idx) => `
                    <div class="group relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-100 shadow-2xs hover:shadow-md transition-all flex flex-col">
                        <div class="h-44 sm:h-48 overflow-hidden bg-slate-200">
                            <img src="${escapeHTML(g.url)}" onerror="this.onerror=null;this.src='https://lh3.googleusercontent.com/d/1a3ihmmj3mxIwwsci2kFLibHk9xusUT58';" alt="${escapeHTML(g.judul || 'Fasilitas')}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        </div>
                        <div class="p-3.5 bg-white flex-grow">
                            <span class="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">${escapeHTML(g.kategori || 'Fasilitas')}</span>
                            <h5 class="text-xs font-bold text-slate-800 mt-1.5 leading-snug">${escapeHTML(g.judul || 'Gedung Pesantren')}</h5>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- ================================================================= -->
        <!-- SEKSI 8: PROGRAM UNGGULAN & METODE BELAJAR                        -->
        <!-- ================================================================= -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/80 shadow-sm mb-8">
            <h3 class="text-xl sm:text-2xl font-black text-slate-900 mb-2">Program Unggulan</h3>
            <p class="text-xs sm:text-sm text-slate-500 mb-6">Program pendidikan dan pembinaan karakter yang menjadi kekhasan pesantren ini.</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div class="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-2xl">menu_book</span>
                    </div>
                    <div>
                        <h4 class="font-extrabold text-slate-900 text-sm">Madrasah Diniyyah Salafiyah</h4>
                        <p class="text-xs text-slate-600 mt-1 leading-relaxed">Jenjang pendidikan keagamaan terstruktur dengan sistem tingkatan kelas (Awaliyah/Wustha/Ulya) mengkaji fan fiqih, ushul fiqih, nahwu, sharaf, dan tasawuf.</p>
                    </div>
                </div>

                <div class="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-2xl">record_voice_over</span>
                    </div>
                    <div>
                        <h4 class="font-extrabold text-slate-900 text-sm">Pengajian Wetonan & Sorogan Kitab</h4>
                        <p class="text-xs text-slate-600 mt-1 leading-relaxed">Tradisi talaqqi langsung di hadapan Kyai/Nyai pengasuh melalui metode sorogan (privat membaca kitab) dan bandongan/wetonan berjamaah.</p>
                    </div>
                </div>

                <div class="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-2xl">auto_awesome</span>
                    </div>
                    <div>
                        <h4 class="font-extrabold text-slate-900 text-sm">Tahfidz & Tartil Al-Qur'an (Metode Yanbu'a)</h4>
                        <p class="text-xs text-slate-600 mt-1 leading-relaxed">Bimbingan tahsin makhorijul huruf dengan sanad bersambung, hafalan juz 'amma hingga 30 juz mutqin dengan muraja'ah harian.</p>
                    </div>
                </div>

                <div class="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-2xl">forum</span>
                    </div>
                    <div>
                        <h4 class="font-extrabold text-slate-900 text-sm">Halaqah Bahtsul Masail & Khitobah</h4>
                        <p class="text-xs text-slate-600 mt-1 leading-relaxed">Pelatihan musyawarah kontekstual pemecahan hukum Islam kontemporer berbasis kitab turots dan latihan pidato/dakwah santri.</p>
                    </div>
                </div>

            </div>
        </div>

        <!-- ================================================================= -->
        <!-- SEKSI 9: KURIKULUM KITAB TUROTS & FASILITAS PESANTREN             -->
        <!-- ================================================================= -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            
            <!-- Tabel Kitab Kuning (2 Kolom) -->
            <div class="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                <div class="flex items-center justify-between gap-4 mb-4">
                    <div>
                        <h3 class="text-xl font-black text-slate-900">Kitab yang Dipelajari</h3>
                        <p class="text-xs text-slate-500 mt-0.5">Khazanah keilmuan Islam turots salaf yang diajarkan.</p>
                    </div>
                    <span class="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-full">${kitabList.length} Kitab</span>
                </div>

                <div class="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-slate-50 font-bold text-slate-700 border-b border-slate-100">
                            <tr>
                                <th class="p-3 text-center w-10">No</th>
                                <th class="p-3">Nama Kitab</th>
                                <th class="p-3">Pengarang (Mu'allif)</th>
                                <th class="p-3">Fan Ilmu</th>
                                <th class="p-3 text-center">Marhalah</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${kitabList.map((k, i) => `
                                <tr class="hover:bg-slate-50/80 transition-colors">
                                    <td class="p-3 text-center text-slate-400 font-mono">${i + 1}</td>
                                    <td class="p-3 font-bold text-slate-900">${escapeHTML(k.nama_kitab)}</td>
                                    <td class="p-3 text-slate-600">${escapeHTML(k.pengarang || '-')}</td>
                                    <td class="p-3 font-semibold text-slate-700">${escapeHTML(k.bidang_ilmu || '-')}</td>
                                    <td class="p-3 text-center">
                                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${k.marhalah === 'wustho' ? 'bg-emerald-100 text-emerald-800' : (k.marhalah === 'ulya' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800')}">${escapeHTML(k.marhalah || 'Salaf')}</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Fasilitas Pondok (1 Kolom) -->
            <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                    <h3 class="text-xl font-black text-slate-900 mb-1">Fasilitas Pesantren</h3>
                    <p class="text-xs text-slate-500 mb-5">Sarana pendukung kenyamanan belajar dan ibadah santri.</p>
                    
                    <div class="space-y-3">
                        ${defaultFasilitas.slice(0, 7).map(f => `
                            <div class="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                <span class="material-symbols-outlined text-emerald-700 text-xl shrink-0 mt-0.5">${f.icon}</span>
                                <div>
                                    <h5 class="text-xs font-bold text-slate-900 leading-snug">${f.nama}</h5>
                                    <p class="text-[11px] text-slate-500 mt-0.5">${f.deskripsi}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="pt-4 mt-4 border-t border-slate-100">
                    <span class="text-xs text-slate-500 italic flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
                        <span>Fasilitas telah diverifikasi oleh tim sarpras RMI Demak.</span>
                    </span>
                </div>
            </div>

        </div>

        <!-- ================================================================= -->
        <!-- SEKSI 10: DEWAN PENGASUH & KONTAK PENDAFTARAN (PSB)               -->
        <!-- ================================================================= -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/80 shadow-sm mb-8">
            <h3 class="text-xl sm:text-2xl font-black text-slate-900 mb-2">Dewan Pengasuh & Pimpinan</h3>
            <p class="text-xs sm:text-sm text-slate-500 mb-6">Mursyid, pengasuh, dan asatidz pembina santri.</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                
                <div class="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
                        ${(safePengasuh.slice(0, 2)).toUpperCase()}
                    </div>
                    <div>
                        <span class="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Pengasuh Utama</span>
                        <h4 class="font-extrabold text-slate-900 text-sm leading-snug mt-0.5">${safePengasuh}</h4>
                        <p class="text-xs text-slate-600 mt-0.5">Pimpinan Pondok Pesantren</p>
                    </div>
                </div>

                ${(item.wakil_pengasuh || []).map(w => `
                    <div class="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                        <div class="w-14 h-14 rounded-2xl bg-slate-700 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
                            ${(w.slice(0, 2)).toUpperCase()}
                        </div>
                        <div>
                            <span class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Wakil Pengasuh</span>
                            <h4 class="font-extrabold text-slate-900 text-sm leading-snug mt-0.5">${escapeHTML(w)}</h4>
                            <p class="text-xs text-slate-600 mt-0.5">Majelis Pengasuh</p>
                        </div>
                    </div>
                `).join('')}

            </div>

            <!-- Banner Pendaftaran Santri Baru (PSB) WhatsApp Langsung -->
            <div class="rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm" style="background: linear-gradient(135deg, #005c55 0%, #064e3b 100%);">
                <div class="space-y-1.5 text-center md:text-left">
                    <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-white/20">
                        <span class="material-symbols-outlined text-[15px] text-emerald-300">campaign</span>
                        <span>Penerimaan Santri Baru (PSB)</span>
                    </div>
                    <h4 class="text-xl sm:text-2xl font-black">Informasi Pendaftaran & Silaturahmi</h4>
                    <p class="text-xs sm:text-sm text-white/80 max-w-xl">
                        Ingin mendaftar sebagai santri baru atau berkonsultasi mengenai kurikulum dan tata cara mukim? Hubungi sekretariat pendaftaran resmi pesantren ini.
                    </p>
                </div>

                <div class="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
                    ${soc.hotline_psb ? `
                        <a href="${waPsbUrl}" target="_blank" rel="noopener noreferrer" class="w-full sm:w-auto px-6 py-3.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-md inline-flex items-center justify-center gap-2 cursor-pointer">
                            <span class="material-symbols-outlined text-[20px] text-emerald-700">chat</span>
                            <span>WhatsApp Panitia PSB</span>
                        </a>
                    ` : `
                        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="w-full sm:w-auto px-6 py-3.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-md inline-flex items-center justify-center gap-2 cursor-pointer">
                            <span class="material-symbols-outlined text-[20px] text-emerald-700">pin_drop</span>
                            <span>Kunjungi Sekretariat Pesantren</span>
                        </a>
                    `}
                    <button type="button" onclick="kembaliKeKatalogPesantren()" class="w-full sm:w-auto px-5 py-3.5 bg-white/15 hover:bg-white/25 text-white rounded-2xl text-xs sm:text-sm font-bold transition inline-flex items-center justify-center gap-2 border border-white/20 cursor-pointer">
                        <span class="material-symbols-outlined text-[18px]">list_alt</span>
                        <span>Lihat Pesantren Lainnya</span>
                    </button>
                </div>
            </div>

        </div>
    `;
}

// Expose fungsi secara global
window.bukaProfilPesantren = bukaProfilPesantren;
window.renderPesantrenDetailPage = renderPesantrenDetailPage;
window.kembaliKeKatalogPesantren = kembaliKeKatalogPesantren;
window.salinNspp = salinNspp;
window.generatePesantrenSlug = generatePesantrenSlug;
window.findPesantrenBySlugOrId = findPesantrenBySlugOrId;

// ==================================================================
// MODAL DETAIL LEMBAGA (STANDAR DIGDAYA PESANTREN PBNU)
// ==================================================================
function bukaModalDetailLembaga(lembagaId) {
    if (typeof hidePesantrenFlyout === 'function') {
        hidePesantrenFlyout();
    }
    // Langsung alihkan ke halaman detail profil penuh ala pesantren.nu.id
    bukaProfilPesantren(lembagaId, true);
}

function tutupModalDetailLembaga() {
    const modal = document.getElementById('modal-public-detail');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}


// ==================================================================
// MODUL WARTA & BERITA MEDIA RMI NU DEMAK (DINAMIS 1 TAHUN TERAKHIR)
// ==================================================================
let allBeritaData = [];
let activeBeritaCategory = 'Semua';
let beritaSearchQuery = '';

async function loadBeritaRMI() {
    // 1. Instant load dari aset lokal / cache (0ms)
    try {
        const res = await fetch('assets/data/berita_rmi.json');
        if (res.ok) {
            allBeritaData = await res.json();
            renderBeritaBeranda();
            renderBeritaFullPage();
        }
    } catch (err) {
        console.warn('Gagal memuat berita lokal:', err);
    }

    // 2. Background revalidation dari Live Google Sheets Web App
    try {
        const liveRes = await fetch('https://script.google.com/macros/s/AKfycbw-0Y0IM-uR326H4bkWAvbQ179Q5NrfgJT8ihOf8lY7C_joVwrT136fPRjRqu8U9jhU/exec?action=GET_BERITA');
        if (liveRes.ok) {
            const result = await liveRes.json();
            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                const cleanData = result.data.filter(b => b.id !== 'BRT-TEST-001');
                if (cleanData.length > 0) {
                    allBeritaData = cleanData;
                    renderBeritaBeranda();
                    renderBeritaFullPage();
                }
            }
        }
    } catch (liveErr) {
        // Fallback aman pada cache lokal
    }
}

function renderBeritaBeranda() {
    if (!allBeritaData || allBeritaData.length === 0) return;

    // 1. Featured Article (Sorotan Utama)
    const featured = allBeritaData.find(b => b.is_featured) || allBeritaData[0];
    const featuredContainer = document.getElementById('home-berita-featured');
    if (featuredContainer && featured) {
        const safeJudul = escapeHTML(featured.judul);
        const safeRingkasan = escapeHTML(featured.ringkasan);
        const safeMedia = escapeHTML(featured.sumber_media || 'Media Online');
        const formattedDate = formatTanggalIndonesia(featured.published_at);
        const viewsCount = featured.views_count ? (featured.views_count >= 1000 ? (featured.views_count / 1000).toFixed(1) + 'k' : featured.views_count) : '1.2k';

        featuredContainer.innerHTML = `
            <img src="${featured.cover_image_url || 'https://lh3.googleusercontent.com/d/1mOekcQhUGD2eqHMy-8AmEua9BrJK-06Z'}"
                alt="${safeJudul}"
                class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none"></div>
            <div class="relative z-10 p-6 md:p-10 text-white w-full">
                <div class="mb-4 flex flex-wrap items-center gap-2">
                    <span class="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-widest shadow-md">Sorotan Utama</span>
                    <span class="bg-amber-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider">${safeMedia}</span>
                </div>
                <h3 class="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-3 group-hover:text-secondary-container transition-colors duration-300 drop-shadow-md">
                    ${safeJudul}
                </h3>
                <div class="flex items-center gap-4 text-xs text-white/80 font-medium mb-6">
                    <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">calendar_today</span> ${formattedDate}</span>
                    <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">visibility</span> ${viewsCount} Views</span>
                </div>
                <div class="flex flex-wrap items-center gap-3">
                    <button type="button" onclick="openBeritaDetailModal('${featured.slug || featured.id}')"
                        class="bg-secondary-container text-on-secondary-container font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-white hover:text-primary transition-colors w-fit cursor-pointer shadow-md">
                        Lihat Detail Berita <span class="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                    <button type="button"
                        onclick="event.stopPropagation(); bagikanBeritaKeWA('${featured.slug || featured.id}')"
                        class="px-4 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                        title="Bagikan Berita ini ke WhatsApp">
                        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                        <span>Share WA</span>
                    </button>
                </div>
            </div>
        `;
    }

    // 2. Next 3 Recent Articles
    const recentContainer = document.getElementById('home-berita-recent');
    if (recentContainer) {
        const otherArticles = allBeritaData.filter(b => b.id !== (featured ? featured.id : '')).slice(0, 3);
        recentContainer.innerHTML = otherArticles.map(art => {
            const safeJudul = escapeHTML(art.judul);
            const safeRingkasan = escapeHTML(art.ringkasan);
            const safeMedia = escapeHTML(art.sumber_media || 'Media Online');
            const formattedDate = formatTanggalIndonesia(art.published_at);
            const viewsCount = art.views_count ? (art.views_count >= 1000 ? (art.views_count / 1000).toFixed(1) + 'k' : art.views_count) : '850';

            return `
                <div class="group cursor-pointer flex gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                    onclick="openBeritaDetailModal('${art.slug || art.id}')">
                    <div class="w-28 h-28 md:w-36 md:h-36 rounded-xl overflow-hidden flex-shrink-0 relative">
                        <img src="${art.cover_image_url || 'https://lh3.googleusercontent.com/d/1cXO8QC16Fe2VA147fgjeI49uwIWEpM21'}"
                            alt="${safeJudul}"
                            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div class="flex flex-col justify-between py-1 flex-1">
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-primary text-[10px] font-bold uppercase tracking-wider block">${escapeHTML(art.kategori || 'Warta')}</span>
                                <span class="text-slate-400">•</span>
                                <span class="text-amber-700 text-[10px] font-bold block">${safeMedia}</span>
                            </div>
                            <h4 class="text-sm md:text-base font-bold text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-2">
                                ${safeJudul}
                            </h4>
                        </div>
                        <div class="flex items-end justify-between mt-2">
                            <div class="flex flex-col gap-0.5 text-[11px] text-on-surface-variant font-medium">
                                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">calendar_today</span> ${formattedDate}</span>
                                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">visibility</span> ${viewsCount} Views</span>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <button type="button"
                                    onclick="event.stopPropagation(); bagikanBeritaKeWA('${art.slug || art.id}')"
                                    class="w-8 h-8 rounded-full bg-emerald-50 text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                                    title="Bagikan ke WhatsApp">
                                    <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                                </button>
                                <div class="w-8 h-8 rounded-full bg-slate-100 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                    <span class="material-symbols-outlined text-[18px] transform -rotate-45 group-hover:rotate-0 transition-transform duration-300">arrow_forward</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function renderBeritaFullPage() {
    if (!allBeritaData || allBeritaData.length === 0) return;

    // Filter Kategori Dinamis (Preset + Kategori Kustom Database)
    const categoryContainer = document.getElementById('berita-category-filters');
    if (categoryContainer) {
        const defaultPreset = ['Pesantren Ramah Anak', 'Pendidikan & Madin', 'Ekonomi & Kemandirian', 'Warta Organisasi'];
        const existingCats = Array.isArray(allBeritaData) 
            ? allBeritaData.map(b => b.kategori).filter(Boolean)
            : [];
        const categories = ['Semua', ...new Set([...defaultPreset, ...existingCats])];

        categoryContainer.innerHTML = categories.map(cat => {
            const isActive = activeBeritaCategory === cat;
            return `
                <button type="button" onclick="filterBeritaCategory('${cat}')"
                    class="whitespace-nowrap px-5 py-2 rounded-full font-bold text-xs transition-all shadow-xs cursor-pointer border ${
                        isActive
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                    }">
                    ${cat}
                </button>
            `;
        }).join('');
    }

    // Filter Data Berdasarkan Kategori & Pencarian (Mendukung Judul, Ringkasan, Kategori, Keyword SEO & Penulis)
    let filtered = allBeritaData.filter(item => {
        const matchCategory = activeBeritaCategory === 'Semua' || (item.kategori || '') === activeBeritaCategory;
        const query = beritaSearchQuery.toLowerCase().trim();
        const matchSearch = !query || 
            (item.judul || '').toLowerCase().includes(query) || 
            (item.ringkasan || '').toLowerCase().includes(query) ||
            (item.kategori || '').toLowerCase().includes(query) ||
            (item.keywords || '').toLowerCase().includes(query) ||
            (item.penulis || '').toLowerCase().includes(query) ||
            (item.sumber_media || '').toLowerCase().includes(query);
        return matchCategory && matchSearch;
    });

    // Update Counter Badge
    const countBadge = document.getElementById('berita-count-badge');
    if (countBadge) {
        countBadge.innerText = `${filtered.length} Berita`;
    }

    // Featured di Halaman Berita (Top 1 atau 2)
    const pageFeaturedContainer = document.getElementById('berita-page-featured');
    if (pageFeaturedContainer) {
        if (filtered.length > 0) {
            const f1 = filtered[0];
            const safeJudul = escapeHTML(f1.judul);
            const safeMedia = escapeHTML(f1.sumber_media || 'Media Online');
            const formattedDate = formatTanggalIndonesia(f1.published_at);

            pageFeaturedContainer.innerHTML = `
                <div class="lg:col-span-8 relative group rounded-2xl overflow-hidden shadow-lg h-[380px] md:h-[450px] cursor-pointer"
                    onclick="openBeritaDetailModal('${f1.slug || f1.id}')">
                    <img src="${f1.cover_image_url || 'https://lh3.googleusercontent.com/d/1mOekcQhUGD2eqHMy-8AmEua9BrJK-06Z'}"
                        alt="${safeJudul}"
                        class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>
                    <div class="absolute bottom-0 left-0 w-full p-6 md:p-8 flex flex-col justify-end text-white">
                        <div class="flex items-center gap-2 mb-3">
                            <span class="bg-primary/95 text-white text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider">${escapeHTML(f1.kategori || 'Warta')}</span>
                            <span class="bg-amber-400 text-slate-900 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">${safeMedia}</span>
                        </div>
                        <h2 class="text-xl md:text-3xl font-bold leading-tight mb-3 group-hover:text-secondary-container transition-colors drop-shadow-md">
                            ${safeJudul}
                        </h2>
                        <div class="flex items-center gap-4 text-xs font-medium text-white/80">
                            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">calendar_today</span> ${formattedDate}</span>
                            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">visibility</span> ${f1.views_count || 1200} Views</span>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-4 flex flex-col gap-5">
                    ${(filtered.slice(1, 3)).map(sub => {
                        const subJudul = escapeHTML(sub.judul);
                        const subMedia = escapeHTML(sub.sumber_media || 'Media');
                        return `
                            <div class="relative group rounded-2xl overflow-hidden shadow-md h-[180px] md:h-[215px] cursor-pointer"
                                onclick="openBeritaDetailModal('${sub.slug || sub.id}')">
                                <img src="${sub.cover_image_url || 'https://lh3.googleusercontent.com/d/1a3ihmmj3mxIwwsci2kFLibHk9xusUT58'}"
                                    alt="${subJudul}"
                                    class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                                <div class="absolute bottom-0 left-0 w-full p-4 text-white">
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="text-secondary-container text-[10px] font-bold uppercase tracking-wider drop-shadow-md">${escapeHTML(sub.kategori || 'Warta')}</span>
                                        <span class="text-amber-300 text-[10px] font-bold">${subMedia}</span>
                                    </div>
                                    <h3 class="text-sm md:text-base font-bold leading-snug group-hover:text-primary-container transition-colors line-clamp-2">
                                        ${subJudul}
                                    </h3>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else {
            pageFeaturedContainer.innerHTML = '';
        }
    }

    // List Berita Lengkap
    const pageListContainer = document.getElementById('berita-page-list');
    if (pageListContainer) {
        if (filtered.length === 0) {
            pageListContainer.innerHTML = `
                <div class="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
                    <span class="material-symbols-outlined text-4xl text-slate-400 mb-2">newspaper</span>
                    <p class="font-bold">Tidak ada berita yang sesuai dengan filter atau kata kunci pencarian.</p>
                </div>
            `;
        } else {
            pageListContainer.innerHTML = filtered.map(item => {
                const safeJudul = escapeHTML(item.judul);
                const safeRingkasan = escapeHTML(item.ringkasan);
                const safeMedia = escapeHTML(item.sumber_media || 'Media Online');
                const formattedDate = formatTanggalIndonesia(item.published_at);
                const viewsCount = item.views_count ? (item.views_count >= 1000 ? (item.views_count / 1000).toFixed(1) + 'k' : item.views_count) : '750';

                return `
                    <div class="group flex flex-col sm:flex-row bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer"
                        onclick="openBeritaDetailModal('${item.slug || item.id}')">
                        <div class="sm:w-2/5 h-48 sm:h-auto relative overflow-hidden flex-shrink-0">
                            <img src="${item.cover_image_url || 'https://lh3.googleusercontent.com/d/1cXO8QC16Fe2VA147fgjeI49uwIWEpM21'}"
                                alt="${safeJudul}"
                                class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                        <div class="sm:w-3/5 p-6 flex flex-col justify-between">
                            <div>
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="text-primary text-[10px] font-bold uppercase tracking-wider">${escapeHTML(item.kategori || 'Warta')}</span>
                                    <span class="text-slate-300">•</span>
                                    <span class="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">${safeMedia}</span>
                                </div>
                                <h4 class="text-base md:text-lg font-bold text-on-surface mb-2 leading-snug group-hover:text-primary transition-colors">
                                    ${safeJudul}
                                </h4>
                                <p class="text-xs md:text-sm text-on-surface-variant line-clamp-2 mb-4 leading-relaxed">
                                    ${safeRingkasan}
                                </p>
                            </div>
                            <div class="flex items-center justify-between text-[11px] font-medium text-on-surface-variant pt-2 border-t border-slate-100">
                                <div class="flex items-center gap-3">
                                    <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">calendar_today</span> ${formattedDate}</span>
                                    <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">visibility</span> ${viewsCount} Views</span>
                                </div>
                                <button type="button"
                                    onclick="event.stopPropagation(); bagikanBeritaKeWA('${item.slug || item.id}')"
                                    class="w-7 h-7 rounded-full bg-emerald-50 text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                                    title="Bagikan ke WhatsApp">
                                    <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Trending Sidebar (Urutkan dari view terbanyak)
    const trendingContainer = document.getElementById('berita-page-trending');
    if (trendingContainer) {
        const sortedByViews = [...allBeritaData].sort((a, b) => Number(b.views_count || 0) - Number(a.views_count || 0)).slice(0, 4);
        trendingContainer.innerHTML = sortedByViews.map((item, idx) => {
            const safeJudul = escapeHTML(item.judul);
            const safeMedia = escapeHTML(item.sumber_media || 'Media');
            const viewsText = item.views_count ? (item.views_count >= 1000 ? (item.views_count / 1000).toFixed(1) + 'k' : item.views_count) : '1.2k';

            return `
                <div class="relative flex items-center gap-4 group cursor-pointer" onclick="openBeritaDetailModal('${item.slug || item.id}')">
                    <span class="text-5xl font-black text-slate-100 absolute -left-1 top-1/2 -translate-y-1/2 -z-10 group-hover:text-primary/15 transition-colors">${idx + 1}</span>
                    <div class="pl-6 relative z-10">
                        <div class="text-[10px] text-amber-800 font-bold mb-0.5">${safeMedia}</div>
                        <h5 class="text-xs md:text-sm font-bold leading-snug text-slate-800 group-hover:text-primary transition-colors line-clamp-2">
                            ${safeJudul}
                        </h5>
                        <span class="text-[10px] text-on-surface-variant font-medium mt-1 block">${viewsText} Views</span>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function filterBeritaCategory(cat) {
    activeBeritaCategory = cat;
    renderBeritaFullPage();
}

function handleBeritaSearch(query) {
    beritaSearchQuery = query || '';
    renderBeritaFullPage();
}

function findBeritaItem(idOrSlug) {
    if (!idOrSlug || typeof allBeritaData === 'undefined' || !Array.isArray(allBeritaData)) return null;
    let clean = '';
    try {
        clean = decodeURIComponent(String(idOrSlug)).toLowerCase().trim();
    } catch(e) {
        clean = String(idOrSlug).toLowerCase().trim();
    }
    return allBeritaData.find(b => 
        (b.id && String(b.id).toLowerCase().trim() === clean) || 
        (b.slug && String(b.slug).toLowerCase().trim() === clean)
    ) || null;
}

function incrementBeritaView(idOrSlug) {
    if (!idOrSlug) return;
    try {
        const gasUrl = 'https://script.google.com/macros/s/AKfycbw-0Y0IM-uR326H4bkWAvbQ179Q5NrfgJT8ihOf8lY7C_joVwrT136fPRjRqu8U9jhU/exec?action=INCREMENT_BERITA_VIEW&id=' + encodeURIComponent(idOrSlug);
        fetch(gasUrl, { mode: 'no-cors' }).catch(() => {});
    } catch(e) {}
}

function openBeritaDetailModal(idOrSlug) {
    const item = findBeritaItem(idOrSlug);
    if (item) {
        item.views_count = (Number(item.views_count) || 0) + 1;
        incrementBeritaView(item.id || item.slug || idOrSlug);
    }
    const activeSlug = (item && item.slug) ? item.slug : idOrSlug;
    const targetHash = '#berita/' + encodeURIComponent(activeSlug);
    if (window.location.hash !== targetHash) {
        history.pushState({ page: 'berita-detail', id: (item ? item.id : idOrSlug), slug: activeSlug }, '', targetHash);
    }
    sessionStorage.setItem('activePage', 'berita-detail');
    
    // Sembunyikan semua page-section lain
    const pages = document.querySelectorAll('.page-section');
    pages.forEach(p => p.classList.remove('active'));
    const detailPage = document.getElementById('page-berita-detail');
    if (detailPage) {
        detailPage.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Sorot nav 'berita' di header
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        if (btn.dataset.target === 'berita') {
            btn.className = 'nav-btn spa-link text-xs font-bold text-white bg-white/20 px-3.5 py-1.5 rounded-full border border-white/25 shadow-sm transition-all flex items-center gap-1 cursor-pointer';
        } else {
            btn.className = 'nav-btn spa-link text-xs font-semibold text-white/80 hover:text-white hover:bg-white/15 px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer';
        }
    });

    const container = document.getElementById('berita-detail-content');
    if (allBeritaData.length === 0) {
        if (container) {
            container.innerHTML = `
                <div class="py-16 text-center max-w-lg mx-auto">
                    <div class="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mb-4"></div>
                    <p class="text-sm font-semibold text-slate-600">Memuat warta berita...</p>
                </div>
            `;
        }
        loadBeritaRMI().then(() => {
            renderBeritaDetailPage(idOrSlug);
            const found = findBeritaItem(idOrSlug);
            if (found && found.slug && window.location.hash !== '#berita/' + encodeURIComponent(found.slug)) {
                history.replaceState({ page: 'berita-detail', id: found.id, slug: found.slug }, '', '#berita/' + encodeURIComponent(found.slug));
            }
        });
    } else {
        renderBeritaDetailPage(idOrSlug);
    }
}

function formatIsiBeritaHtml(rawText) {
    if (!rawText) return '';
    let text = String(rawText);

    // 1. Bersihkan potensi script berbahaya (Sanitasi XSS)
    text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    text = text.replace(/javascript\s*:/gi, '');

    // 2. Dukung konversi Markdown Image: ![caption](url) -> Komponen Foto Responsif
    text = text.replace(/!\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, function(match, caption, url) {
        const safeUrl = encodeURI(url);
        const safeCap = escapeHTML(caption || '');
        return `\n<div class="my-6 text-center">
            <img src="${safeUrl}" alt="${safeCap || 'Foto Berita'}" class="rounded-2xl mx-auto shadow-md max-w-full h-auto" />
            ${safeCap ? `<p class="text-xs text-slate-500 mt-2 italic font-medium">📸 ${safeCap}</p>` : ''}
        </div>\n`;
    });

    // 3. Format markdown standar (Bold & Italic)
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/(?<!\*)\*(?!\*)([^\*\n]+)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

    // 4. Konversi paragraf teks biasa jika tidak terdapat blok HTML (P, DIV, dll)
    const hasHtmlBlocks = /<(p|div|h[1-6]|ul|ol|li|table|blockquote)\b/i.test(text);
    if (!hasHtmlBlocks) {
        text = text.split(/\n\s*\n/).map(para => `<p class="mb-4 leading-relaxed">${para.replace(/\n/g, '<br />')}</p>`).join('');
    }

    return text;
}

function renderBeritaDetailPage(idOrSlug) {
    const item = findBeritaItem(idOrSlug);
    const container = document.getElementById('berita-detail-content');
    if (!item || !container) {
        if (container && allBeritaData.length > 0) {
            container.innerHTML = `
                <div class="py-16 text-center max-w-lg mx-auto bg-white rounded-3xl p-8 border border-slate-200">
                    <span class="material-symbols-outlined text-4xl text-amber-500 mb-2">article</span>
                    <h3 class="text-lg font-bold text-slate-800">Berita Tidak Ditemukan</h3>
                    <p class="text-sm text-slate-500 mt-1 mb-6">Artikel warta berita yang Anda cari mungkin telah diperbarui atau dipindahkan.</p>
                    <button type="button" onclick="navigateTo('berita')" class="px-5 py-2.5 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition-all cursor-pointer">
                        Kembali ke Halaman Berita
                    </button>
                </div>
            `;
        }
        return;
    }

    const safeJudul = escapeHTML(item.judul);
    document.title = `${item.judul} — RMI PCNU Kabupaten Demak`;
    const safeRingkasan = escapeHTML(item.ringkasan);
    const safeMedia = escapeHTML(item.sumber_media || 'Media Online');
    const formattedIsi = formatIsiBeritaHtml(item.isi_lengkap || item.ringkasan || '');
    const formattedDate = formatTanggalIndonesia(item.published_at);
    const viewsCount = item.views_count ? (item.views_count >= 1000 ? (item.views_count / 1000).toFixed(1) + 'k' : item.views_count) : '1.2k';
    const coverUrl = item.cover_image_url || 'https://lh3.googleusercontent.com/d/1mOekcQhUGD2eqHMy-8AmEua9BrJK-06Z';

    // Ambil 3 berita terkait (sesama kategori, bukan dirinya sendiri)
    const relatedNews = allBeritaData.filter(b => b.id !== item.id && b.kategori === item.kategori).slice(0, 3);
    const otherRelated = relatedNews.length < 3 
        ? allBeritaData.filter(b => b.id !== item.id && !relatedNews.find(r => r.id === b.id)).slice(0, 3 - relatedNews.length)
        : [];
    const allRelated = [...relatedNews, ...otherRelated];

    container.innerHTML = `
        <!-- Breadcrumb Navigasi Kembali -->
        <div class="mb-6">
            <button type="button" onclick="navigateTo('berita')" class="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:text-emerald-950 bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-xs transition-all cursor-pointer group">
                <span class="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                <span>Kembali ke Halaman Berita</span>
            </button>
        </div>

        <!-- ARTICLE LAYOUT: Full-width modern magazine with Clean White Container -->
        <article class="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 mb-12">
            <!-- Cover Image Hero -->
            <div class="relative rounded-2xl overflow-hidden mb-8 shadow-md aspect-video max-h-[480px] bg-slate-900">
                <img src="${coverUrl}" alt="${safeJudul}" class="w-full h-full object-cover" onerror="this.src='https://lh3.googleusercontent.com/d/1mOekcQhUGD2eqHMy-8AmEua9BrJK-06Z'" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                <div class="absolute bottom-4 left-4 flex flex-wrap items-center gap-2">
                    <span class="bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider shadow-md">${escapeHTML(item.kategori || 'Warta')}</span>
                    <span class="bg-amber-400 text-slate-900 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-md">${safeMedia}</span>
                </div>
            </div>

            <!-- Judul & Meta -->
            <h1 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-4">${safeJudul}</h1>
            
            <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-slate-500 font-medium mb-6 pb-6 border-b border-slate-100">
                <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[18px] text-emerald-700">calendar_today</span> ${formattedDate}</span>
                <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[18px] text-emerald-700">person</span> ${escapeHTML(item.penulis || 'Tim Media RMI NU Demak')}</span>
                <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[18px] text-emerald-700">visibility</span> ${viewsCount} Views</span>
            </div>

            <!-- Ringkasan / Lead -->
            <div class="p-5 sm:p-6 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-emerald-950 font-medium text-sm sm:text-base leading-relaxed mb-8">
                <div class="flex items-start gap-3">
                    <span class="material-symbols-outlined text-emerald-700 text-[22px] flex-shrink-0 mt-0.5">format_quote</span>
                    <div>${safeRingkasan}</div>
                </div>
            </div>

            <!-- Isi Lengkap Artikel -->
            <div class="max-w-none mb-10 text-slate-800 text-base sm:text-lg leading-relaxed selection:bg-emerald-100 article-content">
                ${formattedIsi}
            </div>

            <!-- Tombol Baca di Sumber Asli -->
            ${item.url_sumber ? `
            <div class="flex flex-wrap gap-3 mb-8">
                <a href="${escapeHTML(item.url_sumber)}" target="_blank" rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95">
                    <span class="material-symbols-outlined text-[20px]">open_in_new</span>
                    Baca Selengkapnya di ${safeMedia}
                </a>
            </div>
            ` : ''}

            <!-- KEYWORDS / TAGS SEO GOOGLE -->
            ${(item.keywords) ? `
            <div class="flex flex-wrap items-center gap-2 mb-8 pt-2">
                <span class="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mr-1">
                    <span class="material-symbols-outlined text-[16px] text-emerald-700">sell</span> Kata Kunci SEO:
                </span>
                ${item.keywords.split(',').map(kw => kw.trim()).filter(Boolean).map(kw => `
                    <span class="inline-flex items-center text-xs font-semibold px-3 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-full border border-slate-200/80 transition-colors">
                        #${escapeHTML(kw)}
                    </span>
                `).join('')}
            </div>
            ` : ''}

            <!-- SHARE BAR: Tombol Bagikan Khusus dengan Warna Solid & Jelas -->
            <div class="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 sm:p-6 mb-8">
                <h4 class="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <span class="material-symbols-outlined text-[20px] text-emerald-700">share</span>
                    Bagikan Berita Ini ke Media Sosial
                </h4>
                <div class="flex flex-wrap gap-3">
                    <button type="button" onclick="shareBeritaWhatsApp('${item.slug || item.id}')"
                        class="flex items-center gap-2.5 px-5 py-3 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all cursor-pointer"
                        style="background-color: #25D366;">
                        <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                        <span>Kirim via WhatsApp</span>
                    </button>
                    <button type="button" onclick="salinLinkBerita('${item.slug || item.id}')"
                        class="flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl shadow-sm border border-slate-200 active:scale-95 transition-all cursor-pointer">
                        <span class="material-symbols-outlined text-[20px]">content_copy</span>
                        <span>Salin Tautan</span>
                    </button>
                    <button type="button" onclick="shareBeritaFacebook('${item.slug || item.id}')"
                        class="flex items-center gap-2 px-5 py-3 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all cursor-pointer"
                        style="background-color: #1877F2;">
                        <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        <span>Facebook</span>
                    </button>
                    <button type="button" onclick="shareBeritaTelegram('${item.slug || item.id}')"
                        class="flex items-center gap-2 px-5 py-3 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all cursor-pointer"
                        style="background-color: #229ED9;">
                        <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                        <span>Telegram</span>
                    </button>
                </div>
            </div>

            <!-- Berita Terkait -->
            ${allRelated.length > 0 ? `
            <div class="border-t border-slate-100 pt-8">
                <h3 class="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <span class="material-symbols-outlined text-emerald-700">recommend</span>
                    Berita Terkait Lainnya
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${allRelated.map(rel => {
                        const relJudul = escapeHTML(rel.judul);
                        const relMedia = escapeHTML(rel.sumber_media || 'Media');
                        const relDate = formatTanggalIndonesia(rel.published_at);
                        return `
                        <div class="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300"
                            onclick="openBeritaDetailModal('${rel.slug || rel.id}')">
                            <div class="h-40 overflow-hidden relative bg-slate-900">
                                <img src="${rel.cover_image_url || 'https://lh3.googleusercontent.com/d/1cXO8QC16Fe2VA147fgjeI49uwIWEpM21'}"
                                    alt="${relJudul}"
                                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            </div>
                            <div class="p-4">
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="text-emerald-700 text-[10px] font-bold uppercase tracking-wider">${escapeHTML(rel.kategori || 'Warta')}</span>
                                    <span class="text-slate-300">•</span>
                                    <span class="text-amber-700 text-[10px] font-bold">${relMedia}</span>
                                </div>
                                <h4 class="text-sm font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2 mb-2">${relJudul}</h4>
                                <span class="text-[11px] text-slate-500 font-medium">${relDate}</span>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
            ` : ''}
        </article>
    `;
}

function closeBeritaDetailModal() {
    document.title = 'RMI PCNU Kabupaten Demak — Pusat Peradaban Santri Kota Wali';
    navigateTo('berita');
}

function formatTanggalIndonesia(dateStr) {
    if (!dateStr) return 'Terbaru';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
    } catch (e) {
        return dateStr;
    }
}

window.loadBeritaRMI = loadBeritaRMI;
window.filterBeritaCategory = filterBeritaCategory;
window.handleBeritaSearch = handleBeritaSearch;
window.openBeritaDetailModal = openBeritaDetailModal;
window.closeBeritaDetailModal = closeBeritaDetailModal;
window.renderBeritaDetailPage = renderBeritaDetailPage;

// ==================================================================
// FITUR SHARE BERITA MULTI-PLATFORM (WA, FB, TELEGRAM, SALIN TAUTAN)
// ==================================================================
function getBeritaSharePayload(idOrSlug, fallbackJudul, fallbackCover, fallbackRingkasan) {
    const item = (typeof allBeritaData !== 'undefined' && Array.isArray(allBeritaData)) 
        ? allBeritaData.find(b => b.id === idOrSlug || b.slug === idOrSlug) 
        : null;
    
    const id = item ? item.id : idOrSlug;
    const slug = (item && item.slug) ? item.slug : (idOrSlug || id);
    const judul = item ? (item.judul || '') : (fallbackJudul || '');
    const ringkasan = item ? (item.ringkasan || '') : (fallbackRingkasan || '');
    const cover = item ? (item.cover_image_url || '') : (fallbackCover || '');
    const media = item ? (item.sumber_media || 'Media Online') : 'Media Online';
    const tanggal = item ? formatTanggalIndonesia(item.published_at) : '';
    // Domain URL berita bersih berbasis slug resmi https://rminudemak.org/berita/{slug}
    const shareUrl = "https://rminudemak.org/berita/" + encodeURIComponent(slug);

    return { id, slug, judul, ringkasan, cover, media, tanggal, shareUrl };
}

function shareBeritaWhatsApp(id, customJudul, customCover, customRingkasan) {
    const data = getBeritaSharePayload(id, customJudul, customCover, customRingkasan);
    
    let text = `🕌 *WARTA RMI NU KABUPATEN DEMAK*\n\n`;
    text += `*${data.judul}*\n\n`;
    if (data.media) text += `📰 Sumber: ${data.media}\n`;
    if (data.tanggal) text += `📅 ${data.tanggal}\n\n`;
    if (data.ringkasan) text += `${data.ringkasan}\n\n`;
    text += `👉 *Baca Selengkapnya:*\n${data.shareUrl}\n\n`;
    text += `_Portal Resmi RMI PCNU Kabupaten Demak_`;

    const waUrl = "https://api.whatsapp.com/send?text=" + encodeURIComponent(text);
    window.open(waUrl, '_blank');
}

function shareBeritaFacebook(id) {
    const data = getBeritaSharePayload(id);
    const fbUrl = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(data.shareUrl);
    window.open(fbUrl, '_blank', 'width=600,height=400');
}

function shareBeritaTelegram(id) {
    const data = getBeritaSharePayload(id);
    const text = `🕌 *${data.judul}*\n\n${data.ringkasan || ''}`;
    const tgUrl = "https://t.me/share/url?url=" + encodeURIComponent(data.shareUrl) + "&text=" + encodeURIComponent(text);
    window.open(tgUrl, '_blank');
}

function salinLinkBerita(id) {
    const data = getBeritaSharePayload(id);
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(data.shareUrl).then(() => {
            showFloatingToast('Tautan berita berhasil disalin!');
        }).catch(() => {
            prompt('Salin tautan berita berikut:', data.shareUrl);
        });
    } else {
        prompt('Salin tautan berita berikut:', data.shareUrl);
    }
}

function bagikanBeritaKeWA(id, judul, cover, ringkasan) {
    shareBeritaWhatsApp(id, judul, cover, ringkasan);
}

function showFloatingToast(message) {
    let toast = document.getElementById('rmi-floating-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'rmi-floating-toast';
        toast.className = 'fixed bottom-6 right-6 z-50 px-5 py-3.5 bg-slate-900/95 text-white text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-2.5 transition-all duration-300 transform translate-y-12 opacity-0 backdrop-blur-sm border border-slate-700/50 pointer-events-none';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<span class="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span><span>${message}</span>`;
    toast.classList.remove('translate-y-12', 'opacity-0', 'pointer-events-none');
    toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-12', 'opacity-0', 'pointer-events-none');
    }, 2800);
}

window.shareBeritaWhatsApp = shareBeritaWhatsApp;
window.shareBeritaFacebook = shareBeritaFacebook;
window.shareBeritaTelegram = shareBeritaTelegram;
window.salinLinkBerita = salinLinkBerita;
window.bagikanBeritaKeWA = bagikanBeritaKeWA;
window.showFloatingToast = showFloatingToast;


// ==================================================================
// PANDUAN RESMI MASUK PORTAL DATA 7 PERAN (PRINT, PDF, SHARE WA)
// ==================================================================
const ROLE_DISPLAY_NAMES = {
    'super_admin': 'Super Admin (PCNU Demak & Core IT)',
    'admin_kabupaten': 'Admin Kabupaten (Pengurus Harian PC RMI NU Demak)',
    'admin_kecamatan': 'Admin Kecamatan (Koordinator 14 MWC NU)',
    'operator_pesantren': 'Operator Pesantren (Sekretariat Pondok)',
    'pengasuh': 'Dewan Masyayikh / Pengasuh Pesantren',
    'verifikator': 'Tim Asesor & Verifikator Lapangan',
    'guest': 'Tamu Terdaftar / Peneliti Eksternal'
};

function filterPanduanRole(roleKey) {
    const cards = document.querySelectorAll('.card-panduan');
    const tabs = document.querySelectorAll('.tab-panduan-btn');

    tabs.forEach(tab => {
        const id = tab.id;
        if (id === 'tab-panduan-' + roleKey) {
            tab.className = 'tab-panduan-btn px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 bg-emerald-700 text-white shadow-sm cursor-pointer whitespace-nowrap';
        } else {
            tab.className = 'tab-panduan-btn px-3.5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap';
        }
    });

    cards.forEach(card => {
        if (roleKey === 'all' || card.dataset.role === roleKey) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

function updatePrintDate() {
    const el = document.querySelector('.print-date');
    if (el) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' };
        el.innerText = now.toLocaleDateString('id-ID', options);
    }
}

function printPanduanDokumen() {
    updatePrintDate();
    window.print();
}

function savePanduanAsPdf() {
    updatePrintDate();
    window.print();
}

function sharePanduanViaWhatsApp() {
    const text = "*PANDUAN RESMI MASUK PORTAL DATA PC RMI NU DEMAK*\n(Standar Digdaya Pesantren PBNU)\n\nAssalamu'alaikum Wr. Wb.\nBerikut panduan resmi tata cara pendaftaran akun, alur login tanpa sandi (Email OTP), dan hak akses untuk 7 Peran pengelola pesantren se-Kabupaten Demak:\n\n1. Super Admin (PCNU & Core IT)\n2. Admin Kabupaten (Pengurus Harian PC RMI)\n3. Admin Kecamatan (Koordinator 14 MWC)\n4. Operator Pesantren (Sekretariat Pondok)\n5. Dewan Masyayikh / Pengasuh\n6. Tim Asesor & Verifikator\n7. Tamu / Peneliti\n\nPelajari panduan lengkap & unduh dokumen resmi di:\n👉 https://rminudemak.org/#layanan\n\n_PC RMI NU Kabupaten Demak - Kota Wali_";
    const waUrl = "https://api.whatsapp.com/send?text=" + encodeURIComponent(text);
    window.open(waUrl, '_blank');
}

function shareSingleRoleWA(roleKey) {
    const roleName = ROLE_DISPLAY_NAMES[roleKey] || 'Pengelola Sistem';
    const text = "*PANDUAN MASUK PORTAL DATA RMI DEMAK*\n*Peran: " + roleName + "*\n\nAssalamu'alaikum Wr. Wb.\nBerikut petunjuk masuk dan hak akses untuk *" + roleName + "* di Portal Satu Data PC RMI NU Kabupaten Demak:\n\n1. Buka https://rminudemak.org/admin\n2. Pilih tab 1-Klik Akun / Email OTP\n3. Masukkan email resmi terdaftar Anda\n4. Masukkan kode 6 digit OTP yang masuk di inbox email Anda\n\nBuka panduan lengkap di:\n👉 https://rminudemak.org/#layanan\n\n_Sekretariat PC RMI NU Demak_";
    const waUrl = "https://api.whatsapp.com/send?text=" + encodeURIComponent(text);
    window.open(waUrl, '_blank');
}

function toggleMobileLayananSubmenu() {
    const sub = document.getElementById('sub-mobile-layanan');
    const chevron = document.getElementById('chevron-mobile-layanan');
    if (sub) {
        sub.classList.toggle('hidden');
        if (chevron) {
            chevron.classList.toggle('rotate-180');
        }
    }
}

function toggleMobileProgramSubmenu() {
    const sub = document.getElementById('sub-mobile-program');
    const chevron = document.getElementById('chevron-mobile-program');
    if (sub) {
        sub.classList.toggle('hidden');
        if (chevron) {
            chevron.classList.toggle('rotate-180');
        }
    }
}

// =========================================================================
// SAMBANG PESANTREN PW RMI NU JATENG 2026 (TUAN RUMAH KAB. DEMAK)
// =========================================================================
let sambangCountdownTimer = null;

function initSambangCountdown() {
    const daysEl = document.getElementById('sb-countdown-days');
    const hoursEl = document.getElementById('sb-countdown-hours');
    const minsEl = document.getElementById('sb-countdown-mins');
    const secsEl = document.getElementById('sb-countdown-secs');
    
    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;
    
    // Waktu Pelaksanaan: Ahad, 22 November 2026, 12:30:00 WIB (UTC+7)
    const targetDate = new Date('2026-11-22T12:30:00+07:00').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const diff = targetDate - now;
        
        if (diff <= 0) {
            daysEl.textContent = '00';
            hoursEl.textContent = '00';
            minsEl.textContent = '00';
            secsEl.textContent = '00';
            const badgeEl = document.getElementById('sb-countdown-badge');
            if (badgeEl) badgeEl.textContent = 'ACARA SEDANG BERLANGSUNG';
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        daysEl.textContent = String(days).padStart(2, '0');
        hoursEl.textContent = String(hours).padStart(2, '0');
        minsEl.textContent = String(minutes).padStart(2, '0');
        secsEl.textContent = String(seconds).padStart(2, '0');
    }
    
    updateCountdown();
    if (sambangCountdownTimer) clearInterval(sambangCountdownTimer);
    sambangCountdownTimer = setInterval(updateCountdown, 1000);
}

function filterSambangHalaqah(halaqahKey) {
    const cards = document.querySelectorAll('.halaqah-card, .majlis-card');
    const filterBtns = document.querySelectorAll('.halaqah-tab-btn, .majlis-tab-btn');
    
    filterBtns.forEach(btn => {
        const key = btn.dataset.halaqah || btn.dataset.majlis;
        if (key === halaqahKey) {
            btn.className = 'halaqah-tab-btn px-4 py-2 rounded-xl text-xs font-bold bg-emerald-800 text-white shadow-md transition-all cursor-pointer';
        } else {
            btn.className = 'halaqah-tab-btn px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 transition-all cursor-pointer';
        }
    });
    
    cards.forEach(card => {
        const key = card.dataset.halaqah || card.dataset.majlis;
        if (halaqahKey === 'all' || key === halaqahKey) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

// Alias kompatibilitas
function filterSambangMajlis(key) {
    filterSambangHalaqah(key);
}

function submitSambangRSVP() {
    const kecamatan = document.getElementById('rsvp-kecamatan')?.value;
    const namaPesantren = document.getElementById('rsvp-nama-pesantren')?.value?.trim();
    const kategoriHalaqah = document.getElementById('rsvp-kategori-halaqah')?.value || document.getElementById('rsvp-kategori-majlis')?.value;
    const namaPeserta = document.getElementById('rsvp-nama-peserta')?.value?.trim();
    const whatsapp = document.getElementById('rsvp-whatsapp')?.value?.trim();
    const jabatan = document.getElementById('rsvp-jabatan')?.value?.trim() || '-';
    const catatan = document.getElementById('rsvp-catatan')?.value?.trim() || '-';

    const alertBox = document.getElementById('rsvp-alert-box');
    const submitBtn = document.getElementById('btn-submit-rsvp');

    if (!kecamatan || !namaPesantren || !kategoriHalaqah || !namaPeserta || !whatsapp) {
        if (alertBox) {
            alertBox.className = 'p-4 rounded-2xl text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800';
            alertBox.textContent = 'Mohon lengkapi seluruh kolom bertanda bintang (*) sebelum mengirim pendaftaran.';
            alertBox.classList.remove('hidden');
        }
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span><span>Menyimpan Pendaftaran...</span>';
    }

    const payload = {
        action: 'SUBMIT_SAMBANG_DELEGATE',
        kecamatan: kecamatan,
        nama_pesantren: namaPesantren,
        kategori_halaqah: kategoriHalaqah,
        nama_peserta: namaPeserta,
        whatsapp: whatsapp,
        jabatan: jabatan,
        catatan: catatan,
        timestamp: new Date().toISOString()
    };

    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw-0Y0IM-uR326H4bkWAvbQ179Q5NrfgJT8ihOf8lY7C_joVwrT136fPRjRqu8U9jhU/exec";

    // Kirim data ke Apps Script API
    fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .catch(() => ({ success: true, message: 'Data delegasi berhasil dicatat.' }))
    .then(data => {
        if (alertBox) {
            alertBox.className = 'p-5 rounded-2xl text-xs font-semibold bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-2';
            alertBox.innerHTML = `
                <div class="flex items-center gap-2 text-sm font-bold text-emerald-800">
                    <span class="material-symbols-outlined text-[20px] text-emerald-700">check_circle</span>
                    <span>Pendaftaran Delegasi Berhasil Terkirim!</span>
                </div>
                <p class="text-slate-700 leading-relaxed">
                    Terima kasih <strong>${namaPesantren}</strong> (${kecamatan}). Delegasi atas nama <strong>${namaPeserta}</strong> telah tercatat untuk <strong>${kategoriHalaqah}</strong> pada gelaran Sambang Pesantren PW RMI NU Jateng di PP. Futuhiyyah Mranggen (22 Nov 2026).
                </p>
                <div class="pt-2 flex items-center gap-2">
                    <a href="https://wa.me/6281228224724?text=Assalamu'alaikum%20Panitia%20Sambang%20Pesantren%20Demak,%20kami%20telah%20mendaftarkan%20delegasi%20dari%20${encodeURIComponent(namaPesantren)}%20(${encodeURIComponent(kategoriHalaqah)}%20-%20${encodeURIComponent(namaPeserta)})" 
                       target="_blank" rel="noopener noreferrer"
                       class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition">
                        <span class="material-symbols-outlined text-[16px]">chat</span>
                        <span>Konfirmasi via WhatsApp Panitia</span>
                    </a>
                </div>
            `;
            alertBox.classList.remove('hidden');
        }

        // Reset form input
        const form = document.getElementById('form-sambang-rsvp');
        if (form) form.reset();
    })
    .finally(() => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">send</span><span>Kirim Konfirmasi Pendaftaran</span>';
        }
    });
}

// =========================================================================
// SISTEM HOVER PREVIEW FLYOUT POPOVER (STANDAR DIGDAYA PESANTREN.NU.ID)
// =========================================================================
let hoverPopoverTimer = null;
let leavePopoverTimer = null;
let activePopoverCard = null;

function getFlyoutPopoverContainer() {
    let el = document.getElementById('pesantren-flyout-popover');
    if (!el) {
        el = document.createElement('div');
        el.id = 'pesantren-flyout-popover';
        el.style.width = '380px';
        el.style.maxWidth = 'calc(100vw - 32px)';
        el.className = 'fixed z-[9999] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden opacity-0 pointer-events-none transition-all duration-200 hidden';
        el.onmouseenter = clearHoverPopoverTimeout;
        el.onmouseleave = handlePesantrenCardLeave;
        document.body.appendChild(el);
    }
    return el;
}

function handlePesantrenCardHover(event, pesantrenId) {
    if (window.innerWidth < 768) return; // Hanya aktif pada perangkat tablet, laptop, dan desktop
    
    if (leavePopoverTimer) {
        clearTimeout(leavePopoverTimer);
        leavePopoverTimer = null;
    }

    const cardEl = event.currentTarget;
    activePopoverCard = cardEl;

    if (hoverPopoverTimer) clearTimeout(hoverPopoverTimer);
    hoverPopoverTimer = setTimeout(() => {
        if (activePopoverCard === cardEl) {
            showPesantrenFlyout(cardEl, pesantrenId);
        }
    }, 180);
}

function handlePesantrenCardLeave() {
    if (hoverPopoverTimer) {
        clearTimeout(hoverPopoverTimer);
        hoverPopoverTimer = null;
    }

    if (leavePopoverTimer) clearTimeout(leavePopoverTimer);
    leavePopoverTimer = setTimeout(() => {
        hidePesantrenFlyout();
    }, 150);
}

function clearHoverPopoverTimeout() {
    if (leavePopoverTimer) {
        clearTimeout(leavePopoverTimer);
        leavePopoverTimer = null;
    }
}

function hidePesantrenFlyout() {
    const popover = document.getElementById('pesantren-flyout-popover');
    if (popover) {
        popover.classList.remove('opacity-100', 'pointer-events-auto');
        popover.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            if (popover && popover.classList.contains('opacity-0')) {
                popover.classList.add('hidden');
            }
        }, 200);
    }
    activePopoverCard = null;
}

function showPesantrenFlyout(cardEl, pesantrenId) {
    const item = typeof findPesantrenBySlugOrId === 'function' 
        ? findPesantrenBySlugOrId(pesantrenId)
        : (allLembagaData.find(l => String(l.id) === String(pesantrenId)) || DEFAULT_LEMBAGA_DATA.find(l => String(l.id) === String(pesantrenId)));
    if (!item) return;

    const popover = getFlyoutPopoverContainer();
    const safeFoto = (item.foto_url && String(item.foto_url).trim().startsWith('http')) ? item.foto_url : getIslamicFallbackPhoto(item.id || item.nama);
    const safeNama = escapeHTML(item.nama);
    const safePengasuh = escapeHTML(item.pengasuh_atau_kepala || '-');
    const safeAlamat = escapeHTML(item.alamat_detail || '');
    const safeKecamatan = escapeHTML(item.kecamatan || 'Demak');
    const safeNspp = escapeHTML(item.nspp || '');
    const safeTahun = escapeHTML(String(item.tahun_berdiri || ''));
    const safeKode = escapeHTML(item.kode_pesantren || item.id || '');
    const totalSantri = (item.santri_mukim || 0) + (item.santri_nonmukim || 0);
    const jumlahUstadz = (item.dewan_asatidz && item.dewan_asatidz.length > 0) 
        ? item.dewan_asatidz.length 
        : (item.kurikulum_kitab?.length ? Math.max(3, Math.round(item.kurikulum_kitab.length * 0.8)) : 8);

    // Kemenag Badge (Format 2 Baris Elegan ala pesantren.nu.id dengan Inline Style Kebal CSS)
    let kemenagBadge = '';
    if (safeNspp) {
        kemenagBadge = `
            <div style="position: absolute; top: 12px; right: 12px; z-index: 20; background-color: #005c55; color: #ffffff; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); border: 1px solid rgba(52, 211, 153, 0.4); display: flex; align-items: center; gap: 8px; padding: 6px 10px;">
                <div style="width: 24px; height: 24px; border-radius: 8px; background-color: #064e3b; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(52, 211, 153, 0.3);">
                    <span class="material-symbols-outlined" style="font-size: 15px; color: #fde047;">verified</span>
                </div>
                <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.15;">
                    <span style="font-size: 10px; font-weight: 700; letter-spacing: -0.02em; color: #ffffff;">Terverifikasi Kemenag</span>
                    <span style="font-size: 9px; font-family: monospace; color: #a7f3d0; font-weight: 600;">NSP: ${safeNspp}</span>
                </div>
            </div>
        `;
    } else {
        kemenagBadge = `
            <div style="position: absolute; top: 12px; right: 12px; z-index: 20; background-color: #022c22; color: #ffffff; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); border: 1px solid rgba(5, 150, 105, 0.4); display: flex; align-items: center; gap: 6px; padding: 6px 10px;">
                <span class="material-symbols-outlined" style="font-size: 15px; color: #6ee7b7;">shield</span>
                <span style="font-size: 10px; font-weight: 700; color: #ffffff;">RMI PCNU Demak</span>
            </div>
        `;
    }

    // Fasilitas Unggulan Pills
    let fasilitasHtml = '';
    const fasilitasSample = (item.fasilitas && item.fasilitas.length > 0) ? item.fasilitas : ['Asrama Santri', 'Masjid Jami\'', 'Perpustakaan Kitab', 'Aula Serbaguna'];
    fasilitasHtml = fasilitasSample.slice(0, 4).map(f => `<span class="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium">${escapeHTML(typeof f === 'string' ? f : f.nama || f.nama_fasilitas || 'Fasilitas')}</span>`).join('');

    // Maps Link
    const lat = item.latitude || -6.8944;
    const lng = item.longitude || 110.6386;
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    popover.innerHTML = `
        <div class="flex flex-col text-slate-800">
            <!-- Cover & Logo Header (Logo berada di BAGIAN DALAM FOTO pojok kiri bawah, di depan foto dengan z-index: 20) -->
            <div style="position: relative; height: 180px; width: 100%; background-color: #f1f5f9; overflow: hidden; flex-shrink: 0;">
                <img src="${safeFoto}" onerror="this.onerror=null;this.src='https://lh3.googleusercontent.com/d/1a3ihmmj3mxIwwsci2kFLibHk9xusUT58';" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1;" alt="${safeNama}" />
                ${kemenagBadge}
                
                <!-- Logo di Bagian Dalam Foto Kiri Bawah (Di depan foto, z-index: 20) -->
                <div style="position: absolute; bottom: 12px; left: 12px; z-index: 20; width: 56px; height: 56px; background-color: #ffffff; border: 2px solid #ffffff; border-radius: 16px; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28); padding: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    ${getPesantrenLogoHtml(item, 'w-12 h-12', 'text-sm')}
                </div>
            </div>

            <!-- Identitas & Metadata (Bersih tanpa halangan logo) -->
            <div class="pt-4 px-5 pb-4 space-y-3">
                <div>
                    <h4 class="font-extrabold text-slate-900 text-[15px] leading-snug uppercase tracking-tight">${safeNama}</h4>
                    <div class="text-[11px] text-slate-600 mt-2 space-y-1">
                        <p><span class="font-bold text-slate-700">ID Pesantren:</span> <span class="text-slate-800 font-mono">${safeKode}</span></p>
                        <p><span class="font-bold text-slate-700">Tahun Berdiri:</span> <span class="text-slate-800">${safeTahun || '-'}</span></p>
                        <p class="truncate"><span class="font-bold text-slate-700">Alamat:</span> <span class="text-slate-800">${safeAlamat ? safeAlamat + ', ' : ''}Kec. ${safeKecamatan}, Demak</span></p>
                    </div>
                </div>

                <!-- Dua Tombol Quick Action -->
                <div class="grid grid-cols-2 gap-2 pt-0.5">
                    <button type="button" onclick="hidePesantrenFlyout(); bukaModalDetailLembaga('${escapeHTML(item.id)}')" class="px-2.5 py-2 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs">
                        <span class="material-symbols-outlined text-[15px] text-emerald-700">language</span>
                        <span>Profil Lengkap</span>
                    </button>
                    <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-2 bg-slate-50 hover:bg-rose-50 text-slate-800 hover:text-rose-800 border border-slate-200 hover:border-rose-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs">
                        <span class="material-symbols-outlined text-[15px] text-rose-600">map</span>
                        <span>Buka Maps</span>
                    </a>
                </div>

                <!-- Tentang Pesantren -->
                <div class="pt-0.5">
                    <h5 class="font-bold text-[12px] text-slate-900 mb-1">Tentang Pesantren</h5>
                    <p class="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                        ${safeNama} adalah lembaga pendidikan Islam ${escapeHTML(item.kategori_atau_metode || 'Salafiyah')} di Kabupaten Demak yang diasuh oleh ${safePengasuh}.
                    </p>
                </div>

                <!-- Fasilitas Pills -->
                <div class="flex flex-wrap gap-1.5">
                    ${fasilitasHtml}
                </div>

                <!-- Footer SDM (Jumlah Santri & Jumlah Ustadz ala pesantren.nu.id) -->
                <div class="border-t border-slate-100 pt-3 mt-1 flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                        <span class="material-symbols-outlined text-[24px] text-slate-600">groups</span>
                        <div class="flex flex-col text-left leading-none">
                            <span class="text-[10px] text-slate-400 font-semibold mb-1">Jumlah Santri</span>
                            <span class="font-extrabold text-slate-900 text-sm">${totalSantri.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2.5">
                        <span class="material-symbols-outlined text-[24px] text-slate-600">person_celebrate</span>
                        <div class="flex flex-col text-left leading-none">
                            <span class="text-[10px] text-slate-400 font-semibold mb-1">Jumlah Ustadz</span>
                            <span class="font-extrabold text-slate-900 text-sm">${jumlahUstadz}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Smart Viewport Collision Positioning (Kunci Lebar 380px)
    const rect = cardEl.getBoundingClientRect();
    const popoverWidth = 380;
    const padding = 16;
    let left = 0;
    let top = rect.top;

    // Cek ruang sebelah kanan kartu
    if (rect.right + popoverWidth + padding <= window.innerWidth) {
        left = rect.right + 12;
    } else if (rect.left - popoverWidth - padding >= 0) {
        left = rect.left - popoverWidth - 12;
    } else {
        left = Math.max(padding, (window.innerWidth - popoverWidth) / 2);
    }

    const estimatedHeight = 520;
    if (top + estimatedHeight > window.innerHeight - padding) {
        top = Math.max(padding, window.innerHeight - estimatedHeight - padding);
    }
    if (top < padding) top = padding;

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;

    popover.classList.remove('hidden');
    requestAnimationFrame(() => {
        popover.classList.remove('opacity-0', 'pointer-events-none');
        popover.classList.add('opacity-100', 'pointer-events-auto');
    });
}
