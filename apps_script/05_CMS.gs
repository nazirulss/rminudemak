/**
 * =========================================================================
 * 05_CMS.gs
 * Manajemen Konten Web Publik (Beranda, Profil Pimpinan, Berita, Layanan)
 * =========================================================================
 */

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

