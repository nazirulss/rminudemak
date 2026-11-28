// Module: Warta Berita, Reader & Social Share

// ==================================================================
// MODUL WARTA & BERITA MEDIA RMI NU DEMAK (DINAMIS 1 TAHUN TERAKHIR)
// ==================================================================
const DEFAULT_BERITA_COVER = 'https://lh3.googleusercontent.com/d/1hhcOX6cN4G89hP0d0Ap3_YNf4-uN1Xzl'; // Dokumentasi resmi Sambang Pesantren PW-PC RMI NU Demak
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

function formatViewsCount(count) {
    const num = Number(count);
    if (isNaN(num) || num <= 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(num);
}
window.formatViewsCount = formatViewsCount;

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
        const viewsCount = formatViewsCount(featured.views_count);

        featuredContainer.innerHTML = `
            <img src="${featured.cover_image_url || DEFAULT_BERITA_COVER}"
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
                    <a href="/berita/${encodeURIComponent(featured.slug || featured.id)}" onclick="event.preventDefault(); openBeritaDetailModal('${featured.slug || featured.id}')"
                        class="bg-secondary-container text-on-secondary-container font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-white hover:text-primary transition-colors w-fit cursor-pointer shadow-md no-underline">
                        Lihat Detail Berita <span class="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </a>
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
            const viewsCount = formatViewsCount(art.views_count);

            return `
                <div class="group cursor-pointer flex gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                    onclick="openBeritaDetailModal('${art.slug || art.id}')">
                    <div class="w-28 h-28 md:w-36 md:h-36 rounded-xl overflow-hidden flex-shrink-0 relative">
                        <img src="${art.cover_image_url || DEFAULT_BERITA_COVER}"
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
                                <a href="/berita/${encodeURIComponent(art.slug || art.id)}" onclick="event.preventDefault(); event.stopPropagation(); openBeritaDetailModal('${art.slug || art.id}')" class="text-inherit no-underline">${safeJudul}</a>
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

// Helper Penanggalan Masehi & Hijriah Islami Otomatis Khas NU Online
function getIslamicAndMasehiDate() {
    const now = new Date();
    const masehiDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const masehiMonths = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const masehiStr = `${masehiDays[now.getDay()]}, ${now.getDate()} ${masehiMonths[now.getMonth()]} ${now.getFullYear()}`;
    
    let hijriStr = '';
    try {
        const hf = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        hijriStr = hf.format(now);
    } catch (e) {
        hijriStr = '16 Jumadilakhir 1448 H';
    }
    return { masehi: masehiStr, hijri: hijriStr };
}

// State & Fungsi Kontrol Ukuran Teks Naskah Berita (A- / A / A+)
let currentArticleFontSize = 'normal';
function setArticleFontSize(size) {
    currentArticleFontSize = size;
    const bodyEl = document.getElementById('berita-article-body');
    const btns = document.querySelectorAll('.font-size-btn');
    if (!bodyEl) return;

    bodyEl.classList.remove('text-base', 'text-lg', 'text-xl', 'text-2xl', 'leading-relaxed', 'leading-loose');
    if (size === 'small') {
        bodyEl.classList.add('text-base', 'leading-relaxed');
    } else if (size === 'large') {
        bodyEl.classList.add('text-xl', 'leading-loose');
    } else if (size === 'xl') {
        bodyEl.classList.add('text-2xl', 'leading-loose');
    } else {
        bodyEl.classList.add('text-lg', 'leading-relaxed');
    }

    btns.forEach(b => {
        if (b.dataset.size === size) {
            b.className = 'font-size-btn px-2.5 py-1 text-xs font-bold bg-[#008444] text-white rounded-md shadow-xs transition-colors cursor-pointer';
        } else {
            b.className = 'font-size-btn px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer';
        }
    });
}
window.setArticleFontSize = setArticleFontSize;

function renderBeritaFullPage() {
    if (!allBeritaData || allBeritaData.length === 0) return;

    // 1. Filter Kategori Dinamis Khas NU Online (Kanal Editorial Bergaris Bawah)
    const categoryContainer = document.getElementById('berita-category-filters');
    if (categoryContainer) {
        const defaultPreset = ['Sambang & Organisasi', 'Pesantren Ramah Anak', 'Pendidikan & Madin', 'Advokasi & Kebijakan', 'Ekonomi & Kemandirian'];
        const existingCats = Array.isArray(allBeritaData) 
            ? allBeritaData.map(b => b.kategori).filter(Boolean)
            : [];
        const categories = ['Semua Warta', ...new Set([...defaultPreset, ...existingCats])];

        categoryContainer.innerHTML = categories.map(cat => {
            const isAll = (cat === 'Semua Warta' && (activeBeritaCategory === 'Semua' || activeBeritaCategory === 'Semua Warta'));
            const isActive = isAll || activeBeritaCategory === cat;
            const targetCat = (cat === 'Semua Warta') ? 'Semua' : cat;
            return `
                <button type="button" onclick="filterBeritaCategory('${targetCat}')"
                    class="whitespace-nowrap px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm transition-all cursor-pointer border-b-2 flex-shrink-0 ${
                        isActive
                            ? 'text-[#008444] border-[#008444] font-bold'
                            : 'text-slate-600 border-transparent hover:text-[#008444] hover:border-slate-300 font-semibold'
                    }">
                    ${cat}
                </button>
            `;
        }).join('');
    }

    // 4. Filter Data Berdasarkan Kategori & Pencarian
    let filtered = allBeritaData.filter(item => {
        const matchCategory = activeBeritaCategory === 'Semua' || activeBeritaCategory === 'Semua Warta' || (item.kategori || '') === activeBeritaCategory;
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

    // 5. Featured Headline Utama 16:9 Editorial Khas NU Online
    const pageFeaturedContainer = document.getElementById('berita-page-featured');
    const subFeaturedGrid = document.getElementById('berita-sub-featured-grid');

    if (pageFeaturedContainer && filtered.length > 0) {
        const f1 = filtered[0];
        const safeJudul = escapeHTML(f1.judul);
        const safeMedia = escapeHTML(f1.sumber_media || 'Media Online');
        const safeRingkasan = escapeHTML(f1.ringkasan || '');
        const formattedDate = formatTanggalIndonesia(f1.published_at);
        const viewsCount = formatViewsCount(f1.views_count);

        pageFeaturedContainer.innerHTML = `
            <div class="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                onclick="openBeritaDetailModal('${f1.slug || f1.id}')">
                <div class="relative aspect-video w-full overflow-hidden bg-slate-900">
                    <img src="${f1.cover_image_url || DEFAULT_BERITA_COVER}"
                        alt="${safeJudul}"
                        class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                    <div class="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                        <span class="bg-[#008444] text-white text-[11px] font-bold px-3 py-1 rounded-md uppercase tracking-wider shadow-sm">
                            ${escapeHTML(f1.kategori || 'Warta')}
                        </span>
                        <span class="bg-amber-400 text-slate-950 text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                            ${safeMedia}
                        </span>
                    </div>
                    <div class="absolute bottom-3 left-4 right-4 text-white text-xs flex items-center justify-between font-medium">
                        <span class="flex items-center gap-1.5 opacity-90"><span class="material-symbols-outlined text-[15px]">calendar_today</span> ${formattedDate}</span>
                        <span class="flex items-center gap-1.5 opacity-90"><span class="material-symbols-outlined text-[15px]">visibility</span> ${viewsCount} Views</span>
                    </div>
                </div>
                <div class="p-6 md:p-7">
                    <h2 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight mb-3 group-hover:text-[#008444] transition-colors">
                        <a href="/berita/${encodeURIComponent(f1.slug || f1.id)}" onclick="event.preventDefault(); event.stopPropagation(); openBeritaDetailModal('${f1.slug || f1.id}')" class="text-inherit no-underline">${safeJudul}</a>
                    </h2>
                    <p class="text-slate-600 text-sm sm:text-base leading-relaxed line-clamp-2 mb-4 font-normal">
                        ${safeRingkasan}
                    </p>
                    <div class="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                        <span class="text-slate-500 font-semibold flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-[16px] text-[#008444]">edit_note</span> Redaksi: ${escapeHTML(f1.penulis || 'Tim Media RMI')}
                        </span>
                        <span class="text-[#008444] font-bold inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            Baca Naskah Lengkap &rarr;
                        </span>
                    </div>
                </div>
            </div>
        `;

        // 3 Sub-Headline Berdampingan
        if (subFeaturedGrid) {
            const subHeadlines = filtered.slice(1, 4);
            if (subHeadlines.length > 0) {
                subFeaturedGrid.innerHTML = subHeadlines.map(sub => {
                    const subJudul = escapeHTML(sub.judul);
                    const subMedia = escapeHTML(sub.sumber_media || 'Media');
                    const subDate = formatTanggalIndonesia(sub.published_at);
                    return `
                        <div class="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                            onclick="openBeritaDetailModal('${sub.slug || sub.id}')">
                            <div class="aspect-video w-full overflow-hidden bg-slate-900 relative">
                                <img src="${sub.cover_image_url || DEFAULT_BERITA_COVER}"
                                    alt="${subJudul}"
                                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <span class="absolute top-2 left-2 bg-[#008444] text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">
                                    ${escapeHTML(sub.kategori || 'Warta')}
                                </span>
                            </div>
                            <div class="p-4 flex-1 flex flex-col justify-between">
                                <h3 class="text-xs sm:text-sm font-bold text-slate-900 leading-snug group-hover:text-[#008444] transition-colors line-clamp-2 mb-3">
                                    <a href="/berita/${encodeURIComponent(sub.slug || sub.id)}" onclick="event.preventDefault(); event.stopPropagation(); openBeritaDetailModal('${sub.slug || sub.id}')" class="text-inherit no-underline">${subJudul}</a>
                                </h3>
                                <div class="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-100">
                                    <span>${subDate}</span>
                                    <span class="text-amber-800 font-semibold">${subMedia}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                subFeaturedGrid.innerHTML = '';
            }
        }
    } else if (pageFeaturedContainer) {
        pageFeaturedContainer.innerHTML = '';
        if (subFeaturedGrid) subFeaturedGrid.innerHTML = '';
    }

    // 6. Sidebar Terpopuler Ranking 1–5 Berbobot Khas NU Online
    const trendingContainer = document.getElementById('berita-page-trending');
    if (trendingContainer) {
        const sortedByViews = [...allBeritaData].sort((a, b) => Number(b.views_count || 0) - Number(a.views_count || 0)).slice(0, 5);
        trendingContainer.innerHTML = sortedByViews.map((item, idx) => {
            const safeJudul = escapeHTML(item.judul);
            const safeMedia = escapeHTML(item.sumber_media || 'Media');
            const viewsText = formatViewsCount(item.views_count);
            const rankBadgeClass = idx === 0 ? 'bg-amber-400 text-slate-950 font-black' : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-extrabold';

            return `
                <div class="flex items-start gap-3.5 group cursor-pointer py-2 border-b border-slate-100 last:border-b-0"
                    onclick="openBeritaDetailModal('${item.slug || item.id}')">
                    <span class="w-7 h-7 rounded-lg ${rankBadgeClass} flex items-center justify-center text-sm flex-shrink-0 shadow-2xs">
                        ${idx + 1}
                    </span>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 text-[10px] text-slate-400 mb-0.5">
                            <span class="text-[#008444] font-bold uppercase">${escapeHTML(item.kategori || 'Warta')}</span>
                            <span>•</span>
                            <span>${safeMedia}</span>
                        </div>
                        <h4 class="text-xs sm:text-sm font-bold text-slate-800 leading-snug group-hover:text-[#008444] transition-colors line-clamp-2">
                            <a href="/berita/${encodeURIComponent(item.slug || item.id)}" onclick="event.preventDefault(); event.stopPropagation(); openBeritaDetailModal('${item.slug || item.id}')" class="text-inherit no-underline">${safeJudul}</a>
                        </h4>
                        <span class="text-[10px] text-slate-400 font-medium mt-1 block">${viewsText} Views</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 7. Arsip Berita Terkini & Daftar Lengkap (Grid 2 Kolom Bersih)
    const pageListContainer = document.getElementById('berita-page-list');
    if (pageListContainer) {
        const itemsToDisplay = (activeBeritaCategory !== 'Semua' && activeBeritaCategory !== 'Semua Warta') || beritaSearchQuery
            ? filtered
            : filtered.slice(4);

        if (itemsToDisplay.length === 0) {
            pageListContainer.innerHTML = `
                <div class="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
                    <span class="material-symbols-outlined text-4xl text-slate-400 mb-2">newspaper</span>
                    <p class="font-bold">Tidak ada berita yang sesuai dengan filter atau kata kunci pencarian.</p>
                </div>
            `;
        } else {
            pageListContainer.innerHTML = itemsToDisplay.map(item => {
                const safeJudul = escapeHTML(item.judul);
                const safeRingkasan = escapeHTML(item.ringkasan);
                const safeMedia = escapeHTML(item.sumber_media || 'Media Online');
                const formattedDate = formatTanggalIndonesia(item.published_at);
                const viewsCount = formatViewsCount(item.views_count);

                return `
                    <div class="group flex flex-col sm:flex-row bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer"
                        onclick="openBeritaDetailModal('${item.slug || item.id}')">
                        <div class="sm:w-2/5 h-48 sm:h-auto relative overflow-hidden flex-shrink-0 bg-slate-900">
                            <img src="${item.cover_image_url || DEFAULT_BERITA_COVER}"
                                alt="${safeJudul}"
                                class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                        <div class="sm:w-3/5 p-5 flex flex-col justify-between">
                            <div>
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="text-[#008444] text-[10px] font-bold uppercase tracking-wider">${escapeHTML(item.kategori || 'Warta')}</span>
                                    <span class="text-slate-300">•</span>
                                    <span class="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">${safeMedia}</span>
                                </div>
                                <h4 class="text-sm sm:text-base font-bold text-slate-900 mb-2 leading-snug group-hover:text-[#008444] transition-colors line-clamp-2">
                                    <a href="/berita/${encodeURIComponent(item.slug || item.id)}" onclick="event.preventDefault(); event.stopPropagation(); openBeritaDetailModal('${item.slug || item.id}')" class="text-inherit no-underline">${safeJudul}</a>
                                </h4>
                                <p class="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                                    ${safeRingkasan}
                                </p>
                            </div>
                            <div class="flex items-center justify-between text-[11px] font-medium text-slate-400 pt-2 border-t border-slate-100">
                                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">calendar_today</span> ${formattedDate}</span>
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

function openBeritaDetailModal(idOrSlug, updateUrl = true) {
    const item = findBeritaItem(idOrSlug);
    if (item) {
        item.views_count = (Number(item.views_count) || 0) + 1;
        incrementBeritaView(item.id || item.slug || idOrSlug);
    }
    const activeSlug = (item && item.slug) ? item.slug : idOrSlug;
    if (updateUrl) {
        const targetUrl = '/berita/' + encodeURIComponent(activeSlug);
        if (window.location.pathname !== targetUrl) {
            history.pushState({ page: 'berita-detail', id: (item ? item.id : idOrSlug), slug: activeSlug }, '', targetUrl);
        }
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
            if (found && found.slug && updateUrl) {
                const targetUrl = '/berita/' + encodeURIComponent(found.slug);
                if (window.location.pathname !== targetUrl) {
                    history.replaceState({ page: 'berita-detail', id: found.id, slug: found.slug }, '', targetUrl);
                }
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
    const formattedDate = formatTanggalIndonesia(item.published_at);
    const viewsCount = formatViewsCount(item.views_count);
    const coverUrl = item.cover_image_url || DEFAULT_BERITA_COVER;

    // Berita terkait & rekomendasi bacaan
    const relatedNews = allBeritaData.filter(b => b.id !== item.id && b.kategori === item.kategori).slice(0, 4);
    const otherRelated = relatedNews.length < 4 
        ? allBeritaData.filter(b => b.id !== item.id && !relatedNews.find(r => r.id === b.id)).slice(0, 4 - relatedNews.length)
        : [];
    const allRelated = [...relatedNews, ...otherRelated];
    const firstRelated = allRelated[0] || null;

    // Format isi berita & sisipkan kotak "Baca Juga"
    let rawFormattedIsi = formatIsiBeritaHtml(item.isi_lengkap || item.ringkasan || '');
    if (firstRelated) {
        const bacaJugaBox = `
            <div class="my-6 p-4 rounded-xl bg-amber-50/80 border-l-4 border-amber-500 shadow-2xs">
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block mb-1">BACA JUGA:</span>
                <span class="text-sm sm:text-base font-bold text-slate-900 hover:text-[#008444] transition-colors leading-snug block cursor-pointer"
                    onclick="openBeritaDetailModal('${firstRelated.slug || firstRelated.id}')">
                    ${escapeHTML(firstRelated.judul)} &rarr;
                </span>
            </div>
        `;
        let pCount = 0;
        let injected = false;
        rawFormattedIsi = rawFormattedIsi.replace(/<\/p>/gi, (match) => {
            pCount++;
            if (pCount === 2 && !injected) {
                injected = true;
                return match + bacaJugaBox;
            }
            return match;
        });
        if (!injected && pCount > 0) {
            rawFormattedIsi = rawFormattedIsi + bacaJugaBox;
        }
    }

    // Terpopuler untuk sidebar naskah
    const sidebarTrending = [...allBeritaData].sort((a, b) => Number(b.views_count || 0) - Number(a.views_count || 0)).slice(0, 5);

    container.innerHTML = `
        <!-- Breadcrumb Navigasi Khas NU Online -->
        <nav class="mb-6 flex items-center justify-between flex-wrap gap-3">
            <div class="flex items-center gap-2 text-xs text-slate-500 font-medium overflow-x-auto whitespace-nowrap pb-1">
                <button type="button" onclick="closeBeritaDetailModal()" class="hover:text-emerald-800 font-semibold transition-colors cursor-pointer flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px]">newspaper</span> Warta
                </button>
                <span>&rsaquo;</span>
                <span class="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">${escapeHTML(item.kategori || 'Warta')}</span>
                <span class="hidden md:inline">&rsaquo;</span>
                <span class="hidden md:inline text-slate-400 truncate max-w-xs">${safeJudul}</span>
            </div>

            <button type="button" onclick="closeBeritaDetailModal()" class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer group">
                <span class="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                <span>Kembali ke Warta</span>
            </button>
        </nav>

        <!-- LAYOUT 2 KOLOM (8 Kolom Naskah Utama + 4 Kolom Sidebar Khas Media Berita) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
            
            <!-- KOLOM KIRI: NASKAH LENGKAP ARTIKEL -->
            <article class="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-10 shadow-xs border border-slate-200/90">
                
                <!-- 1. Kategori & Sumber Media -->
                <div class="flex items-center gap-2 mb-3">
                    <span class="bg-[#008444] text-white text-[11px] font-bold px-3 py-1 rounded-md uppercase tracking-wider shadow-2xs">
                        ${escapeHTML(item.kategori || 'Warta')}
                    </span>
                    <span class="bg-amber-400 text-slate-950 text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-2xs">
                        ${safeMedia}
                    </span>
                </div>

                <!-- 2. Judul Utama (Besar & Menonjol) -->
                <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-4 tracking-tight">
                    ${safeJudul}
                </h1>

                <!-- 3. Lead / Paragraf Pembuka Ringkas -->
                ${safeRingkasan ? `
                <div class="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-emerald-950 font-medium text-sm sm:text-base leading-relaxed mb-6">
                    <div class="flex items-start gap-3">
                        <span class="material-symbols-outlined text-[#008444] text-[22px] flex-shrink-0 mt-0.5">format_quote</span>
                        <div class="italic">${safeRingkasan}</div>
                    </div>
                </div>
                ` : ''}

                <!-- 4. Meta Bar Penulis, Editor, Tanggal & Pengatur Ukuran Font (A- / A / A+) -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 font-medium py-3.5 mb-6 border-y border-slate-100">
                    <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        <span class="flex items-center gap-1.5 text-slate-700 font-bold">
                            <span class="material-symbols-outlined text-[16px] text-[#008444]">person</span>
                            ${escapeHTML(item.penulis || 'Tim Redaksi RMI PCNU Demak')}
                        </span>
                        <span class="flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-[16px] text-slate-400">calendar_today</span>
                            ${formattedDate}
                        </span>
                        <span class="flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-[16px] text-slate-400">visibility</span>
                            ${viewsCount} Views
                        </span>
                    </div>

                    <!-- Tombol Pengatur Ukuran Huruf Khas Pembaca Berita Modern -->
                    <div class="flex items-center gap-1.5 self-start sm:self-auto bg-slate-50 p-1 rounded-lg border border-slate-200/80">
                        <span class="text-[10px] text-slate-400 font-bold px-1 uppercase tracking-wider">Teks:</span>
                        <button type="button" data-size="small" onclick="setArticleFontSize('small')" class="font-size-btn px-2 py-0.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer" title="Perkecil Huruf">A-</button>
                        <button type="button" data-size="normal" onclick="setArticleFontSize('normal')" class="font-size-btn px-2 py-0.5 text-xs font-bold bg-[#008444] text-white rounded shadow-xs transition-colors cursor-pointer" title="Ukuran Standar">A</button>
                        <button type="button" data-size="large" onclick="setArticleFontSize('large')" class="font-size-btn px-2 py-0.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer" title="Perbesar Huruf">A+</button>
                    </div>
                </div>

                <!-- 5. Foto Utama 16:9 dengan Caption Resmi di Bawahnya -->
                <div class="mb-8">
                    <div class="relative rounded-2xl overflow-hidden shadow-md aspect-video max-h-[460px] bg-slate-900">
                        <img src="${coverUrl}" alt="${safeJudul}" class="w-full h-full object-cover" onerror="this.src=DEFAULT_BERITA_COVER" />
                    </div>
                    <p class="text-xs text-slate-500 italic mt-2.5 px-2 flex items-center justify-between">
                        <span>📸 Dokumentasi Kegiatan / Liputan Berita</span>
                        <span class="font-medium text-slate-400">(Dok. Tim Media RMI PCNU Demak)</span>
                    </p>
                </div>

                <!-- 6. Badan Naskah Artikel (Dukungan Responsif Font Size) -->
                <div id="berita-article-body" class="mb-10 text-slate-800 text-lg leading-relaxed selection:bg-emerald-100 article-content">
                    ${rawFormattedIsi}
                </div>

                <!-- 7. Tombol Baca di Sumber Asli (Jika Tersedia) -->
                ${item.url_sumber ? `
                <div class="mb-8 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div class="text-xs text-slate-600">
                        <span class="font-bold text-slate-800 block">Diterbitkan Pertama Kali di: ${safeMedia}</span>
                        <span>Klik tombol berikut untuk membuka tautan berita resmi di media rujukan.</span>
                    </div>
                    <a href="${escapeHTML(item.url_sumber)}" target="_blank" rel="noopener noreferrer"
                        class="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#008444] hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex-shrink-0 cursor-pointer">
                        <span class="material-symbols-outlined text-[16px]">open_in_new</span>
                        Kunjungi Sumber Asli
                    </a>
                </div>
                ` : ''}

                <!-- 8. Tagar / Keyword SEO Google -->
                ${(item.keywords) ? `
                <div class="flex flex-wrap items-center gap-2 mb-8 pt-4 border-t border-slate-100">
                    <span class="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mr-1">
                        <span class="material-symbols-outlined text-[15px] text-[#008444]">sell</span> Topik Terkait:
                    </span>
                    ${item.keywords.split(',').map(kw => kw.trim()).filter(Boolean).map(kw => `
                        <span class="inline-flex items-center text-xs font-semibold px-3 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-full border border-slate-200 transition-colors cursor-pointer" onclick="handleBeritaSearch('${escapeHTML(kw)}')">
                            #${escapeHTML(kw)}
                        </span>
                    `).join('')}
                </div>
                ` : ''}

                <!-- 9. Kotak Redaksi Resmi RMI PCNU Demak -->
                <div class="bg-slate-50 rounded-2xl p-5 border border-slate-200/90 mb-8 flex items-center gap-4">
                    <img src="assets/img/logo_rmi.png" alt="RMI Demak" class="w-12 h-12 object-contain flex-shrink-0" onerror="this.style.display='none'">
                    <div class="text-xs">
                        <h4 class="font-bold text-slate-900 text-sm">Tim Redaksi & Media RMI PCNU Demak</h4>
                        <p class="text-slate-500 leading-relaxed mt-0.5">Warta resmi PC Rabithah Ma'ahid Islamiyah Nahdlatul Ulama Kabupaten Demak, Jawa Tengah.</p>
                    </div>
                </div>

                <!-- 10. Social Share Bar -->
                <div class="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-5 sm:p-6">
                    <h4 class="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <span class="material-symbols-outlined text-[20px] text-[#008444]">share</span>
                        Sebarkan Warta Ini ke Umat & Santri
                    </h4>
                    <div class="flex flex-wrap gap-2.5">
                        <button type="button" onclick="shareBeritaWhatsApp('${item.slug || item.id}')"
                            class="flex items-center gap-2 px-4 py-2.5 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md active:scale-95 transition-all cursor-pointer"
                            style="background-color: #25D366;">
                            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                            <span>Bagikan ke WhatsApp</span>
                        </button>
                        <button type="button" onclick="salinLinkBerita('${item.slug || item.id}')"
                            class="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl shadow-2xs border border-slate-200 active:scale-95 transition-all cursor-pointer">
                            <span class="material-symbols-outlined text-[18px]">content_copy</span>
                            <span>Salin Tautan</span>
                        </button>
                        <button type="button" onclick="shareBeritaFacebook('${item.slug || item.id}')"
                            class="flex items-center gap-1.5 px-4 py-2.5 text-white font-bold text-xs rounded-xl shadow-2xs hover:shadow-md active:scale-95 transition-all cursor-pointer"
                            style="background-color: #1877F2;">
                            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            <span>Facebook</span>
                        </button>
                    </div>
                </div>
            </article>

            <!-- KOLOM KANAN: STICKY SIDEBAR (Terpopuler 1-5 + Terkait + Direktori) -->
            <aside class="lg:col-span-4 space-y-6 sticky top-24">
                
                <!-- Widget Terpopuler 1-5 Khas NU Online -->
                <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <h3 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                            TERPOPULER
                        </h3>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MINGGU INI</span>
                    </div>
                    <div class="space-y-4">
                        ${sidebarTrending.map((tItem, idx) => {
                            const tJudul = escapeHTML(tItem.judul);
                            const tMedia = escapeHTML(tItem.sumber_media || 'Media');
                            const tViews = formatViewsCount(tItem.views_count);
                            const badgeColor = idx === 0 ? 'bg-amber-400 text-slate-950 font-black' : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-extrabold';

                            return `
                                <div class="flex items-start gap-3.5 group cursor-pointer py-2 border-b border-slate-100 last:border-b-0"
                                    onclick="openBeritaDetailModal('${tItem.slug || tItem.id}')">
                                    <span class="w-7 h-7 rounded-lg ${badgeColor} flex items-center justify-center text-sm flex-shrink-0 shadow-2xs">
                                        ${idx + 1}
                                    </span>
                                    <div class="flex-1 min-w-0">
                                        <span class="text-[10px] text-[#008444] font-bold uppercase block mb-0.5">${escapeHTML(tItem.kategori || 'Warta')}</span>
                                        <h4 class="text-xs sm:text-sm font-bold text-slate-800 leading-snug group-hover:text-[#008444] transition-colors line-clamp-2">
                                            ${tJudul}
                                        </h4>
                                        <span class="text-[10px] text-slate-400 font-medium mt-1 block">${tViews} Views</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Widget Warta Terkait Kategori yang Sama -->
                ${allRelated.length > 0 ? `
                <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
                    <h3 class="text-base font-extrabold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                        <span class="material-symbols-outlined text-[#008444] text-[20px]">recommend</span>
                        WARTA TERKAIT
                    </h3>
                    <div class="space-y-4">
                        ${allRelated.slice(0, 3).map(rel => {
                            const relJudul = escapeHTML(rel.judul);
                            const relDate = formatTanggalIndonesia(rel.published_at);
                            return `
                                <div class="flex gap-3 group cursor-pointer" onclick="openBeritaDetailModal('${rel.slug || rel.id}')">
                                    <div class="w-20 h-16 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 relative">
                                        <img src="${rel.cover_image_url || DEFAULT_BERITA_COVER}"
                                            alt="${relJudul}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <h4 class="text-xs font-bold text-slate-800 leading-snug group-hover:text-[#008444] transition-colors line-clamp-2 mb-1">
                                            ${relJudul}
                                        </h4>
                                        <span class="text-[10px] text-slate-400 font-medium block">${relDate}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Widget Ajakan Eksplorasi Direktori Pesantren -->
                <div class="bg-gradient-to-br from-[#005c55] to-[#003831] text-white p-6 rounded-2xl shadow-sm text-center">
                    <span class="material-symbols-outlined text-4xl text-amber-400 mb-2">account_balance</span>
                    <h4 class="text-base font-bold mb-1.5">Direktori Pesantren Demak</h4>
                    <p class="text-xs text-white/80 leading-relaxed mb-4">Cari data profil, kurikulum turots, dan lokasi pesantren se-Kabupaten Demak.</p>
                    <button type="button" onclick="navigateTo('direktori')" class="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer">
                        Buka Direktori Lengkap &rarr;
                    </button>
                </div>
            </aside>
        </div>
    `;
}

function closeBeritaDetailModal() {
    document.title = 'Warta Pesantren & Berita Resmi — PC RMI NU Kabupaten Demak';
    if (window.location.pathname !== '/berita') {
        history.pushState({ page: 'berita' }, '', '/berita');
    } else if (window.location.hash || window.location.search) {
        history.pushState({ page: 'berita' }, '', '/berita');
    }
    const detailPage = document.getElementById('page-berita-detail');
    if (detailPage) detailPage.classList.remove('active');
    const beritaPage = document.getElementById('page-berita');
    if (beritaPage) {
        beritaPage.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    sessionStorage.setItem('activePage', 'berita');
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


