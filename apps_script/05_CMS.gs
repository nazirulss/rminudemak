/**
 * =========================================================================
 * 05_CMS.gs
 * Manajemen Konten Web Publik (Beranda, Profil Pimpinan, Berita, Layanan, & Pengurus Organogram)
 * =========================================================================
 */

// =========================================================================
// INISIALISASI OTOMATIS TAB SHEET CMS WEB PUBLIK DI GOOGLE SHEETS
// =========================================================================
function setupWebCmsSheets() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const cmsSheets = {
    web_beranda: [
      'id', 'bagian', 'jabatan', 'nama_pimpinan', 'gelar_depan', 'gelar_belakang', 'foto_drive_url', 'file_drive_id', 'kutipan_sambutan', 'urutan', 'is_active', 'updated_at'
    ],
    web_profil: [
      'id', 'tipe_konten', 'judul_atau_jabatan', 'isi_konten_atau_nama', 'foto_url', 'urutan', 'updated_at'
    ],
    web_layanan: [
      'id', 'kategori_layanan', 'judul_langkah', 'deskripsi_syarat', 'hotline_wa', 'email_resmi', 'updated_at'
    ],
    web_berita: [
      'id', 'judul', 'slug', 'kategori', 'ringkasan', 'isi_lengkap', 'cover_image_url', 'penulis', 'sumber_media', 'url_sumber', 'is_featured', 'status', 'published_at', 'views_count', 'updated_at'
    ],
    app_pengurus: [
      'id', 'tingkat_hirarki', 'jabatan', 'nama_lengkap', 'gelar_depan', 'gelar_belakang', 'foto_drive_url', 'parent_id', 'tipe_garis', 'tupoksi', 'urutan', 'is_active', 'updated_at'
    ]
  };

  const createdSheets = [];

  for (const sheetName in cmsSheets) {
    let sheet = ss.getSheetByName(sheetName);
    const headers = cmsSheets[sheetName];

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      createdSheets.push(sheetName);
    }

    if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#005c55').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
  }

  // Isi data awal sambutan masyayikh jika sheet web_beranda baru
  const sheetBeranda = ss.getSheetByName('web_beranda');
  if (sheetBeranda && sheetBeranda.getLastRow() <= 1) {
    const now = new Date().toISOString();
    const initialLeaders = [
      ['PIMPINAN-01', 'sambutan_pimpinan', 'Rais Syuriyah PCNU Kabupaten Demak', "KH. M. Zainal Arifin Ma'shum", 'KH.', '', 'https://lh3.googleusercontent.com/d/15r1HChPt-hSueGYK8_84V5t-xuwzM02G', '', "Pesantren adalah benteng penjaga ruhani umat dan mata air sanad keilmuan Ahlussunnah wal Jama'ah. Teruslah mengistiqamahkan ngaji turots, merawat adab santri, serta menebarkan kesejukan dan kedamaian bagi Demak Kota Wali dan nusantara.", 1, true, now],
      ['PIMPINAN-02', 'sambutan_pimpinan', 'Ketua Tanfidziyah PCNU Kabupaten Demak', 'KH. M. Aminuddin, M.Si.', 'KH.', 'M.Si.', 'https://lh3.googleusercontent.com/d/1uNBAgynTrwyyyxhQL9edxhw-2IozYBuD', '', 'Sinergi antara keteguhan tradisi salaf dan tata kelola digital adalah keniscayaan dakwah modern. Melalui portal satu data ini, kita satukan gerak langkah kelembagaan pesantren agar semakin mandiri, teratur secara administrasi, dan berdaya saing.', 2, true, now],
      ['PIMPINAN-03', 'sambutan_pimpinan', 'Ketua PC RMI NU Kabupaten Demak', 'KH. Ibrahim Cholilullah, S.Pd.I.', 'KH.', 'S.Pd.I.', 'https://lh3.googleusercontent.com/d/1cWI3Eql8KNgiJ15XnctjWuhujGVMD6YJ', '', 'RMI berkhidmah sebagai jembatan pelindung dan pelayan bagi pesantren, madrasah diniyah, dan TPQ di 14 kecamatan. Sistem data geospasial ini hadir untuk memastikan setiap ikhtiar pendidikan tervalidasi dan mendapatkan perhatian yang layak.', 3, true, now]
    ];
    sheetBeranda.getRange(2, 1, initialLeaders.length, initialLeaders[0].length).setValues(initialLeaders);
  }

  // Isi data awal susunan pengurus & organogram jika sheet app_pengurus baru
  const sheetPengurus = ss.getSheetByName('app_pengurus');
  if (sheetPengurus && sheetPengurus.getLastRow() <= 1) {
    seedInitialPengurusData(sheetPengurus);
  }

  return {
    success: true,
    message: 'Berhasil membuat dan menyiapkan 5 tab sheet CMS & Pengurus Web Publik!',
    createdSheets: createdSheets
  };
}

function seedInitialPengurusData(sheet) {
  const now = new Date().toISOString();
  const initialPengurus = [
    ['PGR-01', 'pelindung', 'Rais Syuriyah PCNU Kabupaten Demak', "KH. M. Zainal Arifin Ma'shum", 'KH.', '', 'https://lh3.googleusercontent.com/d/15r1HChPt-hSueGYK8_84V5t-xuwzM02G', '', 'koordinasi', "Pelindung, penasihat spiritual dan pengarah kebijakan umum keagamaan serta sanad keilmuan turots Aswaja.", 1, true, now],
    ['PGR-02', 'pelindung', 'Ketua Tanfidziyah PCNU Kabupaten Demak', 'KH. M. Aminuddin, M.Si.', 'KH.', 'M.Si.', 'https://lh3.googleusercontent.com/d/1uNBAgynTrwyyyxhQL9edxhw-2IozYBuD', '', 'koordinasi', "Pembina kelembagaan jam'iyyah, pengarah sinergi program kerja cabang dengan badan otonom dan lembaga NU.", 2, true, now],
    ['PGR-03', 'ketua', 'Ketua PC RMI NU Kabupaten Demak', 'KH. Ibrahim Cholilullah, S.Pd.I.', 'KH.', 'S.Pd.I.', 'https://lh3.googleusercontent.com/d/1cWI3Eql8KNgiJ15XnctjWuhujGVMD6YJ', 'PGR-02', 'komando', "Pucuk pimpinan eksekutif, penanggung jawab komando tertinggi tata kelola pesantren, madrasah diniyah, dan TPQ se-Kabupaten Demak.", 3, true, now],
    ['PGR-04', 'wakil_ketua', 'Wakil Ketua Bidang Kepesantrenan & Lembaga', 'K. M. Nurul Huda', 'K.', '', 'https://lh3.googleusercontent.com/d/1cWI3Eql8KNgiJ15XnctjWuhujGVMD6YJ', 'PGR-03', 'komando', "Membantu Ketua dalam mengoordinasikan bidang kepesantrenan, pembinaan santri mukim, dan hubungan antar lembaga pondok.", 4, true, now],
    ['PGR-05', 'sekretaris', 'Sekretaris', 'K. Ahmad Badhawi Ali', 'K.', '', 'https://lh3.googleusercontent.com/d/1cWI3Eql8KNgiJ15XnctjWuhujGVMD6YJ', 'PGR-03', 'komando', "Pimpinan biro administrasi, persuratan dinas, tata kelola dokumen legalitas, dan penghubung lintas instansi/kementerian.", 5, true, now],
    ['PGR-06', 'wakil_sekretaris', 'Wakil Sekretaris', 'Ust. M. Choirul Anam, S.Pd.', 'Ust.', 'S.Pd.', 'https://lh3.googleusercontent.com/d/1cWI3Eql8KNgiJ15XnctjWuhujGVMD6YJ', 'PGR-05', 'komando', "Mendampingi sekretaris dalam notulensi rapat berkala, arsip digital, dan registrasi pendaftaran pondok pesantren.", 6, true, now],
    ['PGR-07', 'bendahara', 'Bendahara Umum', 'KH. Farid Ubaidillah, S.Kom', 'KH.', 'S.Kom', 'https://lh3.googleusercontent.com/d/1cWI3Eql8KNgiJ15XnctjWuhujGVMD6YJ', 'PGR-03', 'komando', "Pengelola kas dan perbendaharaan organisasi, pengawasan transparansi anggaran, dan pendanaan program kerja cabang.", 7, true, now],
    ['PGR-08', 'wakil_bendahara', 'Wakil Bendahara', 'H. Ahmad Zaini', 'H.', '', 'https://lh3.googleusercontent.com/d/1cWI3Eql8KNgiJ15XnctjWuhujGVMD6YJ', 'PGR-07', 'komando', "Membantu pembukuan kas harian, operasional kesekretariatan, dan laporan pertanggungjawaban keuangan.", 8, true, now],
    ['PGR-09', 'bidang', 'Ketua Bidang Pendidikan, Kurikulum & Turots', 'Gus Muhammad Ilyas', 'Gus', '', 'https://lh3.googleusercontent.com/d/1cWI3Eql8KNgiJ15XnctjWuhujGVMD6YJ', 'PGR-03', 'komando', "Standardisasi kurikulum kitab kuning (ula, wustha, ulya), fasilitasi pengujian mutu santri, dan penguatan sanad keilmuan.", 9, true, now],
    ['PGR-10', 'bidang', 'Ketua Bidang Kemandirian Ekonomi & Kopontren', 'K. Agus Mubarok', 'K.', '', 'https://lh3.googleusercontent.com/d/1cWI3Eql8KNgiJ15XnctjWuhujGVMD6YJ', 'PGR-03', 'komando', "Pengembangan inkubasi bisnis pesantren, pendirian Koperasi Pondok Pesantren (Kopontren), dan jejaring kemitraan pasar.", 10, true, now],
    ['PGR-11', 'bidang', 'Ketua Bidang Data, Media & Transformasi Digital', 'Ust. Ahmad Nazirul, M.Kom.', 'Ust.', 'M.Kom.', 'https://lh3.googleusercontent.com/d/1cWI3Eql8KNgiJ15XnctjWuhujGVMD6YJ', 'PGR-03', 'komando', "Pengembangan arsitektur portal satu data, pemetaan geospasial pesantren, sistem informasi manajemen, dan publikasi warta.", 11, true, now],
    ['PGR-12', 'mwc', 'Koordinator Wilayah 14 MWC NU Kecamatan', 'Jajaran Tim Korwil MWC Se-Demak', '', '', 'https://lh3.googleusercontent.com/d/1cWI3Eql8KNgiJ15XnctjWuhujGVMD6YJ', 'PGR-05', 'koordinasi', "Menghubungkan cabang dengan pondok pesantren di 14 kecamatan se-Kabupaten Demak.", 12, true, now]
  ];
  sheet.getRange(2, 1, initialPengurus.length, initialPengurus[0].length).setValues(initialPengurus);
}

// Mengambil seluruh data pengurus dan garis komando
function getPengurusOrganogram() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = ss.getSheetByName('app_pengurus');
    
    // Fallback: buat otomatis jika sheet belum ada
    if (!sheet) {
      setupWebCmsSheets();
      sheet = ss.getSheetByName('app_pengurus');
    }
    
    if (!sheet || sheet.getLastRow() <= 1) {
      if (sheet) seedInitialPengurusData(sheet);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const pengurusList = rows.map(r => {
      let obj = {};
      headers.forEach((h, idx) => {
        obj[h] = r[idx];
      });
      return obj;
    }).filter(p => p.id && p.nama_lengkap);
    
    // Sort berdasarkan urutan
    pengurusList.sort((a, b) => Number(a.urutan || 99) - Number(b.urutan || 99));
    
    return {
      success: true,
      total: pengurusList.length,
      data: pengurusList,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return { success: false, error: err.message, data: [] };
  }
}

// Simpan atau perbarui pengurus (Create/Update)
function handleSavePengurusRecord(payload) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = ss.getSheetByName('app_pengurus');
    if (!sheet) {
      setupWebCmsSheets();
      sheet = ss.getSheetByName('app_pengurus');
    }
    
    const now = new Date().toISOString();
    const data = sheet.getDataRange().getValues();
    
    let id = payload.id;
    let rowIndex = -1;
    
    if (id) {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(id)) {
          rowIndex = i + 1;
          break;
        }
      }
    } else {
      id = 'PGR-' + Utilities.formatString('%02d', data.length);
    }
    
    const rowData = [
      id,
      payload.tingkat_hirarki || 'bidang',
      payload.jabatan || 'Pengurus',
      payload.nama_lengkap || '',
      payload.gelar_depan || '',
      payload.gelar_belakang || '',
      payload.foto_drive_url || 'https://lh3.googleusercontent.com/d/1cWI3Eql8KNgiJ15XnctjWuhujGVMD6YJ',
      payload.parent_id || '',
      payload.tipe_garis || 'komando',
      payload.tupoksi || '',
      Number(payload.urutan) || (data.length),
      payload.is_active !== false,
      now
    ];
    
    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    
    return {
      success: true,
      message: 'Data pengurus ' + payload.nama_lengkap + ' berhasil disimpan!',
      id: id,
      data: payload
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Hapus pengurus
function handleDeletePengurusRecord(payload) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName('app_pengurus');
    if (!sheet) return { success: false, error: 'Sheet app_pengurus tidak ditemukan' };
    
    const id = payload.id;
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Pengurus ID ' + id + ' berhasil dihapus.' };
      }
    }
    return { success: false, error: 'Pengurus tidak ditemukan' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =========================================================================
// SAMBANG PESANTREN PW RMI NU JATENG 2026 (TUAN RUMAH DEMAK) - DELEGASI
// =========================================================================
function handleSubmitSambangDelegate(payload, lock) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = ss.getSheetByName('sambang_delegates');
    const headers = SCHEMAS.sambang_delegates;

    // Self-healing: buat sheet jika belum ada
    if (!sheet) {
      sheet = ss.insertSheet('sambang_delegates');
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#005c55').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    } else {
      // Pastikan header kolom E selalu 'kategori_halaqah'
      const curHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
      if (curHeaders[4] !== 'kategori_halaqah') {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      }
    }

    const timestamp = payload.timestamp || new Date().toISOString();
    const lastRow = sheet.getLastRow();
    const delegateId = 'SBP-2026-' + Utilities.formatString('%03d', Math.max(1, lastRow));
    const kategoriHalaqah = payload.kategori_halaqah || payload.kategori_majlis || '-';

    const rowData = [
      delegateId,
      timestamp,
      payload.kecamatan || '-',
      payload.nama_pesantren || '-',
      kategoriHalaqah,
      payload.nama_peserta || '-',
      payload.whatsapp || payload.no_whatsapp || '-',
      payload.jabatan || payload.jabatan_peran || '-',
      payload.catatan || payload.catatan_khusus || '-',
      'TERDAFTAR'
    ];

    sheet.appendRow(rowData);

    return {
      success: true,
      message: 'Delegasi ' + (payload.nama_peserta || '') + ' dari ' + (payload.nama_pesantren || '') + ' berhasil didaftarkan.',
      delegate_id: delegateId,
      kategori_halaqah: kategoriHalaqah,
      nama_pesantren: payload.nama_pesantren,
      nama_peserta: payload.nama_peserta
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Check-in Kehadiran Delegasi via Scan QR Code / Manual ID di Meja Tamu
function handleScanCheckinSambang(payload, lock) {
  try {
    const rawCode = String(payload.delegate_id || payload.qr_code || '').trim();
    if (!rawCode) {
      return { success: false, error: 'Kode QR atau ID Delegasi tidak boleh kosong.' };
    }

    // Ekstraksi ID delegasi (misal jika format QR berupa JSON string atau URL, cari SBP-2026-xxx)
    let delegateId = rawCode;
    const match = rawCode.match(/SBP-2026-\d{3,}/i);
    if (match) {
      delegateId = match[0].toUpperCase();
    } else {
      delegateId = delegateId.toUpperCase();
    }

    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName('sambang_delegates');
    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: false, error: 'Database sambang_delegates belum memiliki data.' };
    }

    // Pastikan schema header lengkap (termasuk waktu_kehadiran & petugas_scan)
    const headers = SCHEMAS.sambang_delegates;
    const curHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (curHeaders.length < headers.length || curHeaders[10] !== 'waktu_kehadiran') {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#005c55').setFontColor('#ffffff');
    }

    const raw = sheet.getDataRange().getValues();
    let foundRowIndex = -1;
    let delegateRecord = null;

    for (let i = 1; i < raw.length; i++) {
      const rowId = String(raw[i][0] || '').trim().toUpperCase();
      if (rowId === delegateId) {
        foundRowIndex = i + 1; // 1-based index in Google Sheets
        delegateRecord = raw[i];
        break;
      }
    }

    if (foundRowIndex === -1 || !delegateRecord) {
      return {
        success: false,
        error: 'ID Delegasi "' + delegateId + '" tidak ditemukan di database resmi PC RMI NU Demak.'
      };
    }

    const currentStatus = String(delegateRecord[9] || '').toUpperCase();
    const namaPeserta = delegateRecord[5] || '-';
    const namaPesantren = delegateRecord[3] || '-';
    const kategoriHalaqah = delegateRecord[4] || '-';
    const kecamatan = delegateRecord[2] || '-';
    const jabatan = delegateRecord[7] || '-';
    const existingWaktu = delegateRecord[10] || '-';

    // Cek jika sudah pernah check-in
    if (currentStatus === 'HADIR') {
      return {
        success: true,
        already_checked_in: true,
        delegate_id: delegateId,
        nama_peserta: namaPeserta,
        nama_pesantren: namaPesantren,
        kategori_halaqah: kategoriHalaqah,
        kecamatan: kecamatan,
        jabatan_peran: jabatan,
        waktu_kehadiran: existingWaktu,
        petugas_scan: delegateRecord[11] || 'Front-Desk',
        message: 'PERINGATAN: Delegasi ' + namaPeserta + ' (' + namaPesantren + ') SUDAH PERNAH CHECK-IN sebelumnya pada ' + existingWaktu + '.'
      };
    }

    // Eksekusi Check-in baru
    const checkinTime = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
    const petugas = payload.petugas || 'Front-Desk Futuhiyyah';

    sheet.getRange(foundRowIndex, 10).setValue('HADIR');
    sheet.getRange(foundRowIndex, 11).setValue(checkinTime);
    sheet.getRange(foundRowIndex, 12).setValue(petugas);

    return {
      success: true,
      already_checked_in: false,
      delegate_id: delegateId,
      nama_peserta: namaPeserta,
      nama_pesantren: namaPesantren,
      kategori_halaqah: kategoriHalaqah,
      kecamatan: kecamatan,
      jabatan_peran: jabatan,
      waktu_kehadiran: checkinTime,
      petugas_scan: petugas,
      message: 'VERIFIKASI BERHASIL! Selamat Datang ' + namaPeserta + ' (' + namaPesantren + ') di ' + kategoriHalaqah + '.'
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getSambangDelegatesData() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName('sambang_delegates');
    if (!sheet || sheet.getLastRow() <= 1) {
      return {
        success: true,
        count: 0,
        total_terdaftar: 0,
        total_hadir: 0,
        data: [],
        stats: {},
        halaqah_stats: {}
      };
    }

    // Auto-migrate header jika masih kurang kolom atau masih ada 'kategori_majlis'
    const headers = SCHEMAS.sambang_delegates;
    const curHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (curHeaders[4] !== 'kategori_halaqah' || curHeaders.length < headers.length) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#005c55').setFontColor('#ffffff');
    }

    const raw = sheet.getDataRange().getValues();
    const colHeaders = raw[0];
    const delegates = [];
    const stats = {};
    const halaqahStats = {
      'Halaqah 1: Konsolidasi Pengurus RMI': { registered: 0, present: 0, max_capacity: 60 },
      'Halaqah 2: Bidang Madin & Kepala Madin': { registered: 0, present: 0, max_capacity: 30 },
      'Halaqah 3: Diskusi Kepengasuhan Pengasuh (Kyai/Bu Nyai)': { registered: 0, present: 0, max_capacity: 100 },
      'Halaqah 4: Pelatihan Musyrif & Musyrifah (Asrama)': { registered: 0, present: 0, max_capacity: 100 },
      'Halaqah 5: Pelatihan Media Pesantren': { registered: 0, present: 0, max_capacity: 50 }
    };

    let totalHadir = 0;

    for (let i = 1; i < raw.length; i++) {
      const row = raw[i];
      const item = {};
      colHeaders.forEach((h, idx) => {
        let val = row[idx];
        // Migrasi nilai string dari Majlis ke Halaqah jika ada
        if (typeof val === 'string' && val.includes('Majlis')) {
          val = val.replace(/Majlis/g, 'Halaqah');
          sheet.getRange(i + 1, idx + 1).setValue(val);
        }
        item[h] = val;
      });
      delegates.push(item);

      const kat = String(item.kategori_halaqah || item.kategori_majlis || 'Lainnya');
      stats[kat] = (stats[kat] || 0) + 1;

      const isHadir = String(item.status_kehadiran || '').toUpperCase() === 'HADIR';
      if (isHadir) {
        totalHadir++;
      }

      // Hitung per halaqah
      let matchedKey = null;
      for (const hKey in halaqahStats) {
        if (kat.includes(hKey) || hKey.includes(kat) || (kat.includes('Halaqah 4') && hKey.includes('Halaqah 4')) || (kat.includes('Halaqah 5') && hKey.includes('Halaqah 5')) || (kat.includes('Halaqah 3') && hKey.includes('Halaqah 3')) || (kat.includes('Halaqah 2') && hKey.includes('Halaqah 2')) || (kat.includes('Halaqah 1') && hKey.includes('Halaqah 1'))) {
          matchedKey = hKey;
          break;
        }
      }
      if (matchedKey) {
        halaqahStats[matchedKey].registered++;
        if (isHadir) {
          halaqahStats[matchedKey].present++;
        }
      }
    }

    return {
      success: true,
      count: delegates.length,
      total_terdaftar: delegates.length,
      total_hadir: totalHadir,
      data: delegates,
      stats: stats,
      halaqah_stats: halaqahStats
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =========================================================================
// MANAJEMEN WARTA & BERITA MEDIA RMI NU DEMAK (WEB PUBLIK & SINKRONISASI)
// =========================================================================
function getPublicBeritaList(params) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = ss.getSheetByName('web_berita');
    const headers = [
      'id', 'judul', 'slug', 'kategori', 'ringkasan', 'isi_lengkap', 
      'cover_image_url', 'penulis', 'sumber_media', 'url_sumber', 
      'is_featured', 'status', 'published_at', 'views_count', 'updated_at'
    ];

    if (!sheet) {
      sheet = ss.insertSheet('web_berita');
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#005c55').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    } else {
      // Self-healing header: pastikan kolom sumber_media dan url_sumber ada
      const curFirstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
      if (curFirstRow[8] !== 'sumber_media' || curFirstRow[9] !== 'url_sumber') {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#005c55').setFontColor('#ffffff');
      }
    }

    if (sheet.getLastRow() <= 1) {
      seedInitialBeritaData(sheet);
    }

    const data = sheet.getDataRange().getValues();
    const curHeaders = headers; // gunakan schema headers resmi
    const rows = data.slice(1);

    const beritaList = rows.map(r => {
      let obj = {};
      curHeaders.forEach((h, idx) => {
        obj[h] = r[idx];
      });
      return obj;
    }).filter(b => {
      if (!b.id || !b.judul) return false;
      const st = String(b.status || 'published').toLowerCase();
      return st === 'published' || st === 'terbit' || st === 'true' || !b.status;
    });

    // Sort descending berdasarkan published_at
    beritaList.sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));

    return {
      success: true,
      count: beritaList.length,
      data: beritaList,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return { success: false, error: err.message, data: [] };
  }
}

function seedInitialBeritaData(sheet) {
  const initialNews = [
    [
      'BRT-2026-001',
      'Jaga Marwah Pesantren, RMINU Demak Perkuat Peran Bu Nyai dalam Perlindungan Santri',
      'jaga-marwah-pesantren-rminu-demak-perkuat-peran-bu-nyai-dalam-perlindungan-santri',
      'Pesantren Ramah Anak',
      'RMI NU Demak memperkuat peran Bu Nyai dan pengasuh pondok pesantren putri dalam menciptakan lingkungan asrama yang aman, ramah anak, serta mandiri secara ekonomi.',
      'RMI NU Demak memperkuat peran Bu Nyai dan pengasuh pondok pesantren putri dalam menciptakan lingkungan asrama yang aman, ramah anak, serta mandiri secara ekonomi.\n\nSelengkapnya dapat dibaca langsung pada publikasi media terkait (NU Online Jateng).',
      'https://lh3.googleusercontent.com/d/1mOekcQhUGD2eqHMy-8AmEua9BrJK-06Z',
      'Tim Media RMI NU Demak',
      'NU Online Jateng',
      'https://jateng.nu.or.id',
      true,
      'published',
      '2026-11-05',
      1250,
      new Date().toISOString()
    ],
    [
      'BRT-2026-002',
      'RMI PCNU Demak Deklarasikan Pesantren Sadar Hukum, Perlindungan Santri Jadi Prioritas',
      'rmi-pcnu-demak-deklarasikan-pesantren-sadar-hukum-perlindungan-santri-jadi-prioritas',
      'Pesantren Ramah Anak',
      'RMI PCNU Demak bersama Pemkab Demak dan Unit PPA Polres Demak menggelar Talkshow di Hotel Amantis, mendeklarasikan gerakan Pesantren Sadar Hukum.',
      'RMI PCNU Demak bersama Pemkab Demak dan Unit PPA Polres Demak menggelar Talkshow di Hotel Amantis, mendeklarasikan gerakan Pesantren Sadar Hukum guna memperkuat perlindungan santri.',
      'https://lh3.googleusercontent.com/d/1cXO8QC16Fe2VA147fgjeI49uwIWEpM21',
      'Tim Media RMI NU Demak',
      'Kabarjateng.id',
      'https://kabarjateng.id',
      false,
      'published',
      '2026-11-01',
      1420,
      new Date().toISOString()
    ],
    [
      'BRT-2026-003',
      'Respon Tuntutan Zaman, RMI NU Demak Konsolidasikan Madrasah Diniyah',
      'respon-tuntutan-zaman-rmi-nu-demak-konsolidasikan-madrasah-diniyah',
      'Pendidikan & Madin',
      'Bidang Madin RMI NU Demak menggelar konsolidasi dewan asatidz se-Kabupaten Demak guna merespons dinamika kurikulum dan standardisasi mutu pembelajaran santri.',
      'Bidang Madin RMI NU Demak menggelar konsolidasi dewan asatidz se-Kabupaten Demak guna merespons dinamika kurikulum dan standardisasi mutu pembelajaran santri.',
      'https://lh3.googleusercontent.com/d/17kYcDeiWR9QtzTTwjZE1r_xyCtnDLNET',
      'Tim Media RMI NU Demak',
      'Suara Nahdliyin',
      'https://suaranahdliyin.com',
      false,
      'published',
      '2026-09-16',
      980,
      new Date().toISOString()
    ]
  ];
  sheet.getRange(2, 1, initialNews.length, initialNews[0].length).setValues(initialNews);
}

function handleSaveBerita(payload) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = ss.getSheetByName('web_berita');
    const headers = [
      'id', 'judul', 'slug', 'kategori', 'ringkasan', 'isi_lengkap', 
      'cover_image_url', 'penulis', 'sumber_media', 'url_sumber', 
      'is_featured', 'status', 'published_at', 'views_count', 'updated_at'
    ];

    if (!sheet) {
      sheet = ss.insertSheet('web_berita');
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#005c55').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    const now = new Date().toISOString();
    const data = sheet.getDataRange().getValues();
    let id = payload.id;
    let rowIndex = -1;

    if (id) {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).toUpperCase() === String(id).toUpperCase()) {
          rowIndex = i + 1;
          break;
        }
      }
    } else {
      id = 'BRT-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyy') + '-' + Utilities.formatString('%03d', data.length);
    }

    const rowData = [
      id,
      payload.judul || 'Tanpa Judul',
      payload.slug || '',
      payload.kategori || 'Warta Organisasi',
      payload.ringkasan || '',
      payload.isi_lengkap || '',
      payload.cover_image_url || 'https://lh3.googleusercontent.com/d/1mOekcQhUGD2eqHMy-8AmEua9BrJK-06Z',
      payload.penulis || 'Tim Media RMI NU Demak',
      payload.sumber_media || 'Media Online',
      payload.url_sumber || '',
      payload.is_featured === true,
      payload.status || 'published',
      payload.published_at || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd'),
      Number(payload.views_count) || 0,
      now
    ];

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }

    return {
      success: true,
      message: 'Berita "' + payload.judul + '" berhasil disimpan!',
      id: id
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Membersihkan seluruh entri berita dummy/mock uji coba dari tab web_berita
function handleCleanDummyBerita() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName('web_berita');
    if (!sheet) return { success: false, error: 'Sheet web_berita tidak ditemukan' };

    const data = sheet.getDataRange().getValues();
    let deletedCount = 0;

    for (let i = data.length - 1; i >= 1; i--) {
      const rowId = String(data[i][0] || '').trim().toUpperCase();
      const judul = String(data[i][1] || '').trim().toLowerCase();

      const isDummy = rowId === 'BRT-TEST-001' || 
                      rowId === '1' || 
                      rowId === '2' || 
                      judul.includes('uji berita') || 
                      judul.includes('ribuan santri') ||
                      judul.includes('bantuan sanitasi') ||
                      judul.includes('mitigasi bencana banjir rob') ||
                      judul.includes('antologi puisi');

      if (isDummy) {
        sheet.deleteRow(i + 1);
        deletedCount++;
      }
    }

    return {
      success: true,
      message: 'Berhasil membersihkan ' + deletedCount + ' data dummy/mock dari tab web_berita!',
      deletedCount: deletedCount
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
