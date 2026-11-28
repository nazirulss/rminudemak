// Module: Core Utilities, Configuration & Seed Data

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
        id: "c5f73ede-ee1b-499a-b431-4362da40708d",
        kode_pesantren: "RMI-DMK-000001",
        nama: "ROUDLOTUL MUBAROKAH",
        nama_populer: "PPTQ Roudlotul Mubarokah Rimbukidul",
        jenis: "Pesantren",
        klasifikasi: "SALAF",
        kategori_atau_metode: "Salafiyah & Tahfidz",
        pengasuh_atau_kepala: "Nyai Hj. Nasichatul Fuadah",
        kecamatan: "Karangawen",
        desa: "Rejosari",
        alamat_detail: "Jl. Kauman Rimbukidul 01/07, Rejosari, Karangawen, Demak",
        latitude: -7.0543,
        longitude: 110.5621,
        nspp: "510033210001",
        tahun_berdiri: 1983,
        santri_mukim: 55,
        santri_nonmukim: 0,
        has_komitmen_pesantren_aman: true,
        logo_url: "https://lh3.googleusercontent.com/d/1HaRmJx1vqAT3D_uQ9MZS_rKvCVKHnRSQ",
        foto_url: "https://lh3.googleusercontent.com/d/139UgfvNclvKK2qokvKfF__6MIC4aaZlF",
        media_sosial: {
            website: "https://mubarokah.my.id",
            instagram: "https://www.instagram.com/pptq.karangawen",
            youtube: "https://www.youtube.com/@mubarakahTV"
        },
        dewan_asatidz: [
            { nama: "Nyai Hj. Nasichatul Fuadah", jabatan: "PENGASUH", kategori: "ustadzah", spesialisasi: "Dirasah Islamiyah & Turots", pendidikan: "Pondok Pesantren", is_primary: true },
            { nama: "Robiatul Awaliyah, Ulin Nuha, Nazirul Muhammad, Izza Nazila", jabatan: "Wakil Pengasuh", kategori: "ustadz", spesialisasi: "Turots & Kitab Kuning", pendidikan: "Pesantren", is_primary: false }
        ],
        kurikulum_kitab: [
            { marhalah: "ula", nama_kitab: "Safinatun Najah", pengarang: "Salim bin Samir", bidang_ilmu: "Fiqih Dasar" },
            { marhalah: "ula", nama_kitab: "Al-Jurumiyah", pengarang: "Ibnu Ajurrum", bidang_ilmu: "Nahwu" }
        ],
        fasilitas: [
            { nama: "Masjid", kategori: "MOSQUE", kondisi: "Baik" },
            { nama: "Asrama Santri", kategori: "DORMITORY", kondisi: "Baik" },
            { nama: "Perpustakaan", kategori: "LIBRARY", kondisi: "Baik" },
            { nama: "Laboratorium Komputer / Multimedia", kategori: "LAB_KOMPUTER", kondisi: "Baik" }
        ],
        galeri_foto: [
            { url: "https://lh3.googleusercontent.com/d/1CxNv4mie966iB62ZvaZg6ZWsByPxn-Ql", judul: "Aula" },
            { url: "https://lh3.googleusercontent.com/d/1zLwrv-P6rNXL4CCUjF7oOVtntERsxRgM", judul: "Mushola" },
            { url: "https://lh3.googleusercontent.com/d/1WlqEvQfmHkKuRw4zX4wC1vCRcSG7w6-e", judul: "Gedung Utama" }
        ]
    },
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

function toggleMobileLayananSubmenu() {
    const sub = document.getElementById('sub-mobile-layanan');
    const chevron = document.getElementById('chevron-mobile-layanan');
    if (sub) {
        sub.classList.toggle('hidden');
        if (chevron) chevron.classList.toggle('rotate-180');
    }
}

function toggleMobileProgramSubmenu() {
    const sub = document.getElementById('sub-mobile-program');
    const chevron = document.getElementById('chevron-mobile-program');
    if (sub) {
        sub.classList.toggle('hidden');
        if (chevron) chevron.classList.toggle('rotate-180');
    }
}

function tutupModalDetailLembaga() {
    const modal = document.getElementById('modal-public-detail');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

window.toggleMobileLayananSubmenu = toggleMobileLayananSubmenu;
window.toggleMobileProgramSubmenu = toggleMobileProgramSubmenu;
window.tutupModalDetailLembaga = tutupModalDetailLembaga;

// ==================================================================
// DATA FETCHER & SMART CACHE (STALE-WHILE-REVALIDATE + TTL)
// Mencegah request berlebih ke CDN/Google Apps Script saat deploy di Vercel
// ==================================================================
const APPS_SCRIPT_PUBLIC_URL = "https://script.google.com/macros/s/AKfycbw-0Y0IM-uR326H4bkWAvbQ179Q5NrfgJT8ihOf8lY7C_joVwrT136fPRjRqu8U9jhU/exec?action=GET_ALL_PESANTREN";
const CACHE_KEY_LEMBAGA = "rmi_demak_pesantren_cache_v7";
const CACHE_KEY_TIME = "rmi_demak_pesantren_cache_time_v7";
const CACHE_TTL_MS = 15 * 60 * 1000; // Cache berlaku 15 menit

let isLivePesantrenDataLoaded = false;
let loadLembagaPromise = null;

// Validasi apakah logo_url merupakan logo asli valid, bukan gambar placeholder/dummy
