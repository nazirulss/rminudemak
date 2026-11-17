/**
 * =========================================================================
 * 08_Batch_Importer.gs
 * Modul Batch Importer & Media Uploader untuk Database RMINU_DEMAK_DB
 * =========================================================================
 */

/**
 * Upload sekumpulan file media ke Google Drive dalam satu batch
 */
function handleUploadPesantrenMediaChunk(payload) {
  if (!payload || !payload.files || !Array.isArray(payload.files)) {
    return { success: false, message: 'Payload files tidak valid' };
  }

  const results = {};
  for (let i = 0; i < payload.files.length; i++) {
    const fileObj = payload.files[i];
    const subfolder = fileObj.subfolder || 'Logo_Pesantren';
    const uploadRes = uploadBase64FileToDrive(fileObj, subfolder);
    if (uploadRes) {
      results[fileObj.key || fileObj.name] = uploadRes;
    }
  }

  return {
    success: true,
    totalUploaded: Object.keys(results).length,
    results: results
  };
}

/**
 * Batch import data pesantren ke tabel-tabel spreadsheet secara atomik
 */
function handleBatchImportPesantren(payload, lock) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const tables = payload.tables || {};
  const clearExisting = payload.clearExisting === true;
  const summary = {};

  // Daftar tabel yang didukung sesuai skema SCHEMAS
  const tableOrder = [
    'pesantren',
    'pesantren_locations',
    'pesantren_leaders',
    'pesantren_contacts',
    'pesantren_education',
    'pesantren_facilities',
    'pesantren_santri_aggregates',
    'pesantren_staff_aggregates',
    'pesantren_development_profiles',
    'pesantren_flagship_programs'
  ];

  for (let t = 0; t < tableOrder.length; t++) {
    const tableName = tableOrder[t];
    const rows = tables[tableName];
    if (!rows || !Array.isArray(rows)) continue;

    const schema = SCHEMAS[tableName];
    if (!schema) continue;

    let sheet = ss.getSheetByName(tableName);
    if (!sheet) {
      sheet = ss.insertSheet(tableName);
      sheet.getRange(1, 1, 1, schema.length).setValues([schema]);
      sheet.getRange(1, 1, 1, schema.length).setFontWeight('bold').setBackground('#005c55').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    // Jika diminta bersihkan data lama (baris 2 ke bawah)
    if (clearExisting) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
    }

    if (rows.length === 0) {
      summary[tableName] = 0;
      continue;
    }

    // Konversi baris objek menjadi 2D array sesuai urutan kolom skema
    const matrix = [];
    for (let r = 0; r < rows.length; r++) {
      const rowData = rows[r];
      const rowValues = [];
      for (let c = 0; c < schema.length; c++) {
        const colName = schema[c];
        let val = rowData[colName];
        if (val === undefined || val === null) val = '';
        rowValues.push(val);
      }
      matrix.push(rowValues);
    }

    // Tulis ke sheet secara massal (sangat cepat & aman)
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, matrix.length, schema.length).setValues(matrix);
    summary[tableName] = matrix.length;
  }

  return {
    success: true,
    message: 'Batch import data pesantren berhasil dieksekusi.',
    clearExistingApplied: clearExisting,
    summary: summary,
    timestamp: new Date().toISOString()
  };
}

/**
 * Otomatis menyelaraskan kolom is_primary dan urutan_prioritas di sheet pesantren_leaders
 * agar sosok berjabatan PENGASUH otomatis menjadi prioritas utama.
 */
function handleFixSpreadsheetLeadersPrimary() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheetLeaders = ss.getSheetByName('pesantren_leaders');
  if (!sheetLeaders) return { success: false, message: 'Sheet pesantren_leaders tidak ditemukan' };

  const data = sheetLeaders.getDataRange().getValues();
  if (data.length <= 1) return { success: true, updated: 0 };

  // Kelompokkan per pesantren_id
  const groups = {};
  for (let i = 1; i < data.length; i++) {
    const pid = String(data[i][1]);
    if (!groups[pid]) groups[pid] = [];
    groups[pid].push({ rowIndex: i + 1, rowData: data[i] });
  }

  let updatedCount = 0;

  for (const pid in groups) {
    const list = groups[pid];
    let bestRow = null;
    let bestScore = -1;

    for (let j = 0; j < list.length; j++) {
      const item = list[j];
      const jabatan = String(item.rowData[5] || '').toLowerCase();
      const gelarDepan = String(item.rowData[3] || '').toLowerCase();
      let score = 10;

      if (jabatan.includes('pengasuh utama') || jabatan === 'pengasuh' || jabatan.includes('khadim')) {
        score = 100;
      } else if (jabatan.includes('pengasuh') && !jabatan.includes('wakil')) {
        score = 90;
      } else if (jabatan.includes('pimpinan') && !jabatan.includes('wakil')) {
        score = 75;
      } else if (gelarDepan.includes('kh') || gelarDepan.includes('k.')) {
        score = 50;
      }

      if (score > bestScore) {
        bestScore = score;
        bestRow = item;
      }
    }

    if (bestRow) {
      // Set bestRow is_primary = TRUE (Kolom L = index 12), urutan_prioritas = 1 (Kolom J = index 10)
      sheetLeaders.getRange(bestRow.rowIndex, 12).setValue(true);
      sheetLeaders.getRange(bestRow.rowIndex, 10).setValue(1);

      // Set others is_primary = FALSE
      for (let j = 0; j < list.length; j++) {
        if (list[j].rowIndex !== bestRow.rowIndex) {
          sheetLeaders.getRange(list[j].rowIndex, 12).setValue(false);
        }
      }
      updatedCount++;
    }
  }

  return { success: true, updatedPesantren: updatedCount };
}
