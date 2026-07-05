// ==========================================
// INISIALISASI SUPABASE CLIENT (ANTI-BENTROK CDN)
// ==========================================
const supabaseUrl = 'https://soqbfdyfkewahvemktmw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcWJmZHlma2V3YWh2ZW1rdG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMDY3NDUsImV4cCI6MjA5ODc4Mjc0NX0.FQuuav23hkNLKodUgWWWeOYM5SIGmoJl-UyP5oKfrAY';

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Menyimpan seluruh data lembaga hasil fetch, supaya bisa difilter tanpa fetch ulang
let allLembagaData = [];

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

// Fungsi mengambil data lembaga dari Supabase
async function loadLembagaDariSupabase() {
    try {
        const { data: lembagaList, error } = await supabaseClient
            .from('lembaga')
            .select('*')
            .order('nama', { ascending: true });

        if (error) {
            console.error('Gagal mengambil data dari Supabase:', error.message);
            return;
        }

        allLembagaData = lembagaList || [];
        renderLembagaCards(allLembagaData);
    } catch (catchedError) {
        console.error("Sistem mengalami kendala saat mengambil data:", catchedError);
    }
}

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
                const fallbackFoto = item.foto_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80';

                const safeFoto = escapeHTML(fallbackFoto);
                const safeNama = escapeHTML(item.nama);
                const safeKategori = escapeHTML(item.kategori_atau_metode || 'Lembaga');
                const safePengasuh = escapeHTML(item.pengasuh_atau_kepala || '-');
                const safeAlamat = escapeHTML(item.alamat_detail || '');
                const safeKecamatan = escapeHTML(item.kecamatan);

                const cardHTML = `
                    <div class="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
                        <div class="h-40 relative overflow-hidden bg-slate-100">
                            <img src="${safeFoto}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80';" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="${safeNama}" />
                            <span class="absolute top-4 left-4 ${badgeColor} text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">${safeKategori}</span>
                        </div>
                        <div class="p-6 flex flex-col flex-grow">
                            <h3 class="font-bold text-lg text-on-surface mb-2 leading-snug group-hover:${btnTextColor} transition-colors">${safeNama}</h3>
                            <p class="text-xs text-on-surface-variant mb-1 flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-[14px]">${item.jenis === 'Pesantren' ? 'person' : 'supervisor_account'}</span> 
                                ${item.jenis === 'Pesantren' ? 'Pengasuh: ' : 'Kepala: '} ${safePengasuh}
                            </p>
                            <p class="text-xs text-on-surface-variant mb-6 flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-[14px]">location_on</span> 
                                ${safeAlamat}, Kec. ${safeKecamatan}
                            </p>
                            <button class="mt-auto w-full bg-slate-50 ${btnTextColor} border border-slate-200 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-100 transition-colors">Lihat Profil Lembaga</button>
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

    const filtered = allLembagaData.filter(item => {
        const matchKeyword = !keyword ||
            (item.nama && item.nama.toLowerCase().includes(keyword)) ||
            (item.pengasuh_atau_kepala && item.pengasuh_atau_kepala.toLowerCase().includes(keyword));

        const matchKecamatan = !kecamatanValue ||
            /\(Semua\)/.test(kecamatanValue) ||
            item.kecamatan === kecamatanValue;

        const matchKategori = !kategoriValue ||
            /\(Semua\)/.test(kategoriValue) ||
            item.kategori_atau_metode === kategoriValue;

        return matchKeyword && matchKecamatan && matchKategori;
    });

    renderLembagaCards(filtered);
}

// ==========================================
// EVENT LISTENER UTAMA (DOM LOADED)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. SPA ROUTING & MENU MOBILE
    const spaLinks = document.querySelectorAll('.spa-link');
    const pages = document.querySelectorAll('.page-section');
    const navBtns = document.querySelectorAll('.nav-btn');
    const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    function navigateTo(targetId) {
        // 🚀 UPDATE: Simpan status nama halaman aktif ke sessionStorage sebelum dialihkan
        sessionStorage.setItem('activePage', targetId);

        pages.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById('page-' + targetId);
        if(targetPage) {
            targetPage.classList.add('active');
            window.scrollTo(0, 0);
        }

        if (targetId === 'pesantren' && allLembagaData.length === 0) {
            loadLembagaDariSupabase();
        }

        navBtns.forEach(btn => {
            if(btn.dataset.target === targetId) {
                btn.classList.add('text-on-primary', 'border-b-2', 'border-on-primary', 'pb-1', 'font-semibold');
                btn.classList.remove('text-on-primary/80', 'font-medium');
            } else {
                btn.classList.remove('text-on-primary', 'border-b-2', 'border-on-primary', 'pb-1', 'font-semibold');
                btn.classList.add('text-on-primary/80', 'font-medium');
            }
        });

        mobileNavBtns.forEach(btn => {
            if(btn.dataset.target === targetId) {
                btn.classList.add('font-bold', 'text-white');
                btn.classList.remove('text-on-primary/80');
            } else {
                btn.classList.remove('font-bold', 'text-white');
                btn.classList.add('text-on-primary/80');
            }
        });

        if(!mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
            mobileMenuBtn.innerHTML = '<span class="material-symbols-outlined">menu</span>';
        }
    }

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
            header.classList.add('bg-primary/95', 'backdrop-blur-md');
        } else {
            header.classList.remove('bg-primary/95', 'backdrop-blur-md');
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

    // Running session router bawaan lo kemarin
    const savedPage = sessionStorage.getItem('activePage');
    if (savedPage) {
        navigateTo(savedPage);
    } else {
        navigateTo('beranda');
    }

    // 🚀 KUNCI UPDATE: Nyalakan mesin pencatat waktu shalat otomatis
    startSmartPrayerWidget();

    // Eksekusi penarikan data Supabase secara aman
    loadLembagaDariSupabase();
});

// ==================================================================
// NEW FEATURE: ENGINE JADWAL SHALAT AUTOMATION (KABUPATEN DEMAK)
// ==================================================================
const jadwalShalatDemakSetahun = {
    subuh: "04:26", dzuhur: "11:44", ashar: "15:02", maghrib: "17:34", isya: "18:48"
};

function startSmartPrayerWidget() {
    const dateMasehiEl = document.getElementById('widget-date-masehi');
    const dateHijriahEl = document.getElementById('widget-date-hijriah');
    const prayerNameEl = document.getElementById('widget-next-prayer-name');
    const prayerTimeEl = document.getElementById('widget-next-prayer-time');
    const countdownEl = document.getElementById('widget-countdown');

    if (!dateMasehiEl) return; // Proteksi agar tidak error jika sedang tidak di halaman Beranda

    // 1. Tampilkan Tanggal Masehi Lokal
    const opsiMasehi = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const hariIni = new Date();
    dateMasehiEl.innerText = hariIni.toLocaleDateString('id-ID', opsiMasehi);

    // 2. Kalkulator Hijriah (Koreksi +1 Hari Standar Kemenag Jawa Tengah)
    const hijriFormatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' });
    let tanggalHijriahRaw = hijriFormatter.format(new Date(hariIni.getTime() + 24 * 60 * 60 * 1000));
    dateHijriahEl.innerText = tanggalHijriahRaw.replace("AH", "H");

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
            targetNama = "Menuju Subuh"; targetWaktuStr = jadwalShalatDemakSetahun.subuh;
        } else if (waktuMenitSekarang < mDzuhur) {
            targetNama = "Menuju Dzuhur"; targetWaktuStr = jadwalShalatDemakSetahun.dzuhur;
        } else if (waktuMenitSekarang < mAshar) {
            targetNama = "Menuju Ashar"; targetWaktuStr = jadwalShalatDemakSetahun.ashar;
        } else if (waktuMenitSekarang < mMaghrib) {
            targetNama = "Menuju Maghrib"; targetWaktuStr = jadwalShalatDemakSetahun.maghrib;
        } else if (waktuMenitSekarang < mIsya) {
            targetNama = "Menuju Isya"; targetWaktuStr = jadwalShalatDemakSetahun.isya;
        } else {
            targetNama = "Menuju Subuh"; targetWaktuStr = jadwalShalatDemakSetahun.subuh; isBesok = true;
        }

        prayerNameEl.innerText = targetNama;
        prayerTimeEl.innerText = `${targetWaktuStr} WIB`;

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
        countdownEl.innerText = `${formatDuaDigit(jamSisa)}:${formatDuaDigit(menitSisa)}:${formatDuaDigit(detikSisa)}`;
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}