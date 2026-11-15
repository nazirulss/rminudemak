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

