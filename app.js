// Entry Point: Data Sync, SPA Router & Initialization

function isValidPesantrenLogoUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) return false;
    // Filter dummy placeholder image warisan seed awal (1XHm7dyyRp6lJ-yFgqxZYxq9qETxQ61Lb)
    if (clean.includes('1XHm7dyyRp6lJ-yFgqxZYxq9qETxQ61Lb')) return false;
    if (/dummy|placeholder|sample|contoh/i.test(clean)) return false;
    return true;
}

function reRenderActiveDetailIfNeeded() {
    const cleanPath = (window.location.pathname || '').replace(/\.html$/i, '').replace(/\/+$/, '') || '/';
    if (cleanPath.startsWith('/pesantren/')) {
        const slug = cleanPath.substring('/pesantren/'.length).trim();
        if (slug && typeof renderPesantrenDetailPage === 'function') {
            const item = findPesantrenBySlugOrId(slug);
            if (item) {
                renderPesantrenDetailPage(slug, false);
                return;
            }
        }
    }
    const rawHash = (window.location.hash || '').replace('#', '').trim();
    if (rawHash.startsWith('pesantren/')) {
        const slug = rawHash.substring(rawHash.indexOf('/') + 1).trim();
        if (slug && typeof renderPesantrenDetailPage === 'function') {
            const item = findPesantrenBySlugOrId(slug);
            if (item) {
                renderPesantrenDetailPage(slug, false);
            }
        }
    } else if (rawHash.startsWith('pesantren-detail')) {
        let pId = '';
        if (rawHash.includes('?id=')) {
            pId = new URLSearchParams(rawHash.split('?')[1] || '').get('id');
        } else if (rawHash.includes('/')) {
            pId = rawHash.split('/')[1];
        }
        if (pId && typeof renderPesantrenDetailPage === 'function') {
            const item = findPesantrenBySlugOrId(pId);
            if (item) {
                renderPesantrenDetailPage(pId, false);
            }
        }
    }
}

function loadLembagaDariSupabase() {
    if (loadLembagaPromise) return loadLembagaPromise;

    loadLembagaPromise = (async () => {
        // 0. Cek Cache Lokal Terlebih Dahulu (Instant Load 0ms, hemat CDN/Apps Script)
        try {
            const cachedRaw = localStorage.getItem(CACHE_KEY_LEMBAGA);
            const cachedTime = localStorage.getItem(CACHE_KEY_TIME);
            const isFresh = cachedTime && (Date.now() - Number(cachedTime) < CACHE_TTL_MS);

            if (cachedRaw) {
                const parsed = JSON.parse(cachedRaw);
                if (Array.isArray(parsed) && parsed.length > 20) {
                    allLembagaData = parsed.map(item => ({
                        ...item,
                        logo_url: isValidPesantrenLogoUrl(item.logo_url) ? item.logo_url.trim() : ''
                    }));
                    isLivePesantrenDataLoaded = true;
                    if (typeof renderLembagaCards === 'function') renderLembagaCards(allLembagaData);
                    if (publicMap && typeof loadPublicMapMarkers === 'function') loadPublicMapMarkers(currentPublicCategory);
                    if (heroGisMap && typeof loadHeroMapMarkers === 'function') loadHeroMapMarkers(currentHeroCategory);
                    if (typeof populatePublicKecamatanDropdown === 'function') populatePublicKecamatanDropdown(currentPublicCategory);
                    if (typeof updateAllPlatformStats === 'function') updateAllPlatformStats(allLembagaData);
                    reRenderActiveDetailIfNeeded();

                    if (isFresh) {
                        console.log("⚡ Portal Publik: Memuat data dari cache lokal (hemat kuota Apps Script & CDN).");
                        return allLembagaData;
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
                    logo_url: (p.logo_url && isValidPesantrenLogoUrl(p.logo_url)) ? p.logo_url.trim() : '',
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
                isLivePesantrenDataLoaded = true;
                
                // Simpan ke Cache Lokal dengan Timestamp
                try {
                    localStorage.setItem(CACHE_KEY_LEMBAGA, JSON.stringify(allLembagaData));
                    localStorage.setItem(CACHE_KEY_TIME, String(Date.now()));
                } catch(e) {}

                if (typeof renderLembagaCards === 'function') renderLembagaCards(allLembagaData);
                if (publicMap && typeof loadPublicMapMarkers === 'function') loadPublicMapMarkers(currentPublicCategory);
                if (heroGisMap && typeof loadHeroMapMarkers === 'function') loadHeroMapMarkers(currentHeroCategory);
                if (typeof populatePublicKecamatanDropdown === 'function') populatePublicKecamatanDropdown(currentPublicCategory);
                if (typeof updateAllPlatformStats === 'function') updateAllPlatformStats(allLembagaData);
                reRenderActiveDetailIfNeeded();
                return allLembagaData;
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
                    isLivePesantrenDataLoaded = true;
                    if (typeof renderLembagaCards === 'function') renderLembagaCards(allLembagaData);
                    if (typeof updateAllPlatformStats === 'function') updateAllPlatformStats(allLembagaData);
                    reRenderActiveDetailIfNeeded();
                    return allLembagaData;
                }
            }
        } catch (e) {
            console.warn("Koneksi cloud offline:", e.message);
        }

        // 3. Fallback Terakhir ke Master Seed Lokal jika belum ada data
        if (allLembagaData.length === 0) {
            allLembagaData = [...DEFAULT_LEMBAGA_DATA];
            if (typeof renderLembagaCards === 'function') renderLembagaCards(allLembagaData);
            if (typeof updateAllPlatformStats === 'function') updateAllPlatformStats(allLembagaData);
        }
        reRenderActiveDetailIfNeeded();
        return allLembagaData;
    })();

    return loadLembagaPromise;
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
    
    const MULTI_PAGE_ROUTES = {
        'beranda': '/',
        'profil': '/profil',
        'direktori': '/direktori',
        'pesantren': '/pesantren',
        'madin': '/madin',
        'tpq': '/tpq',
        'layanan': '/layanan',
        'panduan': '/panduan',
        'berita': '/berita',
        'sambang-pesantren-pwrminu-jateng': '/sambang'
    };

    function navigateTo(targetId, updateHash = true) {
        // Normalisasi alias ramah pengguna
        if (targetId === 'direktori') targetId = 'pesantren';
        if (targetId === 'program' || targetId === 'sambang' || targetId === 'sambang-pesantren' || targetId === 'sambang-pw-jateng' || targetId === 'sambang-jateng') {
            targetId = 'sambang-pesantren-pwrminu-jateng';
        }
        const validPages = ['beranda', 'profil', 'pesantren', 'pesantren-detail', 'layanan', 'panduan', 'berita', 'berita-detail', 'sambang-pesantren-pwrminu-jateng'];
        if (!validPages.includes(targetId)) targetId = 'beranda';

        const targetPage = document.getElementById('page-' + targetId);
        // Jika target section berada di halaman HTML terpisah (Multi-Page Clean URL), arahkan langsung
        if (!targetPage && MULTI_PAGE_ROUTES[targetId]) {
            window.location.href = MULTI_PAGE_ROUTES[targetId];
            return;
        }

        if (updateHash && (targetId === 'pesantren-detail' || targetId === 'berita-detail')) {
            if (window.location.hash.replace('#', '') !== targetId) {
                history.pushState({ page: targetId }, '', '#' + targetId);
            }
        }

        pages.forEach(page => page.classList.remove('active'));
        if(targetPage) {
            targetPage.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        if (targetId === 'sambang-pesantren-pwrminu-jateng' && typeof initSambangCountdown === 'function') {
            initSambangCountdown();
        }

        if (targetId === 'berita' && typeof loadBeritaRMI === 'function') {
            if (typeof allBeritaData !== 'undefined' && allBeritaData.length === 0) loadBeritaRMI();
            else if (typeof renderBeritaFullPage === 'function') renderBeritaFullPage();
        }

        if (targetId === 'beranda' && typeof initHeroMap === 'function') {
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
            if (typeof inisialisasiFiturLacakBerkas === 'function') inisialisasiFiturLacakBerkas();
            if (typeof populatePublicKecamatanDropdown === 'function') populatePublicKecamatanDropdown(currentPublicCategory);
            if (targetId === 'pesantren' && typeof initPublicMap === 'function') {
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
        // 1. Format Bersih di halaman /berita: #slug-berita-anda
        // 2. Format Bersih Legacy: #berita/slug-berita-anda
        // 3. Format Kompatibilitas Legacy: #berita-detail?id=BRT-2026-001
        if (cleanPath === '/berita' && currentHash && !['berita', 'warta', 'berita-detail'].includes(currentHash)) {
            const slugPart = currentHash.startsWith('berita/') 
                ? rawHash.substring(rawHash.indexOf('/') + 1).trim()
                : rawHash.trim();
            if (slugPart && typeof openBeritaDetailModal === 'function') {
                if (currentHash.startsWith('berita/')) {
                    history.replaceState({ page: 'berita-detail', slug: slugPart }, '', '#' + encodeURIComponent(slugPart));
                }
                openBeritaDetailModal(slugPart);
                return;
            }
        }
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
        const defaultPageForPath = PATH_TO_PAGE[cleanPath] || 'beranda';
        const targetPage = validPages.includes(currentHash) ? currentHash : defaultPageForPath;
        navigateTo(targetPage, false);
    }

    window.addEventListener('hashchange', handleHashRouting);
    window.addEventListener('popstate', (e) => {
        const currentCleanPath = (window.location.pathname || '/').replace(/\.html$/i, '').replace(/\/+$/, '') || '/';
        if (currentCleanPath === '/berita') {
            if (typeof closeBeritaDetailModal === 'function') closeBeritaDetailModal();
        } else if (currentCleanPath.startsWith('/berita/')) {
            const slug = currentCleanPath.substring('/berita/'.length).trim();
            if (slug && typeof openBeritaDetailModal === 'function') openBeritaDetailModal(slug, false);
        } else if (currentCleanPath === '/direktori') {
            if (typeof kembaliKeKatalogPesantren === 'function') kembaliKeKatalogPesantren();
            if (typeof setDirektoriTab === 'function') setDirektoriTab('Semua', false);
        } else if (currentCleanPath === '/pesantren') {
            if (typeof kembaliKeKatalogPesantren === 'function') kembaliKeKatalogPesantren();
            if (typeof setDirektoriTab === 'function') setDirektoriTab('Pesantren', false);
        } else if (currentCleanPath === '/madin') {
            if (typeof kembaliKeKatalogPesantren === 'function') kembaliKeKatalogPesantren();
            if (typeof setDirektoriTab === 'function') setDirektoriTab('Madin', false);
        } else if (currentCleanPath === '/tpq') {
            if (typeof kembaliKeKatalogPesantren === 'function') kembaliKeKatalogPesantren();
            if (typeof setDirektoriTab === 'function') setDirektoriTab('TPQ', false);
        } else if (currentCleanPath.startsWith('/pesantren/')) {
            const slug = currentCleanPath.substring('/pesantren/'.length).trim();
            if (slug && typeof renderPesantrenDetailPage === 'function') renderPesantrenDetailPage(slug, false);
        } else {
            handleHashRouting();
        }
    });

    spaLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.target;
            if(target) navigateTo(target);
        });
    });

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            if (mobileMenu.classList.contains('hidden')) {
                mobileMenuBtn.innerHTML = '<span class="material-symbols-outlined">menu</span>';
            } else {
                mobileMenuBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';
            }
        });
    }

    // 2. LOGIKA HEADER (HIDE ON SCROLL)
    let lastScrollTop = 0;
    const header = document.getElementById('main-header');

    window.addEventListener('scroll', () => {
        if (!header) return;
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

    // 4. TOGGLE DIREKTORI AND LISTENERS FILTER (4-TAB SLIDER AGGREGATOR)
    const btnSemua = document.getElementById('btn-semua');
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
        [btnSemua, btnPesantren, btnMadin, btnTpq].forEach(btn => {
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
        if(btnSearch) btnSearch.className = 'text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-colors cursor-pointer';
    }

    function activateTabSemua(updateUrl = true) {
        resetAllStates();
        currentPublicCategory = 'Semua';
        if (!publicMap) initPublicMap(); else loadPublicMapMarkers('Semua');
        populatePublicKecamatanDropdown('Semua');
        if (toggleSlider) {
            toggleSlider.style.transform = 'translateX(0)';
            toggleSlider.className = 'absolute left-1.5 top-1.5 bottom-1.5 w-[calc(25%-3px)] bg-primary rounded-full transition-transform duration-500 ease-in-out shadow-md';
        }
        if (btnSemua) btnSemua.classList.replace('text-on-surface-variant', 'text-white');

        if(mapOverlay) mapOverlay.classList.add('bg-primary/10');
        if(mapStatsCard) mapStatsCard.classList.add('border-primary');
        if(mapIconBg) mapIconBg.classList.add('bg-primary/10');
        if(mapIcon) { mapIcon.className = 'material-symbols-outlined text-primary text-[20px] transition-colors duration-500'; mapIcon.innerText = 'hub'; }
        if(mapTitle) { mapTitle.className = 'text-base sm:text-lg font-bold text-primary transition-colors duration-500 truncate'; mapTitle.innerText = 'Satu Data Lembaga'; }
        const totalCount = (Array.isArray(allLembagaData) && allLembagaData.length) || 293;
        if(mapDesc) mapDesc.innerHTML = `Menampilkan total <span class="text-on-surface font-extrabold text-sm" id="map-stats-count">${totalCount}</span> titik lembaga (Pesantren, Madin &amp; TPQ) se-Kabupaten Demak.`;
        
        if(filterKategori) filterKategori.innerHTML = '<option value="">Semua Lembaga</option><option value="Pesantren">Pesantren</option><option value="Madin">Madrasah Diniyah</option><option value="TPQ">TPQ</option>';
        if(btnSearch) btnSearch.className = 'bg-primary text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-colors cursor-pointer';

        if(typeof renderLembagaCards === 'function') renderLembagaCards(allLembagaData);
        if(gridPesantren) {
            gridPesantren.classList.remove('hidden');
            void gridPesantren.offsetWidth; 
            gridPesantren.classList.add('animate-slideFadeIn');
        }

        if (updateUrl && window.location.pathname !== '/direktori') {
            history.pushState({ page: 'direktori', category: 'Semua' }, '', '/direktori');
        }
        document.title = 'Direktori Lembaga Keagamaan Demak — RMI NU Demak';
    }

    function activateTabPesantren(updateUrl = true) {
        resetAllStates();
        currentPublicCategory = 'Pesantren';
        if (!publicMap) initPublicMap(); else loadPublicMapMarkers('Pesantren');
        populatePublicKecamatanDropdown('Pesantren');
        if (toggleSlider) {
            toggleSlider.style.transform = 'translateX(100%)';
            toggleSlider.className = 'absolute left-1.5 top-1.5 bottom-1.5 w-[calc(25%-3px)] bg-primary rounded-full transition-transform duration-500 ease-in-out shadow-md';
        }
        if (btnPesantren) btnPesantren.classList.replace('text-on-surface-variant', 'text-white');

        if(mapOverlay) mapOverlay.classList.add('bg-primary/10');
        if(mapStatsCard) mapStatsCard.classList.add('border-primary');
        if(mapIconBg) mapIconBg.classList.add('bg-primary/10');
        if(mapIcon) { mapIcon.className = 'material-symbols-outlined text-primary text-[20px] transition-colors duration-500'; mapIcon.innerText = 'location_on'; }
        if(mapTitle) { mapTitle.className = 'text-base sm:text-lg font-bold text-primary transition-colors duration-500 truncate'; mapTitle.innerText = 'Pondok Pesantren'; }
        const pesantrenCount = (Array.isArray(allLembagaData) && allLembagaData.filter(l => l.jenis === 'Pesantren').length) || 293;
        if(mapDesc) mapDesc.innerHTML = `Menampilkan <span class="text-on-surface font-extrabold text-sm" id="map-stats-count">${pesantrenCount}</span> titik pesantren di seluruh wilayah Kabupaten Demak.`;
        
        if(filterKategori) filterKategori.innerHTML = '<option value="">Klasifikasi (Semua)</option><option value="SALAF">SALAF (Kitab Kuning)</option><option value="TAHFIDZ">TAHFIDZ (Al-Qur\'an)</option><option value="KOMBINASI">KOMBINASI (Salaf + Tahfidz)</option><option value="TERINTEGRASI">TERINTEGRASI (Pondok + Formal)</option><option value="MODERN">MODERN (Sistem Modern)</option>';
        if(btnSearch) btnSearch.className = 'bg-primary text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-colors cursor-pointer';

        if(typeof renderLembagaCards === 'function') renderLembagaCards(allLembagaData);
        if(gridPesantren) {
            gridPesantren.classList.remove('hidden');
            void gridPesantren.offsetWidth; 
            gridPesantren.classList.add('animate-slideFadeIn');
        }

        if (updateUrl && window.location.pathname !== '/pesantren') {
            history.pushState({ page: 'direktori', category: 'Pesantren' }, '', '/pesantren');
        }
        document.title = 'Direktori & Peta GIS Pondok Pesantren Demak — RMI NU Demak';
    }

    function activateTabMadin(updateUrl = true) {
        resetAllStates();
        currentPublicCategory = 'Madin';
        if (!publicMap) initPublicMap(); else loadPublicMapMarkers('Madin');
        populatePublicKecamatanDropdown('Madin');
        if (toggleSlider) {
            toggleSlider.style.transform = 'translateX(200%)';
            toggleSlider.className = 'absolute left-1.5 top-1.5 bottom-1.5 w-[calc(25%-3px)] bg-secondary rounded-full transition-transform duration-500 ease-in-out shadow-md';
        }
        if (btnMadin) btnMadin.classList.replace('text-on-surface-variant', 'text-white');

        if(mapOverlay) mapOverlay.className = 'absolute inset-0 bg-secondary/10 backdrop-blur-[2px] transition-colors duration-500';
        if(mapStatsCard) mapStatsCard.className = 'absolute bottom-6 left-6 md:bottom-10 md:left-10 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl max-w-sm border-l-4 border-secondary transition-colors duration-500';
        if(mapIconBg) mapIconBg.className = 'w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center transition-colors duration-500';
        if(mapIcon) { mapIcon.className = 'material-symbols-outlined text-secondary text-[20px] transition-colors duration-500'; mapIcon.innerText = 'school'; }
        if(mapTitle) { mapTitle.className = 'text-base sm:text-lg font-bold text-secondary transition-colors duration-500 truncate'; mapTitle.innerText = 'Madrasah Diniyah'; }
        if(mapDesc) mapDesc.innerHTML = 'Pangkalan data Madrasah Diniyah sedang dalam kurasi &amp; verifikasi bertahap bersama MWC NU.';
        
        if(filterKategori) filterKategori.innerHTML = '<option value="">Jenjang (Semua)</option><option value="Ula">Ula</option><option value="Wustho">Wustho</option><option value="Ulya">Ulya</option>';
        if(btnSearch) btnSearch.className = 'bg-secondary text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-colors cursor-pointer';

        if(gridMadin) {
            gridMadin.classList.remove('hidden');
            void gridMadin.offsetWidth; 
            gridMadin.classList.add('animate-slideFadeIn');
        }

        if (updateUrl && window.location.pathname !== '/madin') {
            history.pushState({ page: 'direktori', category: 'Madin' }, '', '/madin');
        }
        document.title = 'Direktori Madrasah Diniyah (Madin) Demak — RMI NU Demak';
    }

    function activateTabTpq(updateUrl = true) {
        resetAllStates();
        currentPublicCategory = 'TPQ';
        if (!publicMap) initPublicMap(); else loadPublicMapMarkers('TPQ');
        populatePublicKecamatanDropdown('TPQ');
        if (toggleSlider) {
            toggleSlider.style.transform = 'translateX(300%)';
            toggleSlider.className = 'absolute left-1.5 top-1.5 bottom-1.5 w-[calc(25%-3px)] bg-tertiary rounded-full transition-transform duration-500 ease-in-out shadow-md';
        }
        if (btnTpq) btnTpq.classList.replace('text-on-surface-variant', 'text-white');

        if(mapOverlay) mapOverlay.className = 'absolute inset-0 bg-tertiary/10 backdrop-blur-[2px] transition-colors duration-500';
        if(mapStatsCard) mapStatsCard.className = 'absolute bottom-6 left-6 md:bottom-10 md:left-10 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl max-w-sm border-l-4 border-tertiary transition-colors duration-500';
        if(mapIconBg) mapIconBg.className = 'w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center transition-colors duration-500';
        if(mapIcon) { mapIcon.className = 'material-symbols-outlined text-tertiary text-[20px] transition-colors duration-500'; mapIcon.innerText = 'menu_book'; }
        if(mapTitle) { mapTitle.className = 'text-base sm:text-lg font-bold text-tertiary transition-colors duration-500 truncate'; mapTitle.innerText = "Taman Pendidikan Al-Qur'an"; }
        if(mapDesc) mapDesc.innerHTML = 'Pangkalan data TPQ sedang dalam kurasi &amp; verifikasi bertahap bersama MWC NU.';
        
        if(filterKategori) filterKategori.innerHTML = '<option value="">Metode (Semua)</option><option value="Yanbu\'a">Yanbu\'a</option><option value="Qira\'ati">Qira\'ati</option><option value="Iqro\'">Iqro\'</option><option value="Ummi">Ummi</option>';
        if(btnSearch) btnSearch.className = 'bg-tertiary text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-colors cursor-pointer';

        if(gridTpq) {
            gridTpq.classList.remove('hidden');
            void gridTpq.offsetWidth; 
            gridTpq.classList.add('animate-slideFadeIn');
        }

        if (updateUrl && window.location.pathname !== '/tpq') {
            history.pushState({ page: 'direktori', category: 'TPQ' }, '', '/tpq');
        }
        document.title = 'Direktori TPQ (Taman Pendidikan Al-Qur\'an) Demak — RMI NU Demak';
    }

    function setDirektoriTab(category, updateUrl = true) {
        if (category === 'Semua') {
            activateTabSemua(updateUrl);
        } else if (category === 'Madin') {
            activateTabMadin(updateUrl);
        } else if (category === 'TPQ') {
            activateTabTpq(updateUrl);
        } else {
            activateTabPesantren(updateUrl);
        }
    }
    window.setDirektoriTab = setDirektoriTab;

    if (btnSemua) btnSemua.addEventListener('click', () => activateTabSemua(true));
    if (btnPesantren) btnPesantren.addEventListener('click', () => activateTabPesantren(true));
    if (btnMadin) btnMadin.addEventListener('click', () => activateTabMadin(true));
    if (btnTpq) btnTpq.addEventListener('click', () => activateTabTpq(true));

    // 🚀 MULTI-PAGE PATHNAME & LEGACY HASH ROUTER INIT
    const cleanPath = (window.location.pathname || '/').replace(/\.html$/i, '').replace(/\/+$/, '') || '/';
    const PATH_TO_PAGE = {
        '/': 'beranda',
        '/index': 'beranda',
        '/profil': 'profil',
        '/direktori': 'pesantren',
        '/pesantren': 'pesantren',
        '/madin': 'pesantren',
        '/tpq': 'pesantren',
        '/layanan': 'layanan',
        '/panduan': 'panduan',
        '/sambang': 'sambang-pesantren-pwrminu-jateng',
        '/berita': 'berita'
    };
    let activeInitialPage = PATH_TO_PAGE[cleanPath] || 'beranda';

    // 1. Dukungan Direct Clean URL untuk Berita: /berita/[slug]
    if (cleanPath.startsWith('/berita/')) {
        const slug = cleanPath.substring('/berita/'.length).trim();
        if (slug && typeof openBeritaDetailModal === 'function') {
            openBeritaDetailModal(slug, false);
            activeInitialPage = 'berita-detail';
        }
    }
    // 2. Dukungan Direct Clean URL untuk Pesantren: /pesantren/[slug]
    else if (cleanPath.startsWith('/pesantren/')) {
        const slug = cleanPath.substring('/pesantren/'.length).trim();
        if (slug && typeof renderPesantrenDetailPage === 'function') {
            renderPesantrenDetailPage(slug, false);
            activeInitialPage = 'pesantren-detail';
        }
    }
    // 3. Parameter Pengalihan Medsos/Serverless (?b= untuk berita, ?p= untuk pesantren)
    else {
        const urlParams = new URLSearchParams(window.location.search || '');
        const bParam = urlParams.get('b');
        const pParam = urlParams.get('p');
        if (bParam && typeof openBeritaDetailModal === 'function') {
            history.replaceState({ page: 'berita-detail', slug: bParam }, '', '/berita/' + encodeURIComponent(bParam));
            openBeritaDetailModal(bParam, false);
            activeInitialPage = 'berita-detail';
        } else if (pParam && typeof renderPesantrenDetailPage === 'function') {
            history.replaceState({ page: 'pesantren-detail', slug: pParam }, '', '/pesantren/' + encodeURIComponent(pParam));
            renderPesantrenDetailPage(pParam, false);
            activeInitialPage = 'pesantren-detail';
        } else if (window.location.hash) {
            const rawHash = window.location.hash.replace('#', '').trim();
            const lowerHash = rawHash.toLowerCase();

            // Normalisasi link lama berbasis hash ke URL bersih
            if (cleanPath === '/berita' && rawHash && !['berita', 'warta', 'berita-detail'].includes(lowerHash)) {
                const targetSlug = lowerHash.startsWith('berita/') ? rawHash.substring('berita/'.length) : rawHash;
                history.replaceState({ page: 'berita-detail', slug: targetSlug }, '', '/berita/' + encodeURIComponent(targetSlug));
                if (typeof openBeritaDetailModal === 'function') {
                    openBeritaDetailModal(targetSlug, false);
                    activeInitialPage = 'berita-detail';
                }
            } else if (cleanPath === '/direktori' && lowerHash.startsWith('pesantren/')) {
                const targetSlug = rawHash.substring('pesantren/'.length);
                history.replaceState({ page: 'pesantren-detail', slug: targetSlug }, '', '/pesantren/' + encodeURIComponent(targetSlug));
                if (typeof renderPesantrenDetailPage === 'function') {
                    renderPesantrenDetailPage(targetSlug, false);
                    activeInitialPage = 'pesantren-detail';
                }
            } else if (cleanPath === '/' || cleanPath === '/index') {
                if (lowerHash.startsWith('pesantren/') || lowerHash.startsWith('pesantren-detail')) {
                    const targetSlug = lowerHash.startsWith('pesantren/') 
                        ? rawHash.substring('pesantren/'.length).trim() 
                        : (new URLSearchParams(rawHash.split('?')[1] || '').get('id') || rawHash);
                    window.location.replace('/pesantren/' + encodeURIComponent(targetSlug));
                    return;
                }
                if (lowerHash.startsWith('berita/') || lowerHash.startsWith('berita-detail')) {
                    const targetSlug = lowerHash.startsWith('berita/') 
                        ? rawHash.substring('berita/'.length).trim() 
                        : (new URLSearchParams(rawHash.split('?')[1] || '').get('id') || rawHash);
                    window.location.replace('/berita/' + encodeURIComponent(targetSlug));
                    return;
                }
                if (MULTI_PAGE_ROUTES[lowerHash] && lowerHash !== 'beranda') {
                    window.location.replace(MULTI_PAGE_ROUTES[lowerHash]);
                    return;
                }
                if (lowerHash === 'direktori') { window.location.replace('/direktori'); return; }
                if (lowerHash === 'sambang' || lowerHash === 'program') { window.location.replace('/sambang'); return; }
                activeInitialPage = lowerHash;
                handleHashRouting();
            } else {
                activeInitialPage = lowerHash;
                handleHashRouting();
            }
        } else {
            navigateTo(activeInitialPage, false);
        }

        // Inisialisasi tab aktif direktori sesuai cleanPath
        if (cleanPath === '/pesantren') {
            setDirektoriTab('Pesantren', false);
        } else if (cleanPath === '/madin') {
            setDirektoriTab('Madin', false);
        } else if (cleanPath === '/tpq') {
            setDirektoriTab('TPQ', false);
        } else if (cleanPath === '/direktori') {
            setDirektoriTab('Semua', false);
        }
    }

    // 🚀 KUNCI UPDATE: Nyalakan mesin pencatat waktu shalat otomatis
    if (typeof startSmartPrayerWidget === 'function') startSmartPrayerWidget();

    // Eksekusi penarikan data Supabase secara aman
    if (typeof loadLembagaDariSupabase === 'function') loadLembagaDariSupabase();
    if (typeof updateAllPlatformStats === 'function') updateAllPlatformStats(allLembagaData);

    // Memuat arsip warta media RMI Demak terkini hanya pada halaman yang membutuhkannya
    if (typeof loadBeritaRMI === 'function') loadBeritaRMI();

    if ((activeInitialPage === 'pesantren' || activeInitialPage.startsWith('pesantren/')) && typeof initPublicMap === 'function') {
        setTimeout(initPublicMap, 250);
        setTimeout(() => { if (typeof publicMap !== 'undefined' && publicMap) publicMap.invalidateSize(); }, 600);
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


// ==========================================
// FASE 6: PWA SERVICE WORKER & INIT FAVORITE BADGE
// ==========================================
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Diamkan exception saat diuji crawler / headless bot agar tidak mencemari GSC console
        });
    });
}
document.addEventListener('DOMContentLoaded', () => {
    if (typeof updateFavoriteCountBadge === 'function') updateFavoriteCountBadge();
});

