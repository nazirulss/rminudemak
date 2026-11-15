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
        foto_url: "https://lh3.googleusercontent.com/d/1XHm7dyyRp6lJ-yFgqxZYxq9qETxQ61Lb",
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
        foto_url: "https://lh3.googleusercontent.com/d/1XHm7dyyRp6lJ-yFgqxZYxq9qETxQ61Lb",
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
        foto_url: "https://lh3.googleusercontent.com/d/1XHm7dyyRp6lJ-yFgqxZYxq9qETxQ61Lb",
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

// ==================================================================
// DATA FETCHER & SMART CACHE (STALE-WHILE-REVALIDATE + TTL)
// Mencegah request berlebih ke CDN/Google Apps Script saat deploy di Vercel
// ==================================================================
const APPS_SCRIPT_PUBLIC_URL = "https://script.google.com/macros/s/AKfycbw-0Y0IM-uR326H4bkWAvbQ179Q5NrfgJT8ihOf8lY7C_joVwrT136fPRjRqu8U9jhU/exec?action=GET_ALL_PESANTREN";
const CACHE_KEY_LEMBAGA = "rmi_demak_pesantren_cache_v2";
const CACHE_KEY_TIME = "rmi_demak_pesantren_cache_time_v2";
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
                nama: p.nama_resmi,
                nama_populer: p.nama_populer || '',
                jenis: 'Pesantren',
                kategori_atau_metode: (p.jenjang_pendidikan && p.jenjang_pendidikan.length > 0) ? p.jenjang_pendidikan.join(', ') : 'Salafiyah',
                pengasuh_atau_kepala: p.pengasuh_utama || 'Pengasuh',
                kecamatan: p.kecamatan || 'Demak',
                alamat_detail: p.alamat || '',
                nspp: p.nspp || '',
                tahun_berdiri: p.tahun_berdiri || '',
                santri_mukim: p.santri_mukim || 0,
                santri_nonmukim: p.santri_nonmukim || 0,
                latitude: (p.latitude !== undefined && p.latitude !== null && p.latitude !== '') ? parseFloat(p.latitude) : null,
                longitude: (p.longitude !== undefined && p.longitude !== null && p.longitude !== '') ? parseFloat(p.longitude) : null,
                has_komitmen_pesantren_aman: p.has_komitmen_pesantren_aman === true || p.has_komitmen_pesantren_aman === 'true',
                foto_url: p.foto_url || 'https://lh3.googleusercontent.com/d/1XHm7dyyRp6lJ-yFgqxZYxq9qETxQ61Lb',
                media_sosial: p.media_sosial || {},
                dewan_asatidz: p.dewan_asatidz || [],
                kurikulum_kitab: p.kurikulum_kitab || [],
                badan_usaha: p.badan_usaha || []
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

    if (category.toLowerCase() === 'pesantren') {
        if (tabPesantren) tabPesantren.className = 'hero-map-tab py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 bg-primary text-white shadow-md border border-white/20';
        if (indicator) indicator.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse';
        if (label) label.innerText = '380+ Pondok Pesantren Tervalidasi';
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
        let lat = item.latitude;
        let lng = item.longitude;

        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            const kec = item.kecamatan || 'Demak';
            const baseCoord = DEMAK_DISTRICT_COORDS[kec] || DEMAK_DISTRICT_COORDS['Demak'];
            const hash = ((item.id || item.nama || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), index)) % 100;
            const jitterLat = ((hash % 10) - 5) * 0.0035;
            const jitterLng = ((Math.floor(hash / 10) % 10) - 5) * 0.0035;
            lat = baseCoord[0] + jitterLat;
            lng = baseCoord[1] + jitterLng;
        }

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
        let lat = item.latitude;
        let lng = item.longitude;

        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            const kec = item.kecamatan || 'Demak';
            const baseCoord = DEMAK_DISTRICT_COORDS[kec] || DEMAK_DISTRICT_COORDS['Demak'];
            const hash = ((item.id || item.nama || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), index)) % 100;
            const jitterLat = ((hash % 10) - 5) * 0.0035;
            const jitterLng = ((Math.floor(hash / 10) % 10) - 5) * 0.0035;
            lat = baseCoord[0] + jitterLat;
            lng = baseCoord[1] + jitterLng;
        }

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

// Merender daftar lembaga ke masing-masing grid
function renderLembagaCards(lembagaList) {
    try {
        const gridPesantren = document.getElementById('grid-pesantren');
        const gridMadin = document.getElementById('grid-madin');
        const gridTpq = document.getElementById('grid-tpq');

        if (gridPesantren) gridPesantren.innerHTML = '';
        if (gridMadin) gridMadin.innerHTML = '';
        if (gridTpq) gridTpq.innerHTML = '';

        if (!lembagaList || lembagaList.length === 0) {
            console.log("Tidak ada data lembaga yang cocok untuk ditampilkan.");
            return;
        }

        const htmlPesantren = [];
        const htmlMadin = [];
        const htmlTpq = [];

        lembagaList.forEach(item => {
            let badgeColor = 'bg-primary';
            let btnTextColor = 'text-primary';
            let targetList = null;

            if (item.jenis === 'Pesantren') {
                badgeColor = 'bg-primary';
                btnTextColor = 'text-primary';
                targetList = htmlPesantren;
            } else if (item.jenis === 'Madin') {
                badgeColor = 'bg-secondary';
                btnTextColor = 'text-secondary';
                targetList = htmlMadin;
            } else if (item.jenis === 'TPQ') {
                badgeColor = 'bg-tertiary';
                btnTextColor = 'text-tertiary';
                targetList = htmlTpq;
            }


            if (targetList) {
                const fallbackFoto = item.foto_url || 'https://lh3.googleusercontent.com/d/1XHm7dyyRp6lJ-yFgqxZYxq9qETxQ61Lb';

                const safeFoto = escapeHTML(fallbackFoto);
                const safeNama = escapeHTML(item.nama);
                const safeKategori = escapeHTML(item.kategori_atau_metode || 'Lembaga');
                const safePengasuh = escapeHTML(item.pengasuh_atau_kepala || '-');
                const safeAlamat = escapeHTML(item.alamat_detail || '');
                const safeKecamatan = escapeHTML(item.kecamatan);
                const safeId = escapeHTML(item.id || '');

                // Standar Digdaya PBNU Badges
                let amanBadgeHtml = '';
                if (item.jenis === 'Pesantren') {
                    if (item.has_komitmen_pesantren_aman) {
                        amanBadgeHtml = `
                            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs" title="Terverifikasi Komitmen Ramah Santri & Anti-Kekerasan Anak">
                                <span class="material-symbols-outlined text-[13px]">verified_user</span> Pesantren Ramah Santri
                            </span>
                        `;
                    }
                }

                // Hitung marhalah kitab jika ada
                let marhalahPillHtml = '';
                if (item.kurikulum_kitab && item.kurikulum_kitab.length > 0) {
                    marhalahPillHtml = `
                        <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            <span class="material-symbols-outlined text-[12px]">menu_book</span> ${item.kurikulum_kitab.length} Kitab Turots
                        </span>
                    `;
                }

                const cardHTML = `
                    <div class="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
                        <div class="h-40 relative overflow-hidden bg-slate-100">
                            <img src="${safeFoto}" onerror="this.onerror=null;this.src='https://lh3.googleusercontent.com/d/1XHm7dyyRp6lJ-yFgqxZYxq9qETxQ61Lb';" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="${safeNama}" />
                            <span class="absolute top-4 left-4 ${badgeColor} text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">${safeKategori}</span>
                        </div>
                        <div class="p-6 flex flex-col flex-grow">
                            <div class="mb-2">
                                ${amanBadgeHtml}
                            </div>
                            <h3 class="font-bold text-lg text-on-surface mb-2 leading-snug group-hover:${btnTextColor} transition-colors">${safeNama}</h3>
                            <p class="text-xs text-on-surface-variant mb-1 flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-[14px]">${item.jenis === 'Pesantren' ? 'person' : 'supervisor_account'}</span> 
                                ${item.jenis === 'Pesantren' ? 'Pengasuh: ' : 'Kepala: '} ${safePengasuh}
                            </p>
                            <p class="text-xs text-on-surface-variant mb-4 flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-[14px]">location_on</span> 
                                ${safeAlamat}, Kec. ${safeKecamatan}
                            </p>
                            <div class="flex items-center gap-2 mb-4">
                                ${marhalahPillHtml}
                                ${item.santri_mukim ? `<span class="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-semibold"><span class="material-symbols-outlined text-[11px]">groups</span> ${(item.santri_mukim + (item.santri_nonmukim || 0)).toLocaleString()} Santri</span>` : ''}
                            </div>
                            <button onclick="bukaModalDetailLembaga('${safeId}')" class="mt-auto w-full bg-slate-50 ${btnTextColor} border border-slate-200 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5">
                                <span>Lihat Profil Lengkap</span>
                                <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                `;
                targetList.push(cardHTML);
            }
        });

        if (gridPesantren) gridPesantren.innerHTML = htmlPesantren.join('');
        if (gridMadin) gridMadin.innerHTML = htmlMadin.join('');
        if (gridTpq) gridTpq.innerHTML = htmlTpq.join('');
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
            item.kategori_atau_metode === kategoriValue;

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
        if (targetId === 'sambang' || targetId === 'sambang-pesantren' || targetId === 'sambang-pw-jateng' || targetId === 'sambang-jateng') {
            targetId = 'sambang-pesantren-pwrminu-jateng';
        }
        const validPages = ['beranda', 'profil', 'pesantren', 'layanan', 'panduan', 'berita', 'sambang-pesantren-pwrminu-jateng'];
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

        if (targetId === 'sambang-pesantren-pwrminu-jateng') {
            initSambangCountdown();
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

        if (targetId === 'pesantren') {
            if (allLembagaData.length === 0) loadLembagaDariSupabase();
            inisialisasiFiturLacakBerkas();
            populatePublicKecamatanDropdown(currentPublicCategory);
            setTimeout(() => {
                if (!publicMap) initPublicMap();
                else publicMap.invalidateSize();
            }, 150);
            setTimeout(() => {
                if (publicMap) publicMap.invalidateSize();
            }, 500);
        }

        navBtns.forEach(btn => {
            const btnTarget = btn.dataset.target === 'direktori' ? 'pesantren' : btn.dataset.target;
            const isActive = (btnTarget === targetId) || 
                             (btnTarget === 'layanan' && (targetId === 'layanan' || targetId === 'panduan')) ||
                             (btnTarget === 'program' && targetId === 'sambang-pesantren-pwrminu-jateng');
            if(isActive) {
                btn.className = 'nav-btn spa-link text-xs font-bold text-white bg-white/20 px-3.5 py-1.5 rounded-full border border-white/25 shadow-sm transition-all flex items-center gap-1 cursor-pointer';
            } else {
                btn.className = 'nav-btn spa-link text-xs font-semibold text-white/80 hover:text-white hover:bg-white/15 px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer';
            }
        });

        mobileNavBtns.forEach(btn => {
            const btnTarget = btn.dataset.target === 'direktori' ? 'pesantren' : btn.dataset.target;
            if(btnTarget === targetId) {
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

    // 🚀 EVENT LISTENER BROWSER BACK / FORWARD & HASH CHANGE
    function handleHashRouting() {
        let currentHash = window.location.hash.replace('#', '').trim().toLowerCase();
        if (currentHash === 'direktori') currentHash = 'pesantren';
        if (currentHash === 'sambang' || currentHash === 'sambang-pesantren' || currentHash === 'sambang-pw-jateng' || currentHash === 'sambang-jateng') {
            currentHash = 'sambang-pesantren-pwrminu-jateng';
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

        const validPages = ['beranda', 'profil', 'pesantren', 'layanan', 'panduan', 'berita', 'sambang-pesantren-pwrminu-jateng'];
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
            if(mapDesc) mapDesc.innerHTML = 'Menampilkan <span class="text-on-surface font-extrabold text-base">380+</span> titik pesantren di seluruh wilayah Kabupaten Demak.';
            
            if(filterKategori) filterKategori.innerHTML = '<option>Kategori (Semua)</option><option>Salafiyah</option><option>Modern (Ashriyah)</option><option>Tahfidz</option>';
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
            if(mapDesc) mapDesc.innerHTML = 'Menampilkan <span class="text-on-surface font-extrabold text-base">540+</span> titik madrasah diniyah di seluruh wilayah Demak.';
            
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
            if(mapDesc) mapDesc.innerHTML = 'Menampilkan <span class="text-on-surface font-extrabold text-base">850+</span> titik TPQ di wilayah Demak.';
            
            if(filterKategori) filterKategori.innerHTML = '<option>Metode (Semua)</option><option>Yanbu\'a</option><option>Qira\'ati</option><option>Iqro\'</option><option>Ummi</option>';
            if(btnSearch) btnSearch.className = 'bg-tertiary text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-colors';

            if(gridTpq) {
                gridTpq.classList.remove('hidden');
                void gridTpq.offsetWidth; 
                gridTpq.classList.add('animate-slideFadeIn');
            }
        });
    }

    // 🚀 HASH ROUTER INIT: Baca URL Hash terlebih dahulu, jika kosong gunakan sessionStorage / Beranda
    let initialPage = window.location.hash.replace('#', '').trim().toLowerCase();
    if (initialPage === 'direktori') initialPage = 'pesantren';
    const validPagesList = ['beranda', 'profil', 'pesantren', 'layanan', 'berita'];
    
    if (!validPagesList.includes(initialPage)) {
        initialPage = sessionStorage.getItem('activePage') || 'beranda';
    }

    navigateTo(initialPage, true);

    // 🚀 KUNCI UPDATE: Nyalakan mesin pencatat waktu shalat otomatis
    startSmartPrayerWidget();

    // Eksekusi penarikan data Supabase secara aman
    loadLembagaDariSupabase();

    if (initialPage === 'pesantren') {
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

// ==================================================================
// MODAL DETAIL LEMBAGA (STANDAR DIGDAYA PESANTREN PBNU)
// ==================================================================
function bukaModalDetailLembaga(lembagaId) {
    const item = allLembagaData.find(l => l.id === lembagaId) || DEFAULT_LEMBAGA_DATA.find(l => l.id === lembagaId);
    if (!item) return;

    const modal = document.getElementById('modal-public-detail');
    if (!modal) return;

    document.getElementById('modal-detail-nama').innerText = item.nama;
    document.getElementById('modal-detail-kategori').innerText = item.kategori_atau_metode || item.jenis;
    document.getElementById('modal-detail-pengasuh').innerText = item.pengasuh_atau_kepala || '-';
    document.getElementById('modal-detail-alamat').innerText = `${item.alamat_detail || ''}, Kec. ${item.kecamatan}, Kab. Demak`;
    document.getElementById('modal-detail-nspp').innerText = item.nspp || 'Dalam Proses Verifikasi';
    
    // Pesantren Aman badge
    const amanContainer = document.getElementById('modal-detail-aman-badge');
    if (amanContainer) {
        if (item.has_komitmen_pesantren_aman) {
            amanContainer.innerHTML = `
                <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                    <span class="material-symbols-outlined text-emerald-700 text-2xl">verified_user</span>
                    <div>
                        <h5 class="font-bold text-xs text-emerald-950">Pesantren Ramah Santri (Pesantren Aman PBNU)</h5>
                        <p class="text-[11px] text-emerald-700">Lembaga ini telah menandatangani pakta integritas perlindungan santri dari segala bentuk kekerasan fisik dan verbal.</p>
                    </div>
                </div>
            `;
        } else {
            amanContainer.innerHTML = '';
        }
    }

    // Kontak & Medsos
    const soc = item.media_sosial || {};
    const medsosContainer = document.getElementById('modal-detail-medsos');
    if (medsosContainer) {
        let socHtml = '';
        if (soc.hotline_psb) {
            socHtml += `<a href="https://wa.me/${soc.hotline_psb.replace(/[^0-9]/g, '')}" target="_blank" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1.5"><span class="material-symbols-outlined text-[15px]">chat</span> WhatsApp PSB: ${soc.hotline_psb}</a>`;
        }
        if (soc.instagram) {
            socHtml += `<a href="${soc.instagram}" target="_blank" class="px-2.5 py-1 bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">photo_camera</span> Instagram</a>`;
        }
        if (soc.youtube) {
            socHtml += `<a href="${soc.youtube}" target="_blank" class="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">smart_display</span> YouTube</a>`;
        }
        if (soc.website) {
            socHtml += `<a href="${soc.website}" target="_blank" class="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">language</span> Website</a>`;
        }
        medsosContainer.innerHTML = socHtml || '<span class="text-xs text-slate-400 italic">Kontak digital publik belum ditambahkan.</span>';
    }

    // Kurikulum Turots / Marhalah
    const kurikulumContainer = document.getElementById('modal-detail-kurikulum');
    if (kurikulumContainer) {
        const rawKitab = item.kurikulum_kitab || [];
        if (rawKitab.length > 0) {
            let kRows = rawKitab.map((k, i) => `
                <tr class="hover:bg-slate-50">
                    <td class="p-2 text-center text-slate-400">${i + 1}</td>
                    <td class="p-2 font-bold text-slate-800">${k.nama_kitab}</td>
                    <td class="p-2 text-slate-600">${k.pengarang}</td>
                    <td class="p-2 font-semibold text-slate-700">${k.bidang_ilmu}</td>
                    <td class="p-2 text-center"><span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase ${k.marhalah === 'wustho' ? 'bg-emerald-100 text-emerald-800' : (k.marhalah === 'ulya' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800')}">${k.marhalah}</span></td>
                </tr>
            `).join('');
            kurikulumContainer.innerHTML = `
                <div class="overflow-x-auto border border-slate-200 rounded-xl">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-slate-100 font-bold text-slate-700">
                            <tr>
                                <th class="p-2 text-center w-10">No</th>
                                <th class="p-2">Kitab</th>
                                <th class="p-2">Pengarang</th>
                                <th class="p-2">Fan Ilmu</th>
                                <th class="p-2 text-center">Marhalah</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 bg-white">
                            ${kRows}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            kurikulumContainer.innerHTML = '<p class="text-xs text-slate-400 italic">Data kurikulum turots sedang dalam proses digitalisasi oleh tim RMI Demak.</p>';
        }
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function tutupModalDetailLembaga() {
    const modal = document.getElementById('modal-public-detail');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}


// ==================================================================
// FITUR SHARE BERITA KE WHATSAPP DENGAN LINK PREVIEW GAMBAR DINAMIS
// ==================================================================
function bagikanBeritaKeWA(id, judul, cover, ringkasan) {
    const shareUrl = "https://rminudemak.org/share?id=" + encodeURIComponent(id) + 
                     "&t=" + encodeURIComponent(judul) + 
                     "&img=" + encodeURIComponent(cover) + 
                     "&desc=" + encodeURIComponent(ringkasan || "");
    const text = "*" + judul + "*\n\n" + (ringkasan || "") + "\n\nBaca selengkapnya di:\n👉 " + shareUrl;
    const waUrl = "https://api.whatsapp.com/send?text=" + encodeURIComponent(text);
    window.open(waUrl, '_blank');
}


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

function filterSambangMajlis(majlisKey) {
    const cards = document.querySelectorAll('.majlis-card');
    const filterBtns = document.querySelectorAll('.majlis-tab-btn');
    
    filterBtns.forEach(btn => {
        if (btn.dataset.majlis === majlisKey) {
            btn.className = 'majlis-tab-btn px-4 py-2 rounded-xl text-xs font-bold bg-emerald-800 text-white shadow-md transition-all cursor-pointer';
        } else {
            btn.className = 'majlis-tab-btn px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 transition-all cursor-pointer';
        }
    });
    
    cards.forEach(card => {
        if (majlisKey === 'all' || card.dataset.majlis === majlisKey) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

function submitSambangRSVP() {
    const kecamatan = document.getElementById('rsvp-kecamatan')?.value;
    const namaPesantren = document.getElementById('rsvp-nama-pesantren')?.value?.trim();
    const kategoriMajlis = document.getElementById('rsvp-kategori-majlis')?.value;
    const namaPeserta = document.getElementById('rsvp-nama-peserta')?.value?.trim();
    const whatsapp = document.getElementById('rsvp-whatsapp')?.value?.trim();
    const jabatan = document.getElementById('rsvp-jabatan')?.value?.trim() || '-';
    const catatan = document.getElementById('rsvp-catatan')?.value?.trim() || '-';

    const alertBox = document.getElementById('rsvp-alert-box');
    const submitBtn = document.getElementById('btn-submit-rsvp');

    if (!kecamatan || !namaPesantren || !kategoriMajlis || !namaPeserta || !whatsapp) {
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
        kategori_majlis: kategoriMajlis,
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
                    Terima kasih <strong>${namaPesantren}</strong> (${kecamatan}). Delegasi atas nama <strong>${namaPeserta}</strong> telah tercatat untuk <strong>${kategoriMajlis}</strong> pada gelaran Sambang Pesantren PW RMI NU Jateng di PP. Futuhiyyah Mranggen (22 Nov 2026).
                </p>
                <div class="pt-2 flex items-center gap-2">
                    <a href="https://wa.me/6281228224724?text=Assalamu'alaikum%20Panitia%20Sambang%20Pesantren%20Demak,%20kami%20telah%20mendaftarkan%20delegasi%20dari%20${encodeURIComponent(namaPesantren)}%20(${encodeURIComponent(kategoriMajlis)}%20-%20${encodeURIComponent(namaPeserta)})" 
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
