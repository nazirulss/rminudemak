// Module: Leaflet Geospasial Maps (Hero & Public GIS)

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

function loadPublicMapMarkers(activeCategory = 'Semua', activeKecamatan = '') {
    if (!publicMap) return;

    // Bersihkan marker lama
    publicMapMarkers.forEach(m => publicMap.removeLayer(m));
    publicMapMarkers = [];

    const isSemua = !activeCategory || activeCategory.toLowerCase() === 'semua';

    // Filter data berdasarkan kategori aktif
    let filtered = allLembagaData.filter(l => {
        if (isSemua) return true;
        return (l.jenis || '').toLowerCase() === activeCategory.toLowerCase();
    });

    if (activeKecamatan && !/\(Semua\)/.test(activeKecamatan)) {
        const normFilter = normalizeKecamatanName(activeKecamatan).toLowerCase();
        filtered = filtered.filter(l => normalizeKecamatanName(l.kecamatan).toLowerCase() === normFilter);
    }

    // Tentukan palet warna default Asnawiyyah
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

        // Jika tab 'Semua', beri warna marker sesuai jenis masing-masing lembaga
        let itemColor = markerColor;
        let itemBadgeBg = badgeBg;
        let itemBtnBg = btnBg;
        if (isSemua) {
            if (item.jenis === 'Pesantren') {
                itemColor = '#005c55';
                itemBadgeBg = 'bg-primary/10 text-primary';
                itemBtnBg = 'bg-primary hover:bg-primary/90';
            } else if (item.jenis === 'Madin') {
                itemColor = '#1f6c3a';
                itemBadgeBg = 'bg-secondary/10 text-secondary';
                itemBtnBg = 'bg-secondary hover:bg-secondary/90';
            } else if (item.jenis === 'TPQ') {
                itemColor = '#7f4025';
                itemBadgeBg = 'bg-tertiary/10 text-tertiary';
                itemBtnBg = 'bg-tertiary hover:bg-tertiary/90';
            }
        }

        const marker = L.circleMarker([lat, lng], {
            radius: isSemua ? 7 : 7.5,
            fillColor: itemColor,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.92
        }).addTo(publicMap);

        const safeId = escapeHTML(item.id);
        const popupContent = `
            <div class="font-sans text-xs p-1" style="min-width: 180px;">
                <div class="flex items-center justify-between gap-1 mb-1">
                    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${itemBadgeBg}">${escapeHTML(item.jenis || activeCategory)}</span>
                    <span class="text-[10px] text-slate-500 font-semibold">Kec. ${escapeHTML(item.kecamatan || 'Demak')}</span>
                </div>
                <h4 class="font-bold text-xs text-slate-900 leading-snug">${escapeHTML(item.nama)}</h4>
                ${item.pengasuh_atau_kepala ? `<p class="text-[11px] text-slate-600 mt-1"><span class="text-slate-400">Pengasuh:</span> ${escapeHTML(item.pengasuh_atau_kepala)}</p>` : ''}
                ${item.santri_mukim ? `<p class="text-[10px] text-slate-500 mt-0.5"><span class="font-semibold text-slate-700">${(item.santri_mukim + (item.santri_nonmukim || 0)).toLocaleString()}</span> Santri</p>` : ''}
                <button onclick="bukaModalDetailLembaga('${safeId}')" class="mt-2.5 w-full py-1.5 ${itemBtnBg} text-white rounded-lg text-[10px] font-bold text-center transition-colors shadow-sm flex items-center justify-center gap-1 cursor-pointer">
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
        if (isSemua) {
            statsCountEl.innerText = `${filtered.length}`;
        } else if (activeCategory.toLowerCase() === 'pesantren') {
            statsCountEl.innerText = filtered.length > 5 ? `${filtered.length}` : '293';
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

