/**
 * =========================================================================
 * 03_Pesantren_Core.gs
 * Modul Inti Pesantren: Sequence Lock (ID Generator), CRUD Lembaga, & Seeding
 * =========================================================================
 */

// =========================================================================
// 4. ATOMIC SEQUENCE LOCKSERVICE: PENERBITAN KODE ID RESMI RMI DEMAK
// =========================================================================
function issueNextPesantrenCode(lock) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName('pesantren');
  if (!sheet) throw new Error('Sheet "pesantren" belum tersedia.');
  
  const lastRow = sheet.getLastRow();
  let nextSeq = 1;
  
  if (lastRow > 1) {
    const codes = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    let maxSeq = 0;
    for (let i = 0; i < codes.length; i++) {
      const codeStr = String(codes[i][0]);
      const match = codeStr.match(/RMI-DMK-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    }
    nextSeq = maxSeq + 1;
  }
  
  const formattedSeq = ('000000' + nextSeq).slice(-6);
  return 'RMI-DMK-' + formattedSeq;
}


// =========================================================================
// 7. BUSINESS LOGIC HANDLERS
// =========================================================================

function handleCreatePesantren(payload, lock) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const data = payload.pesantren || {};
  const files = payload.files || {};
  
  // 1. Dapatkan Kode Resmi RMI-DMK secara atomik
  const kodePesantren = issueNextPesantrenCode(lock);
  const pesantrenId = Utilities.getUuid();
  const now = new Date().toISOString();
  
  // 2. Upload file izin & foto ke Google Drive
  let izopDrive = null;
  let fotoDrive = null;
  let logoDrive = null;
  if (files.izop) izopDrive = uploadBase64FileToDrive(files.izop, 'Legalitas_IZOP');
  if (files.foto) fotoDrive = uploadBase64FileToDrive(files.foto, 'Foto_Lokasi');
  if (files.logo) logoDrive = uploadBase64FileToDrive(files.logo, 'Logo_Pesantren');

  const logoUrl = logoDrive ? (logoDrive.directUrl || logoDrive.url) : (data.logo_url || '');
  
  // 3. Tulis ke sheet: pesantren
  const sheetPesantren = ss.getSheetByName('pesantren');
  sheetPesantren.appendRow([
    pesantrenId,
    kodePesantren,
    data.nama_resmi || '',
    data.nama_populer || '',
    data.nspp || '',
    data.tahun_berdiri || '',
    data.status_operasional || 'active',
    data.status_keanggotaan_rmi || 'member',
    data.status_verifikasi || 'under_review',
    data.status_verifikasi_lokasi || 'not_verified',
    data.status_publikasi || 'private',
    data.has_komitmen_pesantren_aman ? true : false,
    data.sumber_data_awal || 'survey_rmi',
    '',
    now,
    now,
    payload.user || 'Admin',
    payload.user || 'Admin',
    logoUrl
  ]);
  
  // 4. Tulis ke sheet: pesantren_locations
  const sheetLoc = ss.getSheetByName('pesantren_locations');
  sheetLoc.appendRow([
    Utilities.getUuid(),
    pesantrenId,
    data.alamat || '',
    '', '', '',
    data.desa || '',
    data.kecamatan || '',
    CONFIG.KABUPATEN,
    CONFIG.PROVINSI,
    '',
    data.latitude || -6.8944,
    data.longitude || 110.6386,
    0,
    'manual_input',
    '',
    true,
    now,
    now
  ]);
  
  // 5. Tulis ke sheet: pesantren_leaders
  if (data.pengasuh_utama) {
    const sheetLeaders = ss.getSheetByName('pesantren_leaders');
    sheetLeaders.appendRow([
      Utilities.getUuid(),
      pesantrenId,
      data.pengasuh_utama,
      '', '',
      'Khadimul Ma\'had / Pengasuh Utama',
      'ustadz',
      'Turots & Fiqih',
      'Pesantren Salaf',
      1,
      true,
      true,
      now,
      now
    ]);
  }
  
  // 6. Tulis ke sheet: pesantren_contacts
  const contacts = data.media_sosial || {};
  const sheetContacts = ss.getSheetByName('pesantren_contacts');
  if (contacts.hotline_psb) {
    sheetContacts.appendRow([Utilities.getUuid(), pesantrenId, 'hotline_psb', contacts.hotline_psb, 'Hotline PSB', true, true, now, now]);
  }
  if (contacts.youtube) {
    sheetContacts.appendRow([Utilities.getUuid(), pesantrenId, 'youtube', contacts.youtube, 'Kanal YouTube', false, true, now, now]);
  }
  if (contacts.instagram) {
    sheetContacts.appendRow([Utilities.getUuid(), pesantrenId, 'instagram', contacts.instagram, 'Akun Instagram', false, true, now, now]);
  }
  
  // 7. Tulis ke sheet: pesantren_legalities (jika ada file IZOP)
  if (izopDrive) {
    const sheetLegalities = ss.getSheetByName('pesantren_legalities');
    sheetLegalities.appendRow([
      Utilities.getUuid(),
      pesantrenId,
      'izop_kemenag',
      data.nspp || '',
      'Kementerian Agama RI',
      '', '',
      'terverifikasi',
      izopDrive.fileId,
      izopDrive.url,
      'Diunggah via Admin Dashboard',
      now,
      now
    ]);
  }
  
  // 8. Log ke sheet: audit_logs
  recordAuditLog(ss, {
    user_id: payload.user || 'Admin',
    user_role: payload.role || 'super_admin',
    event_type: 'CREATE_PESANTREN',
    entity_type: 'pesantren',
    entity_id: kodePesantren,
    action_description: 'Menerbitkan kode ID resmi ' + kodePesantren + ' untuk lembaga: ' + data.nama_resmi,
    status: 'SUCCESS'
  });
  
  return {
    success: true,
    pesantrenId: pesantrenId,
    kode_pesantren: kodePesantren,
    logo_url: logoUrl,
    message: 'Pesantren berhasil disimpan dan ID resmi berhasil diterbitkan.',
    filesUploaded: {
      izop: izopDrive ? izopDrive.url : null,
      foto: fotoDrive ? fotoDrive.url : null,
      logo: logoUrl || null
    }
  };
}

// =========================================================================
// PEMBARUAN LOGO RESMI PESANTREN (BUKU INDUK DOMAIN 1)
// =========================================================================
function handleUpdatePesantrenLogo(payload) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName('pesantren');
  if (!sheet) return { success: false, message: 'Sheet pesantren tidak ditemukan' };
  
  const pesantrenId = payload.pesantrenId;
  const fileLogo = payload.fileLogo || payload.logo;
  const user = payload.user || 'Admin';
  const role = payload.role || 'super_admin';
  const now = new Date().toISOString();
  
  if (!fileLogo || !fileLogo.base64) {
    return { success: false, message: 'File logo tidak valid atau kosong' };
  }
  
  // Upload ke Google Drive subfolder Logo_Pesantren
  const uploaded = uploadBase64FileToDrive(fileLogo, 'Logo_Pesantren');
  if (!uploaded) {
    return { success: false, message: 'Gagal mengunggah file logo ke Google Drive' };
  }
  
  const logoUrl = uploaded.directUrl || uploaded.url;
  
  // Cari baris pesantren berdasarkan id atau kode_pesantren
  const data = sheet.getDataRange().getValues();
  let foundRow = -1;
  let kodePesantren = '';
  let namaPesantren = '';
  
  const headers = data[0];
  let colLogo = headers.indexOf('logo_url') + 1;
  if (colLogo === 0) {
    // Tambahkan header logo_url di akhir jika belum ada
    colLogo = headers.length + 1;
    sheet.getRange(1, colLogo).setValue('logo_url').setFontWeight('bold').setBackground('#005c55').setFontColor('#ffffff');
  }
  
  for (let r = 1; r < data.length; r++) {
    if (data[r][0] === pesantrenId || data[r][1] === pesantrenId) {
      foundRow = r + 1;
      kodePesantren = data[r][1];
      namaPesantren = data[r][2];
      break;
    }
  }
  
  if (foundRow === -1) {
    return { success: false, message: 'Pesantren ID ' + pesantrenId + ' tidak ditemukan dalam database.' };
  }
  
  // Set nilai logo_url
  sheet.getRange(foundRow, colLogo).setValue(logoUrl);
  // Update updated_at dan updated_by
  if (headers.indexOf('updated_at') !== -1) {
    sheet.getRange(foundRow, headers.indexOf('updated_at') + 1).setValue(now);
  }
  if (headers.indexOf('updated_by') !== -1) {
    sheet.getRange(foundRow, headers.indexOf('updated_by') + 1).setValue(user);
  }
  
  // Catat audit log
  recordAuditLog(ss, {
    user_id: user,
    user_role: role,
    event_type: 'UPDATE_PESANTREN_LOGO',
    entity_type: 'pesantren',
    entity_id: kodePesantren,
    action_description: 'Pembaruan logo resmi pesantren: ' + namaPesantren,
    status: 'SUCCESS'
  });
  
  return {
    success: true,
    message: 'Logo resmi pesantren berhasil diperbarui.',
    logo_url: logoUrl,
    pesantrenId: pesantrenId,
    kode_pesantren: kodePesantren
  };
}

// =========================================================================
// PENDAFTARAN MANDIRI PESANTREN BARU (VERIFIKASI BERJENJANG)
// =========================================================================
function handleSelfRegisterPesantren(payload, lock) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const data = (payload && payload.payload) ? payload.payload : (payload || {});
  const operator = data.operator || {};
  const pesantren = data.pesantren || {};
  const files = data.files || {};
  const now = new Date().toISOString();

  const operatorEmail = String(operator.email || '').trim().toLowerCase();
  const operatorNama = String(operator.nama_lengkap || '').trim();
  const operatorPhone = String(operator.phone || '').trim();
  const namaPesantren = String(pesantren.nama_resmi || '').trim();

  if (!operatorEmail || !operatorEmail.includes('@')) {
    return { success: false, message: 'Alamat email resmi operator wajib diisi.' };
  }
  if (!operatorNama) {
    return { success: false, message: 'Nama lengkap operator pemohon wajib diisi.' };
  }
  if (!namaPesantren) {
    return { success: false, message: 'Nama resmi pondok pesantren wajib diisi.' };
  }

  // 1. Cek apakah email operator sudah pernah terdaftar di app_users
  const existingUser = findUserByEmailInSheet(operatorEmail);
  if (existingUser && existingUser.isActive) {
    return { 
      success: false, 
      message: 'Email ' + operatorEmail + ' sudah terdaftar dan aktif. Silakan langsung masuk via menu Login Admin.' 
    };
  }

  // 2. Cek apakah nama pesantren / NSPP sudah ada di pangkalan data
  const sheetPesantren = ss.getSheetByName('pesantren');
  if (sheetPesantren) {
    const pValues = sheetPesantren.getDataRange().getValues();
    for (let r = 1; r < pValues.length; r++) {
      const rowNama = String(pValues[r][2] || '').trim().toLowerCase();
      const rowNspp = String(pValues[r][4] || '').trim();
      if (pesantren.nspp && rowNspp && rowNspp === String(pesantren.nspp).trim()) {
        return { success: false, message: 'NSPP ' + pesantren.nspp + ' sudah terdaftar di sistem untuk: ' + pValues[r][2] };
      }
      if (rowNama === namaPesantren.toLowerCase()) {
        return { success: false, message: 'Pesantren dengan nama "' + namaPesantren + '" sudah tercatat di pangkalan data.' };
      }
    }
  }

  // 3. Penerbitan ID Pesantren & Kode Registrasi Sementara (Format: REG-DMK-XXXXXX)
  const regSeq = Math.floor(100000 + Math.random() * 900000);
  const regCode = 'REG-DMK-' + regSeq;
  const kodePesantren = issueNextPesantrenCode(lock);
  const pesantrenId = Utilities.getUuid();

  // 4. Upload berkas rekomendasi MWC / izin / foto
  let izopDrive = null;
  let rekomendasiDrive = null;
  let fotoDrive = null;
  if (files.izop) izopDrive = uploadBase64FileToDrive(files.izop, 'Pendaftaran_Mandiri_Legalitas');
  if (files.rekomendasi) rekomendasiDrive = uploadBase64FileToDrive(files.rekomendasi, 'Pendaftaran_Mandiri_Rekomendasi_MWC');
  if (files.foto) fotoDrive = uploadBase64FileToDrive(files.foto, 'Pendaftaran_Mandiri_Foto');

  // 5. Simpan Record Pesantren (Status: under_review, private)
  sheetPesantren.appendRow([
    pesantrenId,
    kodePesantren,
    namaPesantren,
    pesantren.nama_populer || '',
    pesantren.nspp || '',
    pesantren.tahun_berdiri || '',
    'active',
    'member_candidate',
    'under_review',
    'not_verified',
    'private',
    pesantren.has_komitmen_pesantren_aman ? true : false,
    'pendaftaran_mandiri_web',
    'No. Pendaftaran Mandiri: ' + regCode,
    now,
    now,
    operatorNama + ' (Pemohon)',
    'System'
  ]);

  // 6. Simpan Lokasi Pesantren
  const sheetLoc = ss.getSheetByName('pesantren_locations');
  if (sheetLoc) {
    sheetLoc.appendRow([
      Utilities.getUuid(),
      pesantrenId,
      pesantren.alamat || '',
      '', '', '',
      pesantren.desa || '',
      pesantren.kecamatan || '',
      CONFIG.KABUPATEN,
      CONFIG.PROVINSI,
      '',
      pesantren.latitude || -6.8944,
      pesantren.longitude || 110.6386,
      0,
      'self_registration_input',
      'Diajukan mandiri oleh ' + operatorNama,
      true,
      now,
      now
    ]);
  }

  // 7. Simpan Pengasuh Utama
  if (pesantren.pengasuh_utama) {
    const sheetLeaders = ss.getSheetByName('pesantren_leaders');
    if (sheetLeaders) {
      sheetLeaders.appendRow([
        Utilities.getUuid(),
        pesantrenId,
        pesantren.pengasuh_utama,
        '', '',
        'Khadimul Ma\'had / Pengasuh Utama',
        'ustadz',
        'Kajian Turots & Agama',
        'Pesantren Salaf',
        1,
        true,
        true,
        now,
        now
      ]);
    }
  }

  // 8. Simpan Kontak Lembaga
  const sheetContacts = ss.getSheetByName('pesantren_contacts');
  if (sheetContacts && operatorPhone) {
    sheetContacts.appendRow([
      Utilities.getUuid(),
      pesantrenId,
      'whatsapp_operator',
      operatorPhone,
      'WA Operator: ' + operatorNama,
      true,
      false,
      now,
      now
    ]);
  }

  // 9. Buat Akun Pengguna Operator di sheet app_users (is_active: false sampai disetujui)
  const sheetUsers = ss.getSheetByName('app_users');
  let userId = Utilities.getUuid();
  if (sheetUsers) {
    sheetUsers.appendRow([
      userId,
      operatorEmail,
      operatorNama,
      operatorPhone,
      'operator_pesantren',
      namaPesantren + ' (' + (pesantren.kecamatan || 'Demak') + ')',
      false, // Belum aktif, menunggu verifikasi Admin Cabang
      '',
      now,
      now
    ]);
  }

  // 10. Catat Antrean Evaluasi di verification_reviews
  const sheetReviews = ss.getSheetByName('verification_reviews');
  if (sheetReviews) {
    sheetReviews.appendRow([
      Utilities.getUuid(),
      pesantrenId,
      'pendaftaran_mandiri_tahap_1',
      'under_review',
      'Pendaftaran mandiri baru oleh ' + operatorNama + ' (' + operatorEmail + '). Berkas rekomendasi & NSPP menunggu penelaahan tim asesor.',
      '',
      'Lakukan peninjauan dokumen perizinan dan konfirmasi ke MWC ' + (pesantren.kecamatan || ''),
      '',
      'System Ingestion',
      now
    ]);
  }

  // 11. Catat Audit Log
  recordAuditLog(ss, {
    user_id: operatorEmail,
    user_role: 'operator_pesantren (candidate)',
    event_type: 'SELF_REGISTER_PESANTREN',
    entity_type: 'pesantren',
    entity_id: kodePesantren,
    action_description: 'Pendaftaran mandiri diajukan dengan No. Reg ' + regCode + ' untuk lembaga: ' + namaPesantren,
    status: 'SUCCESS'
  });

  // 12. Kirim Email Konfirmasi Tanda Terima ke Operator
  try {
    MailApp.sendEmail({
      to: operatorEmail,
      subject: 'Tanda Terima Pendaftaran Mandiri Pesantren — PC RMI NU Demak (' + regCode + ')',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #005c55; margin: 0;">PC RMI NU KABUPATEN DEMAK</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Portal Satu Data Lembaga Pendidikan Pesantren</p>
          </div>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <p style="color: #166534; font-size: 14px; font-weight: bold; margin: 0;">Alhamdulillah, Formulir Pendaftaran Mandiri Berhasil Diterima!</p>
            <p style="color: #15803d; font-size: 12px; margin: 6px 0 0 0;">Nomor Registrasi: <strong>${regCode}</strong> | Kode RMI Sementara: <strong>${kodePesantren}</strong></p>
          </div>
          <p style="font-size: 13px; color: #334155; line-height: 1.6;">
            Yth. <strong>${operatorNama}</strong>,<br>
            Berkas pendaftaran untuk <strong>${namaPesantren}</strong> (${pesantren.kecamatan || 'Demak'}) telah masuk ke dalam antrean evaluasi verifikasi berjenjang Pengurus Cabang RMI NU Kabupaten Demak.
          </p>
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 14px; font-size: 12px; color: #475569; margin: 16px 0;">
            <strong>Tahapan Verifikasi Berjenjang:</strong>
            <ol style="margin: 8px 0 0 16px; padding: 0;">
              <li>Penelaahan Administratif (Kesesuaian NSPP Kemenag & Surat Rekomendasi MWC).</li>
              <li>Pemeriksaan Lapangan / Konfirmasi Wilayah oleh Pengurus MWC Kecamatan.</li>
              <li>Aktivasi Akun Operator & Penerbitan Sertifikat Tanda Anggota RMI PCNU Demak.</li>
            </ol>
          </div>
          <p style="font-size: 12px; color: #64748b;">
            Setelah disetujui oleh Admin Cabang, akun email Anda (<strong>${operatorEmail}</strong>) akan otomatis aktif dan dapat langsung digunakan login ke portal pengelola dengan metode 1-Klik / OTP.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">Sekretariat PC RMI NU Kabupaten Demak • Khidmah untuk Pesantren Kota Wali</p>
        </div>
      `
    });
  } catch (emailErr) {
    Logger.log('Gagal kirim email tanda terima pendaftaran mandiri: ' + emailErr.message);
  }

  return {
    success: true,
    registrationCode: regCode,
    kodePesantren: kodePesantren,
    pesantrenId: pesantrenId,
    message: 'Pendaftaran mandiri berhasil diajukan dengan nomor registrasi ' + regCode + '. Tanda terima resmi telah dikirim ke email Anda.'
  };
}


function getAllPesantrenData() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheetPesantren = ss.getSheetByName('pesantren');
  if (!sheetPesantren) return { success: false, data: [] };
  
  const pValues = sheetPesantren.getDataRange().getValues();
  if (pValues.length <= 1) return { success: true, data: [] };
  
  const pHeaders = pValues[0];
  
  // Pastikan kolom logo_url ada di baris 1 header
  let logoColIdx = pHeaders.indexOf('logo_url');
  if (logoColIdx === -1) {
    try {
      sheetPesantren.getRange(1, pHeaders.length + 1).setValue('logo_url').setFontWeight('bold').setBackground('#005c55').setFontColor('#ffffff');
      pHeaders.push('logo_url');
      logoColIdx = pHeaders.length - 1;
    } catch (eH) {
      Logger.log('Gagal menambah header logo_url: ' + eH.message);
    }
  }
  
  // Baca tabel-tabel relasi pendukung untuk digabungkan
  const sheetLoc = ss.getSheetByName('pesantren_locations');
  const sheetLeaders = ss.getSheetByName('pesantren_leaders');
  const sheetContacts = ss.getSheetByName('pesantren_contacts');
  const sheetEdu = ss.getSheetByName('pesantren_education');
  const sheetSantri = ss.getSheetByName('pesantren_santri_aggregates');
  const sheetDev = ss.getSheetByName('pesantren_development_profiles');

  const locValues = sheetLoc ? sheetLoc.getDataRange().getValues() : [];
  const leaderValues = sheetLeaders ? sheetLeaders.getDataRange().getValues() : [];
  const contactValues = sheetContacts ? sheetContacts.getDataRange().getValues() : [];
  const eduValues = sheetEdu ? sheetEdu.getDataRange().getValues() : [];
  const santriValues = sheetSantri ? sheetSantri.getDataRange().getValues() : [];
  const devValues = sheetDev ? sheetDev.getDataRange().getValues() : [];

  const list = [];

  for (let r = 1; r < pValues.length; r++) {
    const row = pValues[r];
    const obj = {};
    pHeaders.forEach((h, idx) => {
      obj[h] = row[idx];
    });

    const pId = obj.id;
    obj.logo_url = obj.logo_url ? String(obj.logo_url).trim() : '';

    // Join Location
    obj.alamat = '';
    obj.desa = '';
    obj.kecamatan = '';
    obj.latitude = -6.8944;
    obj.longitude = 110.6386;
    for (let l = 1; l < locValues.length; l++) {
      if (locValues[l][1] === pId) {
        obj.alamat = locValues[l][2] || '';
        obj.desa = locValues[l][6] || '';
        obj.kecamatan = locValues[l][7] || '';
        obj.latitude = locValues[l][11] || -6.8944;
        obj.longitude = locValues[l][12] || 110.6386;
        break;
      }
    }

    // Join Leaders (Dewan Asatidz & Pengasuh)
    obj.dewan_asatidz = [];
    obj.pengasuh_utama = '';
    for (let ld = 1; ld < leaderValues.length; ld++) {
      if (leaderValues[ld][1] === pId) {
        const leaderObj = {
          nama: leaderValues[ld][2],
          jabatan: leaderValues[ld][5],
          kategori: leaderValues[ld][6] || 'ustadz',
          spesialisasi: leaderValues[ld][7] || 'Turots',
          pendidikan: leaderValues[ld][8] || 'Pesantren'
        };
        obj.dewan_asatidz.push(leaderObj);
        if (leaderValues[ld][11] === true || !obj.pengasuh_utama) {
          obj.pengasuh_utama = leaderValues[ld][2];
        }
      }
    }

    // Join Contacts & Social
    obj.media_sosial = {};
    for (let c = 1; c < contactValues.length; c++) {
      if (contactValues[c][1] === pId) {
        const jenis = contactValues[c][2];
        const nilai = contactValues[c][3];
        if (jenis === 'hotline_psb') obj.media_sosial.hotline_psb = nilai;
        if (jenis === 'youtube') obj.media_sosial.youtube = nilai;
        if (jenis === 'instagram') obj.media_sosial.instagram = nilai;
        if (jenis === 'website') obj.media_sosial.website = nilai;
      }
    }

    // Join Education (Kurikulum Kitab Kuning Marhalah)
    obj.kurikulum_kitab = [];
    obj.jenjang_pendidikan = [];
    for (let e = 1; e < eduValues.length; e++) {
      if (eduValues[e][1] === pId) {
        if (eduValues[e][5]) {
          obj.kurikulum_kitab.push({
            marhalah: eduValues[e][4] || 'ula',
            nama_kitab: eduValues[e][5],
            pengarang: eduValues[e][6] || '',
            bidang_ilmu: eduValues[e][7] || ''
          });
        }
        const jalur = eduValues[e][2];
        if (jalur && !obj.jenjang_pendidikan.includes(jalur)) {
          obj.jenjang_pendidikan.push(jalur);
        }
      }
    }

    // Join Santri Aggregates
    obj.santri_mukim = 0;
    obj.santri_nonmukim = 0;
    for (let s = 1; s < santriValues.length; s++) {
      if (santriValues[s][1] === pId) {
        obj.santri_mukim = Number(santriValues[s][6]) || 0;
        obj.santri_nonmukim = Number(santriValues[s][9]) || 0;
        break;
      }
    }

    // Join Badan Usaha
    obj.badan_usaha = [];
    for (let b = 1; b < devValues.length; b++) {
      if (devValues[b][1] === pId) {
        obj.badan_usaha.push({
          nama_usaha: devValues[b][2],
          bentuk_usaha: devValues[b][3] || 'koperasi',
          bidang_usaha: devValues[b][4] || '',
          status_usaha: devValues[b][5] || 'active',
          omset_tahunan: devValues[b][6] || '',
          deskripsi: devValues[b][7] || ''
        });
      }
    }

    // Fallback display helpers
    if (!obj.pengasuh_utama) obj.pengasuh_utama = 'Pengasuh Pesantren';
    if (obj.jenjang_pendidikan.length === 0) obj.jenjang_pendidikan = ['Salafiyah'];

    list.push(obj);
  }

  return { success: true, total: list.length, data: list };
}


// =========================================================================
// SEED INITIAL MASTER DATA (STANDAR DIGDAYA PESANTREN PBNU & RMI DEMAK)
// =========================================================================
const INITIAL_PESANTREN_SEEDS = [
  {
    "id": "c1f7b820-9f2d-4e9b-b0b2-7d8b5a1b3c9e",
    "kode_pesantren": "RMI-DMK-000001",
    "nama_resmi": "Pondok Pesantren Fathul Huda",
    "nama_populer": "PP Fathul Huda Sayung",
    "kecamatan": "Sayung",
    "desa": "Sidorejo",
    "alamat": "Jl. Raya Semarang-Demak KM 14, Sidorejo",
    "pengasuh_utama": "K.H. Zainal Arifin Ma'shum",
    "tahun_berdiri": 1978,
    "status_operasional": "active",
    "status_keanggotaan_rmi": "member",
    "status_verifikasi": "verified",
    "status_verifikasi_lokasi": "verified",
    "status_publikasi": "published",
    "has_komitmen_pesantren_aman": true,
    "latitude": -6.9189,
    "longitude": 110.5218,
    "santri_mukim": 850,
    "santri_nonmukim": 320,
    "nspp": "510033210001",
    "jenjang_pendidikan": [
      "Madrasah Diniyah",
      "Formal (MTs/MA)",
      "Tahfidz"
    ],
    "potensi_kebutuhan": "Inkubasi Koperasi Pesantren & Sanitasi Asrama Putri",
    "media_sosial": {
      "website": "https://fathulhuda.sch.id",
      "youtube": "https://youtube.com/@fathulhuda_official",
      "instagram": "https://instagram.com/pp_fathulhuda",
      "tiktok": "https://tiktok.com/@fathulhuda_demak",
      "hotline_psb": "081234567890"
    },
    "dewan_asatidz": [
      {
        "nama": "K.H. Zainal Arifin Ma'shum",
        "jabatan": "Khadimul Ma'had / Pengasuh Utama",
        "kategori": "ustadz",
        "spesialisasi": "Fiqih & Ushul Fiqih",
        "pendidikan": "Pondok Pesantren Sarang"
      },
      {
        "nama": "Nyai Hj. Masruroh Zainal",
        "jabatan": "Pengasuh Asrama Putri",
        "kategori": "ustadzah",
        "spesialisasi": "Tahfidz & Akhlaq",
        "pendidikan": "PP Al-Muayyad Solo"
      },
      {
        "nama": "Gus M. Aniq, M.Pd",
        "jabatan": "Kepala Madrasah Diniyah",
        "kategori": "ustadz",
        "spesialisasi": "Kajian Nahwu Sharaf",
        "pendidikan": "UIN Walisongo Semarang (S2)"
      },
      {
        "nama": "Ustadzah Siti Aminah, S.Ag",
        "jabatan": "Pengajar Marhalah Wustho",
        "kategori": "ustadzah",
        "spesialisasi": "Tafsir Al-Ibriz",
        "pendidikan": "IIQ Jakarta (S1)"
      }
    ],
    "kurikulum_kitab": [
      {
        "marhalah": "ula",
        "nama_kitab": "Safinatun Najah",
        "pengarang": "Salim bin Samir al-Hadhrami",
        "bidang_ilmu": "Fiqih Dasar"
      },
      {
        "marhalah": "ula",
        "nama_kitab": "Al-Jurumiyah",
        "pengarang": "Abu Abdillah bin Dawud Ash-Shanhaji",
        "bidang_ilmu": "Tata Bahasa / Nahwu"
      },
      {
        "marhalah": "ula",
        "nama_kitab": "Aqidatul Awam",
        "pengarang": "Ahmad al-Marzuqi al-Maliki",
        "bidang_ilmu": "Aqidah & Tauhid"
      },
      {
        "marhalah": "wustho",
        "nama_kitab": "Fathul Qorib Al-Mujib",
        "pengarang": "Muhammad bin Qasim al-Ghazi",
        "bidang_ilmu": "Fiqih Lanjutan"
      },
      {
        "marhalah": "wustho",
        "nama_kitab": "Imrithi",
        "pengarang": "Syarafuddin Yahya Al-Imrithi",
        "bidang_ilmu": "Kaidah Bahasa Arab"
      },
      {
        "marhalah": "wustho",
        "nama_kitab": "Kifayatul Atqiya",
        "pengarang": "Sayyid Bakri Syatha Ad-Dimyathi",
        "bidang_ilmu": "Tasawuf / Akhlaq"
      },
      {
        "marhalah": "ulya",
        "nama_kitab": "Fathul Wahhab",
        "pengarang": "Zakariya al-Anshari",
        "bidang_ilmu": "Perbandingan Madzhab Fiqih"
      },
      {
        "marhalah": "ulya",
        "nama_kitab": "Alfiyah Ibnu Malik",
        "pengarang": "Ibnu Malik",
        "bidang_ilmu": "Linguistik Arab Komprehensif"
      },
      {
        "marhalah": "ulya",
        "nama_kitab": "Ihya Ulumiddin",
        "pengarang": "Hujjatul Islam Imam Al-Ghazali",
        "bidang_ilmu": "Tasawuf Mendalam"
      }
    ],
    "badan_usaha": [
      {
        "nama_usaha": "Kopontren Fathul Huda Barokah",
        "bentuk_usaha": "koperasi",
        "bidang_usaha": "Ritel Santri, Kantin & Sembako",
        "status_usaha": "active",
        "omset_tahunan": "Rp 180.000.000",
        "deskripsi": "Penyedia kebutuhan primer santri berasrama dan warga sekitar pesantren."
      },
      {
        "nama_usaha": "Konveksi & Sablon Busana Muslim",
        "bentuk_usaha": "unit_internal",
        "bidang_usaha": "Industri Pakaian & Sarung",
        "status_usaha": "active",
        "omset_tahunan": "Rp 65.000.000",
        "deskripsi": "Produksi seragam madrasah, kaos event halaqah, dan busana muslim santri."
      }
    ]
  },
  {
    "id": "a2e8c930-1b3d-4f1a-a0a1-6c7b4a2b1d8f",
    "kode_pesantren": "RMI-DMK-000002",
    "nama_resmi": "Pondok Pesantren Futuhiyyah",
    "nama_populer": "PP Futuhiyyah Suburan",
    "kecamatan": "Mranggen",
    "desa": "Suburan",
    "alamat": "Jl. Suburan Raya No. 1, Mranggen",
    "pengasuh_utama": "K.H. Sa'id Abdurrohim",
    "tahun_berdiri": 1901,
    "status_operasional": "active",
    "status_keanggotaan_rmi": "member",
    "status_verifikasi": "verified",
    "status_verifikasi_lokasi": "verified",
    "status_publikasi": "published",
    "has_komitmen_pesantren_aman": true,
    "latitude": -7.0274,
    "longitude": 110.5188,
    "santri_mukim": 3200,
    "santri_nonmukim": 1100,
    "nspp": "510033210002",
    "jenjang_pendidikan": [
      "Salafiyah Wathoniyah",
      "Madin Ulya",
      "Formal (SMP/SMA/SMK)"
    ],
    "potensi_kebutuhan": "Pengembangan Balai Latihan Kerja Komunitas",
    "media_sosial": {
      "website": "https://futuhiyyah.org",
      "youtube": "https://youtube.com/@futuhiyyahsuburan",
      "instagram": "https://instagram.com/futuhiyyah_official",
      "tiktok": "https://tiktok.com/@futuhiyyah.demak",
      "hotline_psb": "081122334455"
    },
    "dewan_asatidz": [
      {
        "nama": "K.H. Sa'id Abdurrohim",
        "jabatan": "Pengasuh Utama",
        "kategori": "ustadz",
        "spesialisasi": "Hadits & Fiqih Syafi'i",
        "pendidikan": "Haramain Makkah / Futuhiyyah"
      },
      {
        "nama": "K.H. Faiz Sa'id",
        "jabatan": "Majelis Pengasuh",
        "kategori": "ustadz",
        "spesialisasi": "Ushul Fiqih & Balaghah",
        "pendidikan": "Al-Azhar Kairo (Lc.)"
      },
      {
        "nama": "Nyai Hj. Fatimah",
        "jabatan": "Pengasuh Komplek Putri An-Nur",
        "kategori": "ustadzah",
        "spesialisasi": "Akhlaq Lil Banat",
        "pendidikan": "PP Futuhiyyah Putri"
      }
    ],
    "kurikulum_kitab": [
      {
        "marhalah": "ula",
        "nama_kitab": "Fathul Qorib",
        "pengarang": "Ibnu Qasim al-Ghazi",
        "bidang_ilmu": "Fiqih"
      },
      {
        "marhalah": "ula",
        "nama_kitab": "Matan Al-Jurumiyah",
        "pengarang": "Ibnu Ajurrum",
        "bidang_ilmu": "Nahwu"
      },
      {
        "marhalah": "wustho",
        "nama_kitab": "Fathul Mu'in",
        "pengarang": "Zainuddin Al-Malibari",
        "bidang_ilmu": "Fiqih"
      },
      {
        "marhalah": "wustho",
        "nama_kitab": "Kawakibud Durriyyah",
        "pengarang": "Muhammad al-Ahdal",
        "bidang_ilmu": "Kaidah Bahasa Arab"
      },
      {
        "marhalah": "ulya",
        "nama_kitab": "Shohih Al-Bukhari",
        "pengarang": "Imam Bukhari",
        "bidang_ilmu": "Hadits"
      },
      {
        "marhalah": "ulya",
        "nama_kitab": "Jam'ul Jawami'",
        "pengarang": "Tajuddin As-Subki",
        "bidang_ilmu": "Ushul Fiqih"
      }
    ],
    "badan_usaha": [
      {
        "nama_usaha": "BMT Futuhiyyah",
        "bentuk_usaha": "koperasi",
        "bidang_usaha": "Lembaga Keuangan Mikro Syariah",
        "status_usaha": "active",
        "omset_tahunan": "Rp 1.200.000.000",
        "deskripsi": "Pemberdayaan ekonomi umat, tabungan haji, dan permodalan UMKM jamaah."
      },
      {
        "nama_usaha": "Futuhiyyah Printing & Grafika",
        "bentuk_usaha": "pt_cv",
        "bidang_usaha": "Percetakan Kitab & Offset",
        "status_usaha": "active",
        "omset_tahunan": "Rp 350.000.000",
        "deskripsi": "Mencetak risalah pengajian, majalah santri, dan administrasi pesantren."
      }
    ]
  },
  {
    "id": "d3f9d040-2c4e-5a2b-b1b2-7d8c5b3c2e9a",
    "kode_pesantren": "RMI-DMK-000003",
    "nama_resmi": "Pondok Pesantren Girikusumo",
    "nama_populer": "PP Girikusumo Banyumeneng",
    "kecamatan": "Mranggen",
    "desa": "Banyumeneng",
    "alamat": "Dusun Girikusumo, Banyumeneng",
    "pengasuh_utama": "K.H. Munif Muhammad Zuhri",
    "tahun_berdiri": 1868,
    "status_operasional": "active",
    "status_keanggotaan_rmi": "member",
    "status_verifikasi": "verified",
    "status_verifikasi_lokasi": "verified",
    "status_publikasi": "published",
    "has_komitmen_pesantren_aman": true,
    "latitude": -7.0589,
    "longitude": 110.5412,
    "santri_mukim": 1400,
    "santri_nonmukim": 600,
    "nspp": "510033210003",
    "jenjang_pendidikan": [
      "Thariqah Naqsyabandiyah",
      "Kajian Turots",
      "Madrasah Diniyah"
    ],
    "potensi_kebutuhan": "Konservasi Naskah Kitab Kuno & Pusat Halaqah",
    "media_sosial": {
      "website": "https://girikusumo.id",
      "youtube": "https://youtube.com/@girikusumo_channel",
      "instagram": "https://instagram.com/girikusumo_heritage",
      "tiktok": "",
      "hotline_psb": "081399887766"
    },
    "dewan_asatidz": [
      {
        "nama": "K.H. Munif Muhammad Zuhri",
        "jabatan": "Mursyid Thariqah & Pengasuh",
        "kategori": "ustadz",
        "spesialisasi": "Tasawuf & Thariqah",
        "pendidikan": "Tradisi Sanad Girikusumo"
      },
      {
        "nama": "Gus Hanif Zuhri",
        "jabatan": "Badan Pelaksana Pengajian",
        "kategori": "ustadz",
        "spesialisasi": "Kajian Kitab Kuning",
        "pendidikan": "Pondok Pesantren Lirboyo"
      }
    ],
    "kurikulum_kitab": [
      {
        "marhalah": "ula",
        "nama_kitab": "Sullamut Taufiq",
        "pengarang": "Abdullah bin Husain bin Thahir",
        "bidang_ilmu": "Fiqih & Tasawuf"
      },
      {
        "marhalah": "wustho",
        "nama_kitab": "Al-Hikam",
        "pengarang": "Ibnu Athaillah As-Sakandari",
        "bidang_ilmu": "Tasawuf Salaf"
      },
      {
        "marhalah": "ulya",
        "nama_kitab": "Tanwirul Qulub",
        "pengarang": "Muhammad Amin Al-Kurdi",
        "bidang_ilmu": "Thariqah wa Suluk"
      }
    ],
    "badan_usaha": [
      {
        "nama_usaha": "Kebun Pembibitan Herbal & Agro Giri",
        "bentuk_usaha": "unit_internal",
        "bidang_usaha": "Pertanian & Tanaman Obat",
        "status_usaha": "active",
        "omset_tahunan": "Rp 45.000.000",
        "deskripsi": "Pemberdayaan kemandirian santri melalui budidaya tanaman obat tradisional."
      }
    ]
  },
  {
    "id": "7d8e9f10-4a5b-6c7d-8e9f-0a1b2c3d4e5f",
    "kode_pesantren": "RMI-DMK-000007",
    "nama_resmi": "Pondok Pesantren Asnawiyyah",
    "nama_populer": "PP Asnawiyyah Pilang Kebonagung",
    "kecamatan": "Kebonagung",
    "desa": "Pilang",
    "alamat": "Dusun Pilang RT 02 RW 04, Kebonagung",
    "pengasuh_utama": "K.H. Asnawi Cholil",
    "tahun_berdiri": 1996,
    "status_operasional": "active",
    "status_keanggotaan_rmi": "member",
    "status_verifikasi": "verified",
    "status_verifikasi_lokasi": "verified",
    "status_publikasi": "published",
    "has_komitmen_pesantren_aman": true,
    "latitude": -6.9856,
    "longitude": 110.6723,
    "santri_mukim": 380,
    "santri_nonmukim": 140,
    "nspp": "510033210007",
    "jenjang_pendidikan": [
      "Salafiyah",
      "Madrasah Diniyah Ula-Wustho",
      "Tahfidzul Quran"
    ],
    "potensi_kebutuhan": "Digitalisasi Pembelajaran Kitab & Budidaya Perikanan Santri",
    "media_sosial": {
      "website": "https://pesantren.nu.id/pesantren/asnawiyyah-2",
      "youtube": "https://youtube.com/@asnawiyyah_demak",
      "instagram": "https://instagram.com/pp_asnawiyyah_kebonagung",
      "tiktok": "https://tiktok.com/@santriasnawiyyah",
      "hotline_psb": "085211223344"
    },
    "dewan_asatidz": [
      {
        "nama": "K.H. Asnawi Cholil",
        "jabatan": "Khadimul Ma'had",
        "kategori": "ustadz",
        "spesialisasi": "Kajian Fiqih & Falak",
        "pendidikan": "PP Futuhiyyah Mranggen"
      },
      {
        "nama": "Nyai Hj. Siti Rohmah",
        "jabatan": "Pengasuh Santri Putri",
        "kategori": "ustadzah",
        "spesialisasi": "Tahfidz & Tajwid Al-Quran",
        "pendidikan": "PP Yanbu'ul Quran Kudus"
      },
      {
        "nama": "Ustadz M. Shofi, S.Pd.I",
        "jabatan": "Lurah Pondok & Pengajar",
        "kategori": "ustadz",
        "spesialisasi": "Nahwu Shorof & I'rab",
        "pendidikan": "STAIS Demak (S1)"
      },
      {
        "nama": "Ustadzah Khairun Nisa",
        "jabatan": "Muhaffizhah Asrama Putri",
        "kategori": "ustadzah",
        "spesialisasi": "Tahsin wa Qiraat",
        "pendidikan": "Ma'had Tahfidz Kudus"
      }
    ],
    "kurikulum_kitab": [
      {
        "marhalah": "ula",
        "nama_kitab": "Mabadiul Fiqhiyyah Juz 1-4",
        "pengarang": "Umar Abdul Jabbar",
        "bidang_ilmu": "Fiqih Ibadah"
      },
      {
        "marhalah": "ula",
        "nama_kitab": "Hidayatus Shibyan",
        "pengarang": "Ahmad Sa'id An-Nabhani",
        "bidang_ilmu": "Tajwid Al-Quran"
      },
      {
        "marhalah": "ula",
        "nama_kitab": "Al-Amtsilah At-Tashrifiyyah",
        "pengarang": "K.H. Ma'shum bin Ali",
        "bidang_ilmu": "Shorof & Morfologi Arab"
      },
      {
        "marhalah": "wustho",
        "nama_kitab": "Fathul Qorib Al-Mujib",
        "pengarang": "Ibnu Qasim al-Ghazi",
        "bidang_ilmu": "Fiqih Muamalah & Ibadah"
      },
      {
        "marhalah": "wustho",
        "nama_kitab": "Tafsir Jalalain",
        "pengarang": "Jalaluddin Al-Mahalli & As-Suyuthi",
        "bidang_ilmu": "Tafsir Al-Quran"
      },
      {
        "marhalah": "wustho",
        "nama_kitab": "Ta'limul Muta'allim",
        "pengarang": "Burhanul Islam Az-Zarnuji",
        "bidang_ilmu": "Adab & Etika Penuntut Ilmu"
      },
      {
        "marhalah": "ulya",
        "nama_kitab": "Fathul Mu'in",
        "pengarang": "Ahmad Zainuddin Al-Malibari",
        "bidang_ilmu": "Fiqih Muamalah Mendalam"
      },
      {
        "marhalah": "ulya",
        "nama_kitab": "Bulughul Maram",
        "pengarang": "Ibnu Hajar Al-Asqalani",
        "bidang_ilmu": "Hadits Hukum"
      }
    ],
    "badan_usaha": [
      {
        "nama_usaha": "Toko Kitab & Kitab Kuning Asnawiyyah",
        "bentuk_usaha": "unit_internal",
        "bidang_usaha": "Penyedia Kitab & ATK Santri",
        "status_usaha": "active",
        "omset_tahunan": "Rp 36.000.000",
        "deskripsi": "Penyedia kebutuhan kitab rujukan pesantren dan perlengkapan pengajian santri."
      },
      {
        "nama_usaha": "Budidaya Ikan Nila & Lele Santri",
        "bentuk_usaha": "unit_internal",
        "bidang_usaha": "Agribisnis & Perikanan Air Tawar",
        "status_usaha": "active",
        "omset_tahunan": "Rp 24.000.000",
        "deskripsi": "Unit ketahanan pangan asrama dan sarana edukasi kewirausahaan santri."
      }
    ]
  },
  {
    "id": "e4a0e150-3d5f-6b3c-c2c3-8e9d6c4d3f0b",
    "kode_pesantren": "RMI-DMK-000004",
    "nama_resmi": "Pondok Pesantren Al-Hidayah",
    "nama_populer": "PP Al-Hidayah Karangtengah",
    "kecamatan": "Karangtengah",
    "desa": "Ploso",
    "alamat": "Jl. KH. Sholeh Darat No. 05, Ploso",
    "pengasuh_utama": "K. Ahmad Badhawi Ali",
    "tahun_berdiri": 1985,
    "status_operasional": "active",
    "status_keanggotaan_rmi": "member",
    "status_verifikasi": "under_review",
    "status_verifikasi_lokasi": "verified",
    "status_publikasi": "private",
    "has_komitmen_pesantren_aman": false,
    "latitude": -6.9147,
    "longitude": 110.6274,
    "santri_mukim": 420,
    "santri_nonmukim": 180,
    "nspp": "510033210004",
    "jenjang_pendidikan": [
      "Tahfidzul Quran",
      "Madin Wustho"
    ],
    "potensi_kebutuhan": "Bantuan Sarana Air Bersih & Sanitasi",
    "media_sosial": {
      "website": "",
      "youtube": "",
      "instagram": "https://instagram.com/alhidayah_ploso",
      "tiktok": "",
      "hotline_psb": "082133445566"
    },
    "dewan_asatidz": [
      {
        "nama": "K. Ahmad Badhawi Ali",
        "jabatan": "Pengasuh Utama",
        "kategori": "ustadz",
        "spesialisasi": "Ilmu Falak & Fiqih",
        "pendidikan": "PP Al-Anwar Sarang"
      },
      {
        "nama": "Ustadz M. Ridhwan",
        "jabatan": "Koordinator Tahfidz",
        "kategori": "ustadz",
        "spesialisasi": "Tahfidzul Quran 30 Juz",
        "pendidikan": "Kudus"
      }
    ],
    "kurikulum_kitab": [
      {
        "marhalah": "ula",
        "nama_kitab": "Aqidatul Awam",
        "pengarang": "Ahmad Al-Marzuqi",
        "bidang_ilmu": "Aqidah"
      },
      {
        "marhalah": "wustho",
        "nama_kitab": "Fathul Qorib",
        "pengarang": "Ibnu Qasim",
        "bidang_ilmu": "Fiqih"
      }
    ],
    "badan_usaha": []
  },
  {
    "id": "f5b1f260-4e6a-7c4d-d3d4-9f0e7d5e4a1c",
    "kode_pesantren": "RMI-DMK-000005",
    "nama_resmi": "Pondok Pesantren Nurul Huda",
    "nama_populer": "PP Nurul Huda Bintoro",
    "kecamatan": "Demak Kota",
    "desa": "Bintoro",
    "alamat": "Jl. Sultan Fatah Gang Kauman No. 22",
    "pengasuh_utama": "K.H. Ibrahim Cholilullah",
    "tahun_berdiri": 1992,
    "status_operasional": "active",
    "status_keanggotaan_rmi": "member",
    "status_verifikasi": "under_review",
    "status_verifikasi_lokasi": "under_review",
    "status_publikasi": "pending_approval",
    "has_komitmen_pesantren_aman": true,
    "latitude": -6.8944,
    "longitude": 110.6386,
    "santri_mukim": 310,
    "santri_nonmukim": 95,
    "nspp": "510033210005",
    "jenjang_pendidikan": [
      "Kajian Fiqih",
      "Madin Ula & Wustho"
    ],
    "potensi_kebutuhan": "Laboratorium Komputer & Bahasa",
    "media_sosial": {
      "website": "",
      "youtube": "https://youtube.com/@nurulhudabintoro",
      "instagram": "https://instagram.com/nurulhuda_bintoro",
      "tiktok": "",
      "hotline_psb": "087788990011"
    },
    "dewan_asatidz": [
      {
        "nama": "K.H. Ibrahim Cholilullah",
        "jabatan": "Pengasuh",
        "kategori": "ustadz",
        "spesialisasi": "Tafsir & Hadits",
        "pendidikan": "PP Tebuireng Jombang"
      }
    ],
    "kurikulum_kitab": [
      {
        "marhalah": "ula",
        "nama_kitab": "Safinatun Najah",
        "pengarang": "Salim bin Samir",
        "bidang_ilmu": "Fiqih"
      },
      {
        "marhalah": "wustho",
        "nama_kitab": "Riyadhus Shalihin",
        "pengarang": "Imam An-Nawawi",
        "bidang_ilmu": "Hadits Nabawi"
      }
    ],
    "badan_usaha": [
      {
        "nama_usaha": "Kantin Kejujuran Santri",
        "bentuk_usaha": "unit_internal",
        "bidang_usaha": "Kantin & Konsumsi",
        "status_usaha": "active",
        "omset_tahunan": "Rp 15.000.000",
        "deskripsi": "Penyedia jajanan sehat dan sarapan santri."
      }
    ]
  },
  {
    "id": "b6c2a370-5f7b-8d5e-e4e5-0a1f8e6f5b2d",
    "kode_pesantren": "RMI-DMK-000006",
    "nama_resmi": "Pondok Pesantren Raudlatul Muta'allimin",
    "nama_populer": "PP Babat Wedung",
    "kecamatan": "Wedung",
    "desa": "Babat",
    "alamat": "Dusun Babat Lor RT 03/01, Wedung",
    "pengasuh_utama": "K.H. Shodiq Hamzah",
    "tahun_berdiri": 2004,
    "status_operasional": "active",
    "status_keanggotaan_rmi": "member",
    "status_verifikasi": "revision_required",
    "status_verifikasi_lokasi": "needs_correction",
    "status_publikasi": "private",
    "has_komitmen_pesantren_aman": false,
    "latitude": -6.7824,
    "longitude": 110.5614,
    "santri_mukim": 210,
    "santri_nonmukim": 80,
    "nspp": "",
    "jenjang_pendidikan": [
      "Salafiyah",
      "Tahfidz"
    ],
    "potensi_kebutuhan": "Percepatan Penerbitan Izin Operasional Kemenag",
    "media_sosial": {
      "website": "",
      "youtube": "",
      "instagram": "",
      "tiktok": "",
      "hotline_psb": ""
    },
    "dewan_asatidz": [
      {
        "nama": "K.H. Shodiq Hamzah",
        "jabatan": "Pengasuh",
        "kategori": "ustadz",
        "spesialisasi": "Qiraat Sab'ah",
        "pendidikan": "Kudus"
      }
    ],
    "kurikulum_kitab": [
      {
        "marhalah": "ula",
        "nama_kitab": "Yanbu'a",
        "pengarang": "K.H. M. Arwani Amin Kudus",
        "bidang_ilmu": "Tahsin Tartil Al-Quran"
      }
    ],
    "badan_usaha": []
  }
];

function seedInitialData() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheetPesantren = ss.getSheetByName('pesantren');
  if (!sheetPesantren) {
    setupSpreadsheetMasterDatabase();
  }
  
  // Jika sudah ada data lebih dari header, jangan duplikasi
  if (sheetPesantren.getLastRow() > 1) {
    return {
      success: true,
      alreadySeeded: true,
      message: 'Database Spreadsheet sudah memiliki ' + (sheetPesantren.getLastRow() - 1) + ' data pesantren. Seeding dilewati untuk mencegah duplikasi.'
    };
  }

  const sheetLoc = ss.getSheetByName('pesantren_locations');
  const sheetLeaders = ss.getSheetByName('pesantren_leaders');
  const sheetContacts = ss.getSheetByName('pesantren_contacts');
  const sheetEdu = ss.getSheetByName('pesantren_education');
  const sheetSantri = ss.getSheetByName('pesantren_santri_aggregates');
  const sheetDev = ss.getSheetByName('pesantren_development_profiles');
  const sheetLogs = ss.getSheetByName('audit_logs');
  
  const now = new Date().toISOString();
  let count = 0;

  INITIAL_PESANTREN_SEEDS.forEach((p, idx) => {
    count++;
    const pId = p.id || Utilities.getUuid();
    
    // 1. Tab pesantren
    sheetPesantren.appendRow([
      pId,
      p.kode_pesantren,
      p.nama_resmi,
      p.nama_populer || '',
      p.nspp || '',
      p.tahun_berdiri || '',
      p.status_operasional || 'active',
      p.status_keanggotaan_rmi || 'member',
      p.status_verifikasi || 'verified',
      p.status_verifikasi_lokasi || 'verified',
      p.status_publikasi || 'published',
      p.has_komitmen_pesantren_aman ? true : false,
      'survei_lapangan_rmi',
      p.potensi_kebutuhan || '',
      now, now, 'Super Admin', 'Super Admin'
    ]);

    // 2. Tab pesantren_locations
    sheetLoc.appendRow([
      Utilities.getUuid(),
      pId,
      p.alamat || '',
      '', '', '',
      p.desa || '',
      p.kecamatan || '',
      CONFIG.KABUPATEN,
      CONFIG.PROVINSI,
      '',
      p.latitude || -6.8944,
      p.longitude || 110.6386,
      10,
      'geocoding_terverifikasi',
      'Akses jalan aspal/beton',
      true, now, now
    ]);

    // 3. Tab pesantren_leaders (Dewan Asatidz)
    if (p.dewan_asatidz && p.dewan_asatidz.length > 0) {
      p.dewan_asatidz.forEach((u, uIdx) => {
        sheetLeaders.appendRow([
          Utilities.getUuid(),
          pId,
          u.nama,
          '', '',
          u.jabatan || 'Pengajar',
          u.kategori || 'ustadz',
          u.spesialisasi || 'Kitab Kuning',
          u.pendidikan || 'Pesantren',
          uIdx + 1,
          true,
          uIdx === 0,
          now, now
        ]);
      });
    } else if (p.pengasuh_utama) {
      sheetLeaders.appendRow([
        Utilities.getUuid(),
        pId,
        p.pengasuh_utama,
        '', '',
        'Pengasuh Utama',
        'ustadz',
        'Kajian Turots',
        'Pesantren Salaf',
        1, true, true, now, now
      ]);
    }

    // 4. Tab pesantren_contacts
    const soc = p.media_sosial || {};
    if (soc.hotline_psb) sheetContacts.appendRow([Utilities.getUuid(), pId, 'hotline_psb', soc.hotline_psb, 'WhatsApp PSB', true, true, now, now]);
    if (soc.youtube) sheetContacts.appendRow([Utilities.getUuid(), pId, 'youtube', soc.youtube, 'Kanal YouTube', false, true, now, now]);
    if (soc.instagram) sheetContacts.appendRow([Utilities.getUuid(), pId, 'instagram', soc.instagram, 'Akun Instagram', false, true, now, now]);
    if (soc.website) sheetContacts.appendRow([Utilities.getUuid(), pId, 'website', soc.website, 'Situs Web Resmi', false, true, now, now]);

    // 5. Tab pesantren_education (Kurikulum Kitab Turots Marhalah)
    if (p.kurikulum_kitab && p.kurikulum_kitab.length > 0) {
      p.kurikulum_kitab.forEach(k => {
        sheetEdu.appendRow([
          Utilities.getUuid(),
          pId,
          'salafiyah',
          'Madrasah Diniyah Takmiliyah',
          k.marhalah || 'ula',
          k.nama_kitab,
          k.pengarang,
          k.bidang_ilmu,
          '', 'A', '2024', true, now, now
        ]);
      });
    }

    // 6. Tab pesantren_santri_aggregates
    const sm = p.santri_mukim || 0;
    const snm = p.santri_nonmukim || 0;
    sheetSantri.appendRow([
      Utilities.getUuid(),
      pId,
      '2025/2026',
      'Genap',
      Math.round(sm * 0.55),
      Math.round(sm * 0.45),
      sm,
      Math.round(snm * 0.5),
      Math.round(snm * 0.5),
      snm,
      sm + snm,
      'sensus_institusi_tahunan',
      'terverifikasi',
      now, now
    ]);

    // 7. Tab pesantren_development_profiles (Badan Usaha)
    if (p.badan_usaha && p.badan_usaha.length > 0) {
      p.badan_usaha.forEach(b => {
        sheetDev.appendRow([
          Utilities.getUuid(),
          pId,
          b.nama_usaha,
          b.bentuk_usaha || 'koperasi',
          b.bidang_usaha || 'Perdagangan & Jasa',
          b.status_usaha || 'active',
          b.omset_tahunan || 'Rp 0',
          b.deskripsi || p.potensi_kebutuhan || '',
          p.potensi_kebutuhan || '',
          'Inkubasi Koperasi & Rantai Pasok',
          'Tercatat dalam sistem master RMI Demak',
          now, now
        ]);
      });
    }
  });

  // Catat ke Audit Log
  recordAuditLog(ss, {
    user_id: 'System Seeder',
    user_role: 'super_admin',
    event_type: 'MIGRATE_SEED_DATA',
    entity_type: 'pesantren',
    entity_id: 'ALL_MASTER',
    action_description: 'Berhasil melakukan migrasi awal ' + count + ' data pesantren master ke Google Sheets.',
    status: 'SUCCESS'
  });

  return {
    success: true,
    totalSeeded: count,
    message: 'Berhasil memigrasikan ' + count + ' data pesantren master ke Google Spreadsheet.'
  };
}

