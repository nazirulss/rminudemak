/**
 * =========================================================================
 * PESANTREN DATA CENTER - RMI PCNU KABUPATEN DEMAK
 * BACKEND GOOGLE APPS SCRIPT (Web App API + Spreadsheet + Drive Integration)
 * Versi: 1.1 (Standar Digdaya Pesantren PBNU & Database Dictionary v1.1)
 * =========================================================================
 */

// 1. KONFIGURASI GLOBAL
const CONFIG = {
  SPREADSHEET_ID: '1wd8wy229F4OVywQZvnSPSv9Ckyo1qlIusjJ4joKN0sE',
  DRIVE_FOLDER_ID: '1SX3ktAHQsfKUIgf7lTZiAQybPGkM2Aq9',
  LOCK_TIMEOUT_MS: 30000,
  KABUPATEN: 'Demak',
  PROVINSI: 'Jawa Tengah'
};

// 2. DEFINISI 14 TAB SESUAI DATABASE DICTIONARY v1.1
const SCHEMAS = {
  pesantren: [
    'id', 'kode_pesantren', 'nama_resmi', 'nama_populer', 'nspp', 'tahun_berdiri',
    'status_operasional', 'status_keanggotaan_rmi', 'status_verifikasi',
    'status_verifikasi_lokasi', 'status_publikasi', 'has_komitmen_pesantren_aman',
    'sumber_data_awal', 'keterangan_status', 'created_at', 'updated_at', 'created_by', 'updated_by'
  ],
  pesantren_locations: [
    'id', 'pesantren_id', 'alamat_jalan', 'rt', 'rw', 'dusun', 'desa_kelurahan',
    'kecamatan', 'kabupaten_kota', 'provinsi', 'kode_pos', 'latitude', 'longitude',
    'akurasi_geocoding_meter', 'metode_penentuan_titik', 'catatan_akses_jalan',
    'is_primary', 'created_at', 'updated_at'
  ],
  pesantren_leaders: [
    'id', 'pesantren_id', 'nama_lengkap', 'gelar_depan', 'gelar_belakang',
    'jabatan', 'kategori_pengajar', 'spesialisasi_keilmuan', 'pendidikan_terakhir',
    'urutan_prioritas', 'status_aktif', 'is_primary', 'created_at', 'updated_at'
  ],
  pesantren_contacts: [
    'id', 'pesantren_id', 'jenis_kontak', 'nilai_kontak', 'label_tujuan',
    'is_primary', 'is_verified', 'created_at', 'updated_at'
  ],
  pesantren_legalities: [
    'id', 'pesantren_id', 'jenis_dokumen', 'nomor_dokumen', 'nama_lembaga_penerbit',
    'tanggal_terbit', 'tanggal_kedaluwarsa', 'status_validitas', 'file_drive_id',
    'file_drive_url', 'catatan_verifikasi', 'created_at', 'updated_at'
  ],
  pesantren_education: [
    'id', 'pesantren_id', 'jalur_pendidikan', 'nama_satuan_pendidikan',
    'marhalah', 'nama_kitab', 'pengarang_kitab', 'bidang_ilmu',
    'nomor_statistik_satuan', 'status_akreditasi', 'tahun_akreditasi',
    'is_aktif', 'created_at', 'updated_at'
  ],
  pesantren_santri_aggregates: [
    'id', 'pesantren_id', 'tahun_ajaran', 'semester', 'santri_mukim_putra',
    'santri_mukim_putri', 'total_santri_mukim', 'santri_nonmukim_putra',
    'santri_nonmukim_putri', 'total_santri_nonmukim', 'grand_total_santri',
    'metode_pendataan', 'status_validasi_agregat', 'created_at', 'updated_at'
  ],
  pesantren_staff_aggregates: [
    'id', 'pesantren_id', 'tahun_ajaran', 'guru_ustadz_putra', 'guru_ustadzah_putri',
    'total_guru', 'tenaga_kependidikan_putra', 'tenaga_kependidikan_putri',
    'total_tenaga_kependidikan', 'grand_total_sdm', 'created_at', 'updated_at'
  ],
  pesantren_facilities: [
    'id', 'pesantren_id', 'kategori_fasilitas', 'nama_fasilitas', 'kondisi',
    'luas_m2', 'keterangan', 'created_at', 'updated_at'
  ],
  pesantren_flagship_programs: [
    'id', 'pesantren_id', 'nama_program', 'bidang_program', 'deskripsi',
    'prestasi_terkait', 'is_active', 'created_at', 'updated_at'
  ],
  pesantren_development_profiles: [
    'id', 'pesantren_id', 'nama_usaha', 'bentuk_usaha', 'bidang_usaha',
    'status_usaha', 'omset_tahunan', 'potensi_pengembangan_utama',
    'kebutuhan_intervensi_prioritas', 'rencana_kemandirian_ekonomi',
    'catatan_pendamping', 'created_at', 'updated_at'
  ],
  verification_reviews: [
    'id', 'pesantren_id', 'tahap_verifikasi', 'status_keputusan', 'catatan_reviewer',
    'daftar_temuan_masalah', 'rekomendasi_tindakan', 'target_perbaikan_tanggal',
    'reviewer_user_id', 'reviewed_at'
  ],
  audit_logs: [
    'id', 'user_id', 'user_role', 'event_type', 'entity_type', 'entity_id',
    'action_description', 'status', 'error_message', 'ip_address', 'timestamp'
  ],
  app_users: [
    'id', 'email', 'nama_lengkap', 'phone', 'role', 'scope_wilayah', 'is_active',
    'last_login', 'created_at', 'updated_at'
  ],
  app_roles: [
    'id', 'role_key', 'role_name', 'level', 'description', 'badge_color', 'is_active',
    'created_at', 'updated_at'
  ],
  rbac_permissions: [
    'id', 'module_key', 'module_name', 'role_key', 'permission_level', 'can_create',
    'can_read', 'can_update', 'can_delete', 'can_verify', 'updated_by', 'updated_at'
  ],
  web_config: [
    'key', 'category', 'value', 'updated_at', 'updated_by'
  ],
  pimpinan_sambutan: [
    'id', 'jabatan', 'nama', 'gelar_depan', 'gelar_belakang', 'foto_drive_url', 'file_drive_id', 'kutipan_sambutan', 'urutan', 'is_active', 'updated_at'
  ],
  web_news: [
    'id', 'judul', 'slug', 'kategori', 'ringkasan', 'isi_lengkap', 'cover_image_url', 'penulis', 'is_featured', 'status', 'published_at', 'views_count', 'updated_at'
  ]
};

// =========================================================================
// 3. FUNGSI INISIALISASI OTOMATIS: SETUP SEMUA SHEET & HEADER
// =========================================================================
function setupSpreadsheetMasterDatabase() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  for (const sheetName in SCHEMAS) {
    let sheet = ss.getSheetByName(sheetName);
    const headers = SCHEMAS[sheetName];
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // Set headers jika baris 1 masih kosong
    if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#005c55').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    } else {
      // Periksa kecocokan header
      const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      if (existingHeaders.length < headers.length) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#005c55').setFontColor('#ffffff');
        sheet.setFrozenRows(1);
      }
    }
  }
  
  // Hapus Sheet1 bawaan kosong jika ada sheet lain
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }
  
  return { success: true, message: '14 Tab Database Master berhasil diinisialisasi.' };
}

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
// 5. HELPER UPLOAD FILE KE GOOGLE DRIVE
// =========================================================================
function uploadBase64FileToDrive(fileObj, subfolderName) {
  if (!fileObj || !fileObj.base64 || !fileObj.filename) return null;
  
  try {
    const rootFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    let targetFolder = rootFolder;
    
    if (subfolderName) {
      const subFolders = rootFolder.getFoldersByName(subfolderName);
      if (subFolders.hasNext()) {
        targetFolder = subFolders.next();
      } else {
        targetFolder = rootFolder.createFolder(subfolderName);
      }
    }
    
    const bytes = Utilities.base64Decode(fileObj.base64);
    const blob = Utilities.newBlob(bytes, fileObj.mimeType || 'application/octet-stream', fileObj.filename);
    const uploadedFile = targetFolder.createFile(blob);
    uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return {
      fileId: uploadedFile.getId(),
      url: uploadedFile.getUrl(),
      filename: fileObj.filename
    };
  } catch (err) {
    Logger.log('Gagal upload file ke Drive: ' + err.message);
    return null;
  }
}

// =========================================================================
// 6. CONTROLLER API (doGet & doPost)
// =========================================================================
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'HEALTH_CHECK';
  
  if (action === 'SETUP_WEB_CMS_SHEETS' || action === 'SETUP_CMS') {
    const res = setupWebCmsSheets();
    return createJsonResponse(res);
  }

  if (action === 'SETUP_DATABASE') {
    const res = setupSpreadsheetMasterDatabase();
    return createJsonResponse(res);
  }

  if (action === 'SEED_INITIAL_DATA') {
    const res = seedInitialData();
    return createJsonResponse(res);
  }
  
  if (action === 'GET_ALL_PESANTREN') {
    const res = getAllPesantrenData();
    return createJsonResponse(res);
  }

  if (action === 'GET_ALL_USERS') {
    const res = getAllUsersData();
    return createJsonResponse(res);
  }

  if (action === 'GET_ALL_ROLES') {
    const res = getAllRolesData();
    return createJsonResponse(res);
  }

  if (action === 'GET_RBAC_MATRIX') {
    const res = getRBACMatrixData();
    return createJsonResponse(res);
  }
  
  return createJsonResponse({
    status: 'ONLINE',
    version: '1.1',
    system: 'Pesantren Data Center RMI NU Kabupaten Demak',
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const hasLock = lock.tryLock(CONFIG.LOCK_TIMEOUT_MS);
    if (!hasLock) {
      return createJsonResponse({ success: false, error: 'Server sibuk, transaksi terkunci oleh antrean lain.' });
    }
    
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
    
    const action = payload.action || 'UNKNOWN';
    let result = { success: false, message: 'Action tidak dikenal' };
    
    if (action === 'CREATE_PESANTREN') {
      result = handleCreatePesantren(payload, lock);
    } else if (action === 'UPDATE_VERIFIKASI') {
      result = handleUpdateVerifikasi(payload);
    } else if (action === 'UPDATE_PESANTREN_PROFILE') {
      result = handleUpdatePesantrenProfile(payload);
    } else if (action === 'LOG_AUDIT') {
      result = handleLogAudit(payload);
    } else if (action === 'SAVE_USER') {
      result = handleSaveUserBackend(payload);
    } else if (action === 'DELETE_USER') {
      result = handleDeleteUserBackend(payload);
    } else if (action === 'UPDATE_RBAC_PERMISSION') {
      result = handleUpdateRBACPermission(payload);
    } else if (action === 'MIGRATE_ASSETS_TO_DRIVE' || action === 'UPLOAD_ASSET') {
      result = handleMigrateAssetsToDrive(payload);
    }
    
    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message, stack: err.stack });
  } finally {
    lock.releaseLock();
  }
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
  if (files.izop) izopDrive = uploadBase64FileToDrive(files.izop, 'Legalitas_IZOP');
  if (files.foto) fotoDrive = uploadBase64FileToDrive(files.foto, 'Foto_Lokasi');
  
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
    payload.user || 'Admin'
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
    message: 'Pesantren berhasil disimpan dan ID resmi berhasil diterbitkan.',
    filesUploaded: {
      izop: izopDrive ? izopDrive.url : null,
      foto: fotoDrive ? fotoDrive.url : null
    }
  };
}

function handleUpdateVerifikasi(payload) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName('pesantren');
  const pesantrenId = payload.pesantrenId;
  const decision = payload.decision;
  const reviewerNotes = payload.catatan || '';
  const reviewerUser = payload.user || 'Reviewer';
  const now = new Date().toISOString();
  
  const data = sheet.getDataRange().getValues();
  let foundRow = -1;
  let kodePesantren = '';
  
  for (let r = 1; r < data.length; r++) {
    if (data[r][0] === pesantrenId || data[r][1] === pesantrenId) {
      foundRow = r + 1;
      kodePesantren = data[r][1];
      break;
    }
  }
  
  if (foundRow === -1) {
    return { success: false, message: 'Pesantren ID tidak ditemukan.' };
  }
  
  // Kolom 9: status_verifikasi, Kolom 10: status_verifikasi_lokasi, Kolom 16: updated_at, Kolom 18: updated_by
  sheet.getRange(foundRow, 9).setValue(decision);
  if (decision === 'verified') {
    sheet.getRange(foundRow, 10).setValue('verified');
  }
  sheet.getRange(foundRow, 16).setValue(now);
  sheet.getRange(foundRow, 18).setValue(reviewerUser);
  
  // Catat review di sheet verification_reviews
  const sheetReviews = ss.getSheetByName('verification_reviews');
  sheetReviews.appendRow([
    Utilities.getUuid(),
    pesantrenId,
    'tahap_1_administratif',
    decision,
    reviewerNotes,
    '',
    decision === 'revision_required' ? 'Operator wajib melengkapi revisi' : 'Disetujui',
    '',
    reviewerUser,
    now
  ]);
  
  // Catat audit
  recordAuditLog(ss, {
    user_id: reviewerUser,
    user_role: payload.role || 'super_admin',
    event_type: 'DECIDE_VERIFICATION',
    entity_type: 'pesantren',
    entity_id: kodePesantren,
    action_description: 'Keputusan verifikasi: ' + decision + ' - Catatan: ' + reviewerNotes,
    status: decision === 'rejected' ? 'REJECTED' : 'SUCCESS'
  });
  
  return { success: true, message: 'Status verifikasi berhasil diperbarui.' };
}

function handleLogAudit(payload) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  recordAuditLog(ss, payload);
  return { success: true };
}

function recordAuditLog(ss, log) {
  const sheet = ss.getSheetByName('audit_logs');
  if (!sheet) return;
  sheet.appendRow([
    Utilities.getUuid(),
    log.user_id || 'System',
    log.user_role || 'System',
    log.event_type || 'GENERAL',
    log.entity_type || 'SYSTEM',
    log.entity_id || '-',
    log.action_description || '',
    log.status || 'SUCCESS',
    log.error_message || '',
    log.ip_address || '',
    log.timestamp || new Date().toISOString()
  ]);
}

function getAllPesantrenData() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheetPesantren = ss.getSheetByName('pesantren');
  if (!sheetPesantren) return { success: false, data: [] };
  
  const pValues = sheetPesantren.getDataRange().getValues();
  if (pValues.length <= 1) return { success: true, data: [] };
  
  const pHeaders = pValues[0];
  
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

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
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


// =========================================================================
// USER MANAGEMENT & RBAC BACKEND HANDLERS
// =========================================================================

function getAllUsersData() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName('app_users');
  if (!sheet) {
    setupSpreadsheetMasterDatabase();
    sheet = ss.getSheetByName('app_users');
  }

  // Ensure header matches 10 columns: id, email, nama_lengkap, phone, role, scope_wilayah, is_active, last_login, created_at, updated_at
  const expectedHeaders = SCHEMAS.app_users;
  const currentHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  
  if (currentHeaders.length !== expectedHeaders.length || currentHeaders[3] !== 'phone') {
    sheet.clear();
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    sheet.getRange(1, 1, 1, expectedHeaders.length).setFontWeight('bold').setBackground('#005c55').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    seedInitialUsers(sheet);
  }

  if (sheet.getLastRow() <= 1) {
    seedInitialUsers(sheet);
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return { success: true, total: 0, data: [] };

  const headers = values[0];
  const list = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx];
    });

    list.push({
      id: String(obj.id),
      name: String(obj.nama_lengkap),
      email: String(obj.email),
      phone: String(obj.phone || ''),
      role: String(obj.role),
      scope: String(obj.scope_wilayah || 'Semua Kabupaten'),
      status: (obj.is_active === true || obj.is_active === 'TRUE' || obj.is_active === 'true' || obj.is_active === 'active') ? 'active' : 'inactive',
      lastActive: 'Aktif'
    });
  }

  return { success: true, total: list.length, data: list };
}

function seedInitialUsers(sheet) {
  const now = new Date().toISOString();
  const initialUsers = [
    [Utilities.getUuid(), 'admin@rminudemak.or.id', 'K.H. Zainal Arifin', '081234567890', 'super_admin', 'Semua Kabupaten', true, now, now, now],
    [Utilities.getUuid(), 'sekretaris@rminudemak.or.id', 'Ahmad Badhawi, M.Pd', '081399887766', 'admin_kabupaten', 'PC RMI NU Demak', true, now, now, now],
    [Utilities.getUuid(), 'mwc.sayung@rminudemak.or.id', 'Gus Muhammad Ilyas', '085211223344', 'admin_kecamatan', 'MWC NU Sayung', true, now, now, now],
    [Utilities.getUuid(), 'operator.fathulhuda@gmail.com', 'M. Nurul Huda', '087788990011', 'operator_pesantren', 'PP Fathul Huda Sayung', true, now, now, now],
    [Utilities.getUuid(), 'pengasuh.futuhiyyah@gmail.com', "K.H. Sa'id Abdurrohim", '081122334455', 'pengasuh', 'PP Futuhiyyah Suburan', true, now, now, now],
    [Utilities.getUuid(), 'operator.asnawiyyah@gmail.com', 'Ust. M. Shofi, S.Pd.I', '082133445566', 'operator_pesantren', 'PP Asnawiyyah Pilang', true, now, now, now],
    [Utilities.getUuid(), 'pengasuh.girikusumo@gmail.com', 'K.H. Munif Zuhri', '081355443322', 'pengasuh', 'PP Girikusumo Mranggen', true, now, now, now]
  ];

  initialUsers.forEach(uRow => {
    sheet.appendRow(uRow);
  });
}

function handleSaveUserBackend(payload) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName('app_users');
  const u = payload.user || payload || {};
  const now = new Date().toISOString();

  const name = u.name || u.nama_lengkap;
  const email = u.email;
  const role = u.role;
  const phone = u.phone || u.no_hp || '';
  const scope = u.scope || u.scope_wilayah || 'Semua Kabupaten';

  if (!name || !email || !role) {
    return { success: false, message: 'Nama, Email, dan Peran wajib diisi.' };
  }

  const userId = u.id || Utilities.getUuid();
  const values = sheet.getDataRange().getValues();
  let foundRow = -1;

  for (let r = 1; r < values.length; r++) {
    if (String(values[r][0]) === String(userId) || (values[r][1] && String(values[r][1]).toLowerCase() === String(email).toLowerCase())) {
      foundRow = r + 1;
      break;
    }
  }

  if (foundRow !== -1) {
    // Update existing user
    sheet.getRange(foundRow, 2).setValue(email);
    sheet.getRange(foundRow, 3).setValue(name);
    sheet.getRange(foundRow, 4).setValue(phone);
    sheet.getRange(foundRow, 5).setValue(role);
    sheet.getRange(foundRow, 6).setValue(scope);
    sheet.getRange(foundRow, 7).setValue(true);
    sheet.getRange(foundRow, 10).setValue(now);
  } else {
    // Append new user
    sheet.appendRow([
      userId,
      email,
      name,
      phone,
      role,
      scope,
      true,
      now,
      now,
      now
    ]);
  }

  // Record audit log
  recordAuditLog(ss, {
    user_id: payload.operator || 'Admin',
    user_role: payload.role || 'super_admin',
    event_type: 'SAVE_USER',
    entity_type: 'app_users',
    entity_id: email,
    action_description: 'Menyimpan akun pengguna: ' + name + ' (' + role + ')',
    status: 'SUCCESS'
  });

  return { success: true, userId: userId, message: 'Akun pengguna berhasil disimpan di database.' };
}

function handleDeleteUserBackend(payload) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName('app_users');
  const userId = payload.userId || payload.id;
  const values = sheet.getDataRange().getValues();

  let foundRow = -1;
  let userName = '';

  for (let r = 1; r < values.length; r++) {
    if (String(values[r][0]) === String(userId) || (payload.email && String(values[r][1]).toLowerCase() === String(payload.email).toLowerCase())) {
      foundRow = r + 1;
      userName = values[r][2];
      break;
    }
  }

  if (foundRow === -1) {
    return { success: false, message: 'Pengguna tidak ditemukan.' };
  }

  sheet.deleteRow(foundRow);

  recordAuditLog(ss, {
    user_id: payload.operator || 'Admin',
    user_role: payload.role || 'super_admin',
    event_type: 'DELETE_USER',
    entity_type: 'app_users',
    entity_id: String(userId),
    action_description: 'Menghapus akun pengguna: ' + userName,
    status: 'SUCCESS'
  });

  return { success: true, message: 'Akun pengguna berhasil dihapus dari database.' };
}

// =========================================================================
// RBAC & ROLES MASTER BACKEND HANDLERS
// =========================================================================

function getAllRolesData() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName('app_roles');
  if (!sheet) {
    setupSpreadsheetMasterDatabase();
    sheet = ss.getSheetByName('app_roles');
  }

  if (sheet.getLastRow() <= 1) {
    seedInitialRoles(sheet);
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return { success: true, total: 0, data: [] };

  const headers = values[0];
  const list = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = row[idx]; });
    list.push(obj);
  }
  return { success: true, total: list.length, data: list };
}

function seedInitialRoles(sheet) {
  const now = new Date().toISOString();
  const initialRoles = [
    [Utilities.getUuid(), 'super_admin', 'Super Admin (PCNU Demak & IT Core)', 1, 'Akses penuh ke seluruh modul sistem, audit trail, dan konfigurasi server.', 'purple', true, now, now],
    [Utilities.getUuid(), 'admin_kabupaten', 'Admin Kabupaten (Pengurus Harian PC RMI)', 2, 'Manajemen direktori cabang, koordinasi kecamatan, verifikasi data, dan cetak laporan.', 'emerald', true, now, now],
    [Utilities.getUuid(), 'admin_kecamatan', 'Admin Kecamatan (Koordinator 14 MWC NU)', 3, 'Supervisi dan koordinasi pesantren di wilayah MWC kecamatannya masing-masing.', 'amber', true, now, now],
    [Utilities.getUuid(), 'operator_pesantren', 'Operator Pesantren (Sekretariat Pondok)', 4, 'Entri dan pembaruan data mandiri profil lembaga pesantren binaan.', 'cyan', true, now, now],
    [Utilities.getUuid(), 'pengasuh', 'Dewan Masyayikh / Pengasuh', 5, 'Supervisi keabsahan kurikulum kitab kuning, sanad keilmuan, dan restu kelembagaan.', 'indigo', true, now, now],
    [Utilities.getUuid(), 'verifikator', 'Tim Asesor & Verifikator Lapangan', 6, 'Validasi lapangan dokumen perizinan, titik geospasial GIS, dan standar kelayakan.', 'rose', true, now, now],
    [Utilities.getUuid(), 'guest', 'Tamu Terdaftar / Peneliti Eksternal', 7, 'Akses terbatas untuk membaca data statistik publik agregat.', 'slate', true, now, now]
  ];
  initialRoles.forEach(r => sheet.appendRow(r));
}

function getRBACMatrixData() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName('rbac_permissions');
  if (!sheet) {
    setupSpreadsheetMasterDatabase();
    sheet = ss.getSheetByName('rbac_permissions');
  }

  if (sheet.getLastRow() <= 1) {
    seedInitialRBACPermissions(sheet);
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return { success: true, total: 0, matrix: [] };

  const headers = values[0];
  const list = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = row[idx]; });
    list.push(obj);
  }

  // Bangun format terstruktur grouped by module
  const grouped = {};
  list.forEach(item => {
    if (!grouped[item.module_key]) {
      grouped[item.module_key] = {
        key: item.module_key,
        module: item.module_name,
        permissions: {}
      };
    }
    grouped[item.module_key].permissions[item.role_key] = item.permission_level;
  });

  return { success: true, total: list.length, raw: list, grouped: Object.values(grouped) };
}

function seedInitialRBACPermissions(sheet) {
  const now = new Date().toISOString();
  // 11 modul master
  const modules = [
    { key: 'dashboard', name: 'Dashboard Operasional', p: { super_admin: 'full', admin_kabupaten: 'full', admin_kecamatan: 'read_own', operator_pesantren: 'read_own', pengasuh: 'read', verifikator: 'read', guest: 'none' } },
    { key: 'direktori', name: 'Direktori Pesantren', p: { super_admin: 'full', admin_kabupaten: 'full', admin_kecamatan: 'read', operator_pesantren: 'read', pengasuh: 'read', verifikator: 'read', guest: 'read' } },
    { key: 'tambah', name: 'Inisiasi Record Baru', p: { super_admin: 'full', admin_kabupaten: 'full', admin_kecamatan: 'write', operator_pesantren: 'write', pengasuh: 'none', verifikator: 'write', guest: 'none' } },
    { key: 'verifikasi', name: 'Ruang Kerja Verifikasi', p: { super_admin: 'full', admin_kabupaten: 'full', admin_kecamatan: 'write', operator_pesantren: 'none', pengasuh: 'read', verifikator: 'write', guest: 'none' } },
    { key: 'peta', name: 'Peta Geospasial GIS', p: { super_admin: 'full', admin_kabupaten: 'full', admin_kecamatan: 'read', operator_pesantren: 'read', pengasuh: 'read', verifikator: 'read', guest: 'read' } },
    { key: 'buku-induk', name: 'Buku Induk Pesantren', p: { super_admin: 'full', admin_kabupaten: 'full', admin_kecamatan: 'read_own', operator_pesantren: 'read_own', pengasuh: 'read', verifikator: 'read', guest: 'none' } },
    { key: 'laporan', name: 'Laporan & Statistik', p: { super_admin: 'full', admin_kabupaten: 'full', admin_kecamatan: 'read_own', operator_pesantren: 'none', pengasuh: 'read', verifikator: 'none', guest: 'none' } },
    { key: 'pengguna', name: 'Manajemen Pengguna', p: { super_admin: 'full', admin_kabupaten: 'full', admin_kecamatan: 'none', operator_pesantren: 'none', pengasuh: 'none', verifikator: 'none', guest: 'none' } },
    { key: 'peran', name: 'Manajemen Peran (RBAC)', p: { super_admin: 'full', admin_kabupaten: 'read', admin_kecamatan: 'none', operator_pesantren: 'none', pengasuh: 'none', verifikator: 'none', guest: 'none' } },
    { key: 'wilayah', name: 'Referensi 14 Kecamatan', p: { super_admin: 'full', admin_kabupaten: 'full', admin_kecamatan: 'read', operator_pesantren: 'read', pengasuh: 'read', verifikator: 'read', guest: 'read' } },
    { key: 'audit', name: 'Riwayat Audit Trail', p: { super_admin: 'full', admin_kabupaten: 'read', admin_kecamatan: 'none', operator_pesantren: 'none', pengasuh: 'none', verifikator: 'none', guest: 'none' } }
  ];

  const roles = ['super_admin', 'admin_kabupaten', 'admin_kecamatan', 'operator_pesantren', 'pengasuh', 'verifikator', 'guest'];

  const allRows = [];
  modules.forEach(m => {
    roles.forEach(r => {
      const pLevel = m.p[r] || 'none';
      const canC = (pLevel === 'full' || pLevel === 'write');
      const canR = (pLevel === 'full' || pLevel === 'read' || pLevel === 'read_own' || pLevel === 'write');
      const canU = (pLevel === 'full' || pLevel === 'write');
      const canD = (pLevel === 'full');
      const canV = (pLevel === 'full');

      allRows.push([
        Utilities.getUuid(),
        m.key,
        m.name,
        r,
        pLevel,
        canC,
        canR,
        canU,
        canD,
        canV,
        'System Initializer',
        now
      ]);
    });
  });

  if (allRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, allRows.length, allRows[0].length).setValues(allRows);
  }
}

function handleUpdateRBACPermission(payload) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName('rbac_permissions');
  if (!sheet) {
    setupSpreadsheetMasterDatabase();
    sheet = ss.getSheetByName('rbac_permissions');
  }

  const moduleKey = payload.moduleKey;
  const roleKey = payload.roleKey;
  const newPermission = payload.newPermission;
  const operator = payload.operator || 'Admin';
  const now = new Date().toISOString();

  if (!moduleKey || !roleKey || !newPermission) {
    return { success: false, message: 'moduleKey, roleKey, dan newPermission wajib disertakan.' };
  }

  if (roleKey === 'super_admin') {
    return { success: false, message: 'Hak akses Super Admin terkunci permanen (Penuh) untuk mencegah lockout sistem.' };
  }

  const values = sheet.getDataRange().getValues();
  let foundRow = -1;

  for (let r = 1; r < values.length; r++) {
    if (values[r][1] === moduleKey && values[r][3] === roleKey) {
      foundRow = r + 1;
      break;
    }
  }

  const canC = (newPermission === 'full' || newPermission === 'write');
  const canR = (newPermission === 'full' || newPermission === 'read' || newPermission === 'read_own' || newPermission === 'write');
  const canU = (newPermission === 'full' || newPermission === 'write');
  const canD = (newPermission === 'full');
  const canV = (newPermission === 'full');

  if (foundRow !== -1) {
    sheet.getRange(foundRow, 5).setValue(newPermission);
    sheet.getRange(foundRow, 6).setValue(canC);
    sheet.getRange(foundRow, 7).setValue(canR);
    sheet.getRange(foundRow, 8).setValue(canU);
    sheet.getRange(foundRow, 9).setValue(canD);
    sheet.getRange(foundRow, 10).setValue(canV);
    sheet.getRange(foundRow, 11).setValue(operator);
    sheet.getRange(foundRow, 12).setValue(now);
  } else {
    sheet.appendRow([
      Utilities.getUuid(),
      moduleKey,
      moduleKey,
      roleKey,
      newPermission,
      canC, canR, canU, canD, canV,
      operator,
      now
    ]);
  }

  // Record audit trail
  recordAuditLog(ss, {
    user_id: operator,
    user_role: payload.role || 'super_admin',
    event_type: 'UPDATE_RBAC_PERMISSION',
    entity_type: 'rbac_permissions',
    entity_id: moduleKey + ':' + roleKey,
    action_description: 'Mengubah izin modul ' + moduleKey + ' untuk peran ' + roleKey + ' menjadi: ' + newPermission,
    status: 'SUCCESS'
  });

  return {
    success: true,
    message: 'Hak akses modul ' + moduleKey + ' untuk peran ' + roleKey + ' berhasil diperbarui ke ' + newPermission + '.',
    updatedAt: now
  };
}


// =========================================================================
// INISIALISASI OTOMATIS 4 TAB SHEET CMS WEB PUBLIK DI GOOGLE SHEETS
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
      'id', 'judul', 'slug', 'kategori', 'ringkasan', 'isi_lengkap', 'cover_image_url', 'penulis', 'is_featured', 'status', 'published_at', 'views_count', 'updated_at'
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

  return {
    success: true,
    message: 'Berhasil membuat dan menyiapkan 4 tab sheet CMS Web Publik!',
    createdSheets: createdSheets
  };
}


// ==================================================================
// MIGRASI ASET GAMBAR KE GOOGLE DRIVE & UPDATE SPREADSHEET DATABASE
// ==================================================================
function handleMigrateAssetsToDrive(payload) {
  try {
    const folderName = "RMINU_DEMAK_WEB_ASSETS";
    let folder;
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const driveResults = {};

    function saveOrGetFile(name, base64Data, mimeType) {
      const existingFiles = folder.getFilesByName(name);
      if (existingFiles.hasNext()) {
        const ef = existingFiles.next();
        ef.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        const fileId = ef.getId();
        return {
          id: fileId,
          url: "https://lh3.googleusercontent.com/d/" + fileId
        };
      }

      if (base64Data) {
        const decoded = Utilities.base64Decode(base64Data);
        const blob = Utilities.newBlob(decoded, mimeType || "image/jpeg", name);
        const newFile = folder.createFile(blob);
        newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        const fileId = newFile.getId();
        return {
          id: fileId,
          url: "https://lh3.googleusercontent.com/d/" + fileId
        };
      }
      return null;
    }

    if (payload && payload.files && Array.isArray(payload.files)) {
      payload.files.forEach(function(f) {
        const res = saveOrGetFile(f.name, f.base64, f.mimeType);
        if (res) driveResults[f.key || f.name] = res;
      });
    }

    // Update Spreadsheet Database directly
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    // Update web_beranda
    const sheetBeranda = ss.getSheetByName('web_beranda');
    if (sheetBeranda) {
      const data = sheetBeranda.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        const rowId = String(data[i][0]);
        if (rowId === 'PIMPINAN-01' && driveResults['rais_syuriyah']) {
          sheetBeranda.getRange(i + 1, 7).setValue(driveResults['rais_syuriyah'].url);
          sheetBeranda.getRange(i + 1, 8).setValue(driveResults['rais_syuriyah'].id);
        } else if (rowId === 'PIMPINAN-02' && driveResults['ketua_tanfidziyah']) {
          sheetBeranda.getRange(i + 1, 7).setValue(driveResults['ketua_tanfidziyah'].url);
          sheetBeranda.getRange(i + 1, 8).setValue(driveResults['ketua_tanfidziyah'].id);
        } else if (rowId === 'PIMPINAN-03' && driveResults['ketua_rmi']) {
          sheetBeranda.getRange(i + 1, 7).setValue(driveResults['ketua_rmi'].url);
          sheetBeranda.getRange(i + 1, 8).setValue(driveResults['ketua_rmi'].id);
        }
      }

      // Add/Update Hero Slides
      const heroSlides = [
        { id: 'HERO-SLIDE-01', key: 'hero_slide_1', title: 'Slide Hero 1' },
        { id: 'HERO-SLIDE-02', key: 'hero_slide_2', title: 'Slide Hero 2' },
        { id: 'HERO-SLIDE-03', key: 'hero_slide_3', title: 'Slide Hero 3' }
      ];

      heroSlides.forEach(function(slide, idx) {
        if (driveResults[slide.key]) {
          let found = false;
          for (let i = 1; i < data.length; i++) {
            if (String(data[i][0]) === slide.id) {
              sheetBeranda.getRange(i + 1, 7).setValue(driveResults[slide.key].url);
              sheetBeranda.getRange(i + 1, 8).setValue(driveResults[slide.key].id);
              found = true;
              break;
            }
          }
          if (!found) {
            sheetBeranda.appendRow([
              slide.id, 'hero_slider', slide.title, '', '', '',
              driveResults[slide.key].url, driveResults[slide.key].id, '', idx + 1, true, new Date().toISOString()
            ]);
          }
        }
      });
    }

    // Update web_berita
    const sheetBerita = ss.getSheetByName('web_berita');
    if (sheetBerita && sheetBerita.getLastRow() <= 1) {
      const now = new Date().toISOString();
      const initialNews = [
        [
          1, 'Ribuan Santri Demak Gelar Aksi Damai Solidaritas Pesantren Nusantara',
          'ribuan-santri-demak-gelar-aksi-damai', 'Pendidikan',
          'Aksi damai ribuan santri se-Kabupaten Demak meneguhkan komitmen kebangsaan dan perdamaian nusantara.',
          'Demak — Ribuan santri dari berbagai pondok pesantren di Kabupaten Demak menggelar aksi damai solidaritas...',
          driveResults['berita_santri_damai'] ? driveResults['berita_santri_damai'].url : (driveResults['hero_slide_1'] ? driveResults['hero_slide_1'].url : ''),
          'Redaksi RMI PCNU Demak', true, 'Terbit', now, 1250, now
        ],
        [
          2, 'PCNU Demak Matangkan Kurikulum Madrasah Diniyah Jelang Ujian',
          'pcnu-demak-matangkan-kurikulum-madrasah-diniyah', 'Pendidikan',
          'Standardisasi kurikulum madrasah diniyah disosialisasikan secara serentak di 14 kecamatan.',
          'Demak — Pengurus Cabang Nahdlatul Ulama (PCNU) Kabupaten Demak melalui RMI mematangkan kurikulum...',
          driveResults['berita_kurikulum_madin'] ? driveResults['berita_kurikulum_madin'].url : (driveResults['hero_slide_2'] ? driveResults['hero_slide_2'].url : ''),
          'LTN NU Demak', false, 'Terbit', now, 840, now
        ]
      ];
      sheetBerita.getRange(2, 1, initialNews.length, initialNews[0].length).setValues(initialNews);
    }

    return {
      success: true,
      message: 'Berhasil mengunggah seluruh aset ke Google Drive dan memperbarui Google Sheets!',
      folderUrl: folder.getUrl(),
      assets: driveResults
    };
  } catch(err) {
    return {
      success: false,
      error: err.toString()
    };
  }
}
