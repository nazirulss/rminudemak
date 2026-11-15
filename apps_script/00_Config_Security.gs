/**
 * =========================================================================
 * 00_Config_Security.gs
 * PESANTREN DATA CENTER - RMI PCNU KABUPATEN DEMAK
 * Konfigurasi Global, Database Schemas, Inisialisasi Sheet, & Response Helper
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
  ],
  app_pengurus: [
    'id', 'tingkat_hirarki', 'jabatan', 'nama_lengkap', 'gelar_depan', 'gelar_belakang',
    'foto_drive_url', 'parent_id', 'tipe_garis', 'tupoksi', 'urutan', 'is_active', 'updated_at'
  ],
  sambang_delegates: [
    'delegate_id', 'timestamp', 'kecamatan', 'nama_pesantren', 'kategori_halaqah',
    'nama_peserta', 'no_whatsapp', 'jabatan_peran', 'catatan_khusus', 'status_kehadiran'
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


function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
