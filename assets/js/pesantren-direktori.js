// Module: Direktori Pesantren, Profil Detail & Hover Flyout

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
    // 1. Ambil langsung dari Database & Google Drive (logo_url) jika valid dan bukan gambar dummy
    if (item.logo_url && isValidPesantrenLogoUrl(item.logo_url)) {
        const localFallback = getLocalTransparentLogoUrl(item);
        const fallbackAttr = localFallback ? `onerror="this.onerror=null; this.src='${localFallback}';"` : '';
        return `<img src="${escapeHTML(item.logo_url)}" alt="Logo ${escapeHTML(item.nama)}" class="w-full h-full object-contain" style="width: 100%; height: 100%; object-fit: contain; display: block;" ${fallbackAttr} />`;
    }

    // 2. Fallback ke berkas .png lokal jika database belum terisi URL online
    const localLogo = getLocalTransparentLogoUrl(item);
    if (localLogo) {
        return `<img src="${localLogo}" alt="Logo ${escapeHTML(item.nama)}" class="w-full h-full object-contain" style="width: 100%; height: 100%; object-fit: contain; display: block;" />`;
    }
    
    // Inisial monogram fallback elegan (jika belum mengupload logo resmi)
    let cleanName = (item.nama || '').replace(/^(Pondok\s+Pesantren|Pondok|Pesantren|Ponpes|PPTQ|PP)\s+/i, '').trim();
    let cleanWords = cleanName.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
    let initials = cleanWords.length >= 2 
        ? (cleanWords[0][0] + cleanWords[1][0]).toUpperCase() 
        : (cleanWords[0] ? cleanWords[0].slice(0, 2) : 'PP').toUpperCase();
    
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
let isFavoriteFilterActive = false;

function updateFavoriteCountBadge() {
    const favs = getPesantrenFavorites();
    const badge = document.getElementById('fav-count-badge');
    const shareBtn = document.getElementById('btn-share-favorites');
    if (badge) badge.innerText = favs.length;
    if (shareBtn) {
        if (favs.length > 0) {
            shareBtn.classList.remove('hidden');
            shareBtn.classList.add('inline-flex');
        } else {
            shareBtn.classList.add('hidden');
            shareBtn.classList.remove('inline-flex');
        }
    }
}

function toggleFavoriteFilter() {
    isFavoriteFilterActive = !isFavoriteFilterActive;
    const btn = document.getElementById('btn-filter-favorites');
    if (btn) {
        if (isFavoriteFilterActive) {
            btn.className = 'px-3.5 py-1.5 rounded-xl bg-rose-600 text-white border border-rose-600 text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer';
            const ic = btn.querySelector('.material-symbols-outlined');
            if (ic) ic.classList.replace('text-rose-500', 'text-white');
        } else {
            btn.className = 'px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer';
            const ic = btn.querySelector('.material-symbols-outlined');
            if (ic) ic.classList.replace('text-white', 'text-rose-500');
        }
    }
    applyLembagaFilter();
}

function shareFavoritesViaWhatsApp() {
    const favIds = getPesantrenFavorites();
    if (!favIds.length) return;
    const favItems = (allLembagaData || []).filter(item => favIds.includes(String(item.id)));
    if (!favItems.length) return;

    let lines = favItems.slice(0, 15).map((p, idx) =>
        `${idx + 1}. *${p.nama}* (Kec. ${p.kecamatan || 'Demak'}) — Pengasuh: ${p.pengasuh_atau_kepala || '-'}`
    );
    const text = `*DAFTAR PONDOK PESANTREN PILIHAN (RMI PCNU DEMAK)*\n\n${lines.join('\n')}\n\nLihat direktori lengkap di:\n👉 https://rminudemak.org/#pesantren`;
    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(text), '_blank');
}

window.toggleFavoriteFilter = toggleFavoriteFilter;
window.shareFavoritesViaWhatsApp = shareFavoritesViaWhatsApp;
window.updateFavoriteCountBadge = updateFavoriteCountBadge;

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
    updateFavoriteCountBadge();
    if (isFavoriteFilterActive) applyLembagaFilter();
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
                            <h3 class="font-extrabold text-[15px] text-slate-900 mb-1 leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors cursor-pointer" title="${safeNama}">
                                <a href="/pesantren/${encodeURIComponent(generatePesantrenSlug(item))}" onclick="event.preventDefault(); bukaModalDetailLembaga('${safeId}')" class="text-inherit no-underline">${safeNama}</a>
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
                                <a href="/pesantren/${encodeURIComponent(generatePesantrenSlug(item))}" onclick="event.preventDefault(); bukaModalDetailLembaga('${safeId}')" class="px-2.5 py-2 bg-emerald-50/70 hover:bg-emerald-700 text-emerald-800 hover:text-white border border-emerald-200/80 hover:border-emerald-700 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer no-underline">
                                    <span class="material-symbols-outlined text-[14px]">visibility</span>
                                    <span>Detail Profil</span>
                                </a>
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
    const favIds = isFavoriteFilterActive ? getPesantrenFavorites() : null;

    const filtered = allLembagaData.filter(item => {
        const matchFav = !isFavoriteFilterActive || (favIds && favIds.includes(String(item.id)));
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

        return matchFav && matchKeyword && matchKecamatan && matchKategori;
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
    if (found) return found;

    // 5. Cek apakah cocok dengan slug nama populer
    found = list.find(l => {
        if (!l.nama_populer) return false;
        const popSlug = l.nama_populer.toLowerCase()
            .replace(/^(pondok\s+pesantren|pesantren|ponpes|pp\.|pp|pptq)\s+/i, '')
            .replace(/['"’`]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        return popSlug === target;
    });
    return found || null;
}

// =========================================================================
// SUBPAGE DETAIL PROFIL PESANTREN (STANDAR DIGDAYA PESANTREN.NU.ID 10 SEKSI)
// =========================================================================
async function bukaProfilPesantren(pesantrenId, updateHash = true) {
    if (typeof hidePesantrenFlyout === 'function') {
        hidePesantrenFlyout();
    }

    if (!pesantrenId) {
        navigateTo('pesantren', true);
        return;
    }

    const container = document.getElementById('pesantren-detail-content');

    let item = findPesantrenBySlugOrId(pesantrenId);

    // Jika data belum ditemukan atau dataset riil (293 pesantren) belum selesai dimuat
    if (!item && !isLivePesantrenDataLoaded) {
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
        await loadLembagaDariSupabase();
        item = findPesantrenBySlugOrId(pesantrenId);
    }

    renderPesantrenDetailPage(pesantrenId, updateHash);
}

function kembaliKeKatalogPesantren() {
    document.title = 'Direktori & Peta GIS Pondok Pesantren Demak — RMI NU Demak';
    if (window.location.pathname !== '/direktori') {
        history.pushState({ page: 'pesantren' }, '', '/direktori');
    } else if (window.location.hash || window.location.search) {
        history.pushState({ page: 'pesantren' }, '', '/direktori');
    }
    const detailPage = document.getElementById('page-pesantren-detail');
    if (detailPage) detailPage.classList.remove('active');
    const catalogPage = document.getElementById('page-pesantren');
    if (catalogPage) {
        catalogPage.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    sessionStorage.setItem('activePage', 'pesantren');
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

    // 🚀 GENERATE TRUE CLEAN PATH (e.g. /pesantren/roudlotul-mubarokah)
    const slug = generatePesantrenSlug(item);
    if (updateHash) {
        const targetUrl = '/pesantren/' + encodeURIComponent(slug);
        if (window.location.pathname !== targetUrl) {
            history.pushState({ page: 'pesantren-detail', slug: slug, id: item.id }, '', targetUrl);
        }
    }
    document.title = `${safeNama}${item.kecamatan ? ` (${item.kecamatan})` : ''} — Direktori Pesantren RMI NU Demak`;

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
    const hotlinePsb = soc.hotline_psb || item.hotline_psb || '';
    const websiteUrl = (soc.website && soc.website.startsWith('http')) ? soc.website : (soc.instagram || `https://www.google.com/search?q=${encodeURIComponent(item.nama + ' Demak')}`);
    const mapsUrl = (item.latitude && item.longitude) 
        ? `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}` 
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.nama + ' ' + (item.desa || '') + ' ' + item.kecamatan + ' Demak')}`;
    
    // Tautan Share WhatsApp dengan Clean URL SEO-friendly (/pesantren/{slug})
    const shareProfileUrl = `${window.location.origin}/pesantren/${encodeURIComponent(slug)}`;
    const waShareText = `Assalamu'alaikum. Simak profil resmi ${item.nama} (${safeKode}) di Direktori Resmi PC RMI NU Kabupaten Demak:\n${shareProfileUrl}`;
    const waShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waShareText)}`;
    const waPsbCleanNum = hotlinePsb ? String(hotlinePsb).replace(/[^0-9]/g, '') : '';
    const waPsbUrl = waPsbCleanNum ? `https://wa.me/${waPsbCleanNum}?text=${encodeURIComponent('Assalamu\'alaikum Panitia PSB ' + item.nama + ', saya ingin bertanya mengenai pendaftaran santri baru.')}` : '';

    // Wakil Pengasuh Badge HTML (Pecah string koma atau array menjadi badge individu terpisah)
    let wakilPengasuhHtml = '';
    const wakilList = [];
    if (item.wakil_pengasuh) {
        if (Array.isArray(item.wakil_pengasuh)) {
            item.wakil_pengasuh.forEach(w => {
                if (typeof w === 'string') {
                    w.split(',').map(s => s.trim()).filter(Boolean).forEach(name => {
                        if (!wakilList.includes(name)) wakilList.push(name);
                    });
                }
            });
        } else if (typeof item.wakil_pengasuh === 'string') {
            item.wakil_pengasuh.split(',').map(s => s.trim()).filter(Boolean).forEach(name => {
                if (!wakilList.includes(name)) wakilList.push(name);
            });
        }
    }
    if (wakilList.length > 0) {
        wakilPengasuhHtml = `
            <div class="flex items-center gap-1.5 flex-wrap mt-2">
                <span class="text-xs font-semibold text-slate-500">Wakil Pengasuh:</span>
                ${wakilList.map(w => `<span class="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">${escapeHTML(w)}</span>`).join('')}
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
            { url: 'https://lh3.googleusercontent.com/d/1Ni4-uJmQxdAj8k-LWNLlxcgsBOaHFm9k', judul: 'Halaqah Pengajian Kitab Kuning', kategori: 'Halaqah Turots' }
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
                <a href="/" class="hover:text-emerald-700">Beranda</a>
                <span>/</span>
                <a href="/direktori" onclick="event.preventDefault(); kembaliKeKatalogPesantren();" class="hover:text-emerald-700 cursor-pointer">Direktori Pesantren</a>
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
            <!-- SEKSI 3: TOMBOL AKSI CEPAT                                        -->
            <!-- ================================================================= -->
            <div class="grid grid-cols-1 ${waPsbUrl ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'} gap-3 pt-6 border-t border-slate-100 mt-6">
                ${waPsbUrl ? `
                <a href="${waPsbUrl}" target="_blank" rel="noopener noreferrer" class="px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs">
                    <span class="material-symbols-outlined text-[18px]">chat</span>
                    <span>WhatsApp PSB</span>
                </a>
                ` : ''}
                <a href="${websiteUrl}" target="_blank" rel="noopener noreferrer" class="px-4 py-3 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs">
                    <span class="material-symbols-outlined text-[18px] text-emerald-700">language</span>
                    <span>Kunjungi Laman Resmi</span>
                </a>
                <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="px-4 py-3 bg-slate-50 hover:bg-rose-50 text-slate-800 hover:text-rose-800 border border-slate-200 hover:border-rose-300 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs">
                    <span class="material-symbols-outlined text-[18px] text-rose-600">map</span>
                    <span>Buka Google Maps</span>
                </a>
                <a href="${waShareUrl}" target="_blank" rel="noopener noreferrer" class="${waPsbUrl ? 'bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs">
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
                        ${hotlinePsb ? `
                            <a href="https://wa.me/${String(hotlinePsb).replace(/[^0-9]/g, '')}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 transition text-xs font-bold">
                                <span class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-[16px] text-emerald-700">chat</span>
                                    <span>WhatsApp Hotline PSB</span>
                                </span>
                                <span class="font-mono text-[11px] text-emerald-800">${escapeHTML(hotlinePsb)}</span>
                            </a>
                        ` : ''}

                        ${soc.tiktok ? `
                            <a href="${escapeHTML(soc.tiktok)}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition text-xs font-bold shadow-2xs">
                                <span class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-[16px] text-rose-400">music_note</span>
                                    <span>TikTok Resmi</span>
                                </span>
                                <span class="material-symbols-outlined text-[14px] text-slate-300">open_in_new</span>
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

                        ${(!hotlinePsb && !soc.instagram && !soc.youtube && !soc.website && !soc.tiktok) ? `
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

// tutupModalDetailLembaga dipindahkan ke core-utils.js agar tersedia di seluruh halaman



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

