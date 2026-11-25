/**
 * =========================================================================
 * 07_Drive_Uploader.gs
 * Penanganan Berkas Google Drive: Upload Base64 & Migrasi Aset Gambar
 * =========================================================================
 */

// =========================================================================
// 5. HELPER UPLOAD FILE KE GOOGLE DRIVE
// =========================================================================
function uploadBase64FileToDrive(fileObj, subfolderName) {
  if (!fileObj || !fileObj.base64) return null;
  const filename = fileObj.filename || fileObj.name || ('dokumen_' + Date.now());
  
  try {
    let rootFolder;
    try {
      if (CONFIG.DRIVE_FOLDER_ID) {
        rootFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
      }
    } catch (fErr) {
      Logger.log('Drive folder ID tidak ditemukan, fallback ke folder default: ' + fErr.message);
    }

    if (!rootFolder) {
      const folderName = "RMINU_DEMAK_WEB_ASSETS";
      const folders = DriveApp.getFoldersByName(folderName);
      if (folders.hasNext()) {
        rootFolder = folders.next();
      } else {
        rootFolder = DriveApp.createFolder(folderName);
      }
    }

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
    const blob = Utilities.newBlob(bytes, fileObj.mimeType || 'application/octet-stream', filename);
    const uploadedFile = targetFolder.createFile(blob);
    uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileId = uploadedFile.getId();
    return {
      fileId: fileId,
      url: uploadedFile.getUrl(),
      directUrl: "https://lh3.googleusercontent.com/d/" + fileId,
      filename: filename
    };
  } catch (err) {
    Logger.log('Gagal upload file ke Drive: ' + err.message);
    return null;
  }
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

/**
 * =========================================================================
 * BATCH UPLOAD LOGO PESANTREN (.PNG TRANSPARAN) & GANTIKAN .JPG LAMA DI DRIVE
 * =========================================================================
 */
function handleUploadAndReplaceLogoPesantren(payload) {
  if (!payload || !payload.files || !Array.isArray(payload.files)) {
    return { success: false, message: 'Payload files tidak valid' };
  }

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName('pesantren');
  if (!sheet) return { success: false, message: 'Sheet pesantren tidak ditemukan' };

  // Dapatkan folder Logo_Pesantren
  let rootFolder;
  try {
    if (CONFIG.DRIVE_FOLDER_ID) {
      rootFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    }
  } catch (e) {
    Logger.log('Drive folder fallback: ' + e.message);
  }
  if (!rootFolder) {
    const folders = DriveApp.getFoldersByName("RMINU_DEMAK_WEB_ASSETS");
    rootFolder = folders.hasNext() ? folders.next() : DriveApp.createFolder("RMINU_DEMAK_WEB_ASSETS");
  }

  let logoFolder;
  const subFolders = rootFolder.getFoldersByName('Logo_Pesantren');
  if (subFolders.hasNext()) {
    logoFolder = subFolders.next();
  } else {
    logoFolder = rootFolder.createFolder('Logo_Pesantren');
  }
  logoFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // Ambil data pesantren untuk pencocokan row
  const pData = sheet.getDataRange().getValues();
  const pHeaders = pData[0];
  let colLogo = pHeaders.indexOf('logo_url') + 1;
  if (colLogo === 0) {
    colLogo = pHeaders.length + 1;
    sheet.getRange(1, colLogo).setValue('logo_url').setFontWeight('bold').setBackground('#005c55').setFontColor('#ffffff');
  }

  // Map baris berdasarkan id, kode_pesantren, dan slug nama
  const rowMap = {};
  for (let r = 1; r < pData.length; r++) {
    const id = String(pData[r][0]);
    const kode = String(pData[r][1]);
    const namaResmi = String(pData[r][2] || '').toLowerCase();
    const namaPopuler = String(pData[r][3] || '').toLowerCase();
    rowMap[id] = r + 1;
    rowMap[kode] = r + 1;
    
    // Slugs
    const clean1 = namaResmi.replace(/^(pondok\s+pesantren|ponpes|pp)\s+/i, '').trim();
    const s1 = clean1.replace(/['"’`]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    const s2 = namaResmi.replace(/['"’`]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    if (s1) rowMap['slug:' + s1] = r + 1;
    if (s2) rowMap['slug:' + s2] = r + 1;
    if (s1) rowMap['slug:' + s1 + '-2'] = r + 1;
    if (s2) rowMap['slug:' + s2 + '-2'] = r + 1;
    if (s1) rowMap['slug:' + s1 + '-3'] = r + 1;
    if (s2) rowMap['slug:' + s2 + '-3'] = r + 1;
    if (s1) rowMap['slug:' + s1 + '-8'] = r + 1;
    if (s1) rowMap['slug:' + s1 + '-11'] = r + 1;
  }

  const results = {};
  let updatedCount = 0;
  let deletedJpgCount = 0;

  for (let i = 0; i < payload.files.length; i++) {
    const item = payload.files[i];
    const slug = item.slug || (item.name || '').replace(/\.png$/i, '');
    const filename = item.filename || item.name || (slug + '.png');
    const pesantrenId = item.pesantrenId || item.kode_pesantren;

    // 1. Cari dan hapus file .jpg (atau .png duplikat lama) di folder Drive
    const possibleOldNames = [
      'logo_' + slug + '.jpg',
      slug + '.jpg',
      'logo_' + slug + '.png',
      filename
    ];

    for (let k = 0; k < possibleOldNames.length; k++) {
      const oldFiles = logoFolder.getFilesByName(possibleOldNames[k]);
      while (oldFiles.hasNext()) {
        const oldFile = oldFiles.next();
        try {
          oldFile.setTrashed(true);
          deletedJpgCount++;
        } catch (delErr) {
          Logger.log('Gagal trash file: ' + delErr.message);
        }
      }
    }

    // 2. Simpan file .png baru ke folder Logo_Pesantren
    const bytes = Utilities.base64Decode(item.base64);
    const blob = Utilities.newBlob(bytes, 'image/png', filename);
    const newFile = logoFolder.createFile(blob);
    newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileId = newFile.getId();
    const directUrl = "https://lh3.googleusercontent.com/d/" + fileId;

    // 3. Update database spreadsheet
    let targetRow = null;
    if (pesantrenId && rowMap[pesantrenId]) {
      targetRow = rowMap[pesantrenId];
    } else if (rowMap['slug:' + slug]) {
      targetRow = rowMap['slug:' + slug];
    } else if (slug.indexOf('hisnun-naja') !== -1 && rowMap['RMI-DMK-000004']) {
      targetRow = rowMap['RMI-DMK-000004'];
    }

    if (targetRow) {
      sheet.getRange(targetRow, colLogo).setValue(directUrl);
      updatedCount++;
    }

    results[slug] = {
      slug: slug,
      filename: filename,
      fileId: fileId,
      directUrl: directUrl,
      updatedRow: targetRow || null
    };
  }

  return {
    success: true,
    totalFiles: payload.files.length,
    updatedDatabaseRows: updatedCount,
    deletedOldFiles: deletedJpgCount,
    results: results
  };
}

/**
 * Pembersihan massal berkas .jpg lama di folder Logo_Pesantren
 */
function handleCleanupOldJpgInLogoFolder() {
  let rootFolder;
  try {
    if (CONFIG.DRIVE_FOLDER_ID) {
      rootFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    }
  } catch (e) {}
  if (!rootFolder) {
    const folders = DriveApp.getFoldersByName("RMINU_DEMAK_WEB_ASSETS");
    if (folders.hasNext()) rootFolder = folders.next();
  }
  if (!rootFolder) return { success: false, message: 'Root folder not found' };

  const subFolders = rootFolder.getFoldersByName('Logo_Pesantren');
  if (!subFolders.hasNext()) return { success: false, message: 'Logo_Pesantren folder not found' };
  const logoFolder = subFolders.next();

  const files = logoFolder.getFiles();
  let trashedJpg = 0;
  let remainingPng = 0;
  const trashedNames = [];

  while (files.hasNext()) {
    const f = files.next();
    const name = f.getName().toLowerCase();
    if (name.endsWith('.jpg') || name.endsWith('.jpeg')) {
      trashedNames.push(f.getName());
      f.setTrashed(true);
      trashedJpg++;
    } else if (name.endsWith('.png')) {
      remainingPng++;
    }
  }

  return {
    success: true,
    trashedJpg: trashedJpg,
    trashedNames: trashedNames,
    remainingPng: remainingPng
  };
}

// =========================================================================
// UPLOAD FOTO/GAMBAR BERITA KE GOOGLE DRIVE
// =========================================================================
function handleUploadBeritaImage(payload) {
  try {
    if (!payload || !payload.base64) {
      return { success: false, error: 'Data gambar (base64) tidak ditemukan.' };
    }

    const timestamp = Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMdd_HHmmss');
    const safeName = (payload.filename || ('berita_' + timestamp + '.jpg')).replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileObj = {
      base64: payload.base64,
      filename: safeName,
      mimeType: payload.mimeType || 'image/jpeg'
    };

    const uploadRes = uploadBase64FileToDrive(fileObj, 'Foto_Berita');
    if (!uploadRes || !uploadRes.fileId) {
      return { success: false, error: 'Gagal mengunggah gambar ke Google Drive.' };
    }

    return {
      success: true,
      message: 'Foto berita berhasil diunggah ke Google Drive!',
      fileId: uploadRes.fileId,
      url: uploadRes.url,
      directUrl: uploadRes.directUrl,
      filename: safeName
    };
  } catch (err) {
    return { success: false, error: 'Kesalahan server unggah foto berita: ' + err.message };
  }
}

