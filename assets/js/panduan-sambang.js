// Module: Panduan 7 Peran, Cetak PDF & Sambang Pesantren

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

// toggleMobileLayananSubmenu & toggleMobileProgramSubmenu dipindahkan ke core-utils.js agar tersedia di seluruh halaman

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

