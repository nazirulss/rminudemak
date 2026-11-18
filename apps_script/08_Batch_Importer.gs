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

/**
 * Eksekusi Opsi B:
 * 1. Pengayaan Data Eksisting (Enrichment 184 Pesantren)
 * 2. Impor 113 Pesantren Baru (RMI-DMK-000181 s.d. RMI-DMK-000293)
 */
function handleExecuteOptionB(payload) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const enrichmentList = payload.enrichedExisting || [];
  const newRecords = payload.newRecords || {};

  const summary = {
    enriched_leaders: 0,
    enriched_contacts: 0,
    enriched_santri: 0,
    enriched_staff: 0,
    new_pesantren: 0,
    new_locations: 0,
    new_leaders: 0,
    new_contacts: 0
  };

  const sheetLeaders = ss.getSheetByName('pesantren_leaders');
  const sheetContacts = ss.getSheetByName('pesantren_contacts');
  const sheetSantri = ss.getSheetByName('pesantren_santri_aggregates');
  const sheetStaff = ss.getSheetByName('pesantren_staff_aggregates');
  const nowWib = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  // 1. Pengayaan Pimpinan / Pengasuh
  if (sheetLeaders) {
    const lData = sheetLeaders.getDataRange().getValues();
    const lMap = {};
    for (let i = 1; i < lData.length; i++) {
      const pid = String(lData[i][1]);
      lMap[pid] = lMap[pid] || [];
      lMap[pid].push({ rowIndex: i + 1, nama: String(lData[i][2]), jabatan: String(lData[i][5]), isPrimary: String(lData[i][11]) });
    }

    const leadersToAppend = [];
    for (let e = 0; e < enrichmentList.length; e++) {
      const item = enrichmentList[e];
      const pid = item.pesantren_id;
      const pimpinan = item.pimpinan;
      if (!pimpinan || pimpinan.length < 3) continue;

      const existingLeaders = lMap[pid];
      if (existingLeaders && existingLeaders.length > 0) {
        const genericLeader = existingLeaders.find(l => !l.nama || l.nama.toLowerCase() === 'pengasuh pesantren' || l.nama.toLowerCase() === 'pengasuh');
        if (genericLeader) {
          sheetLeaders.getRange(genericLeader.rowIndex, 3).setValue(pimpinan);
          summary.enriched_leaders++;
        }
      } else {
        leadersToAppend.push([
          Utilities.getUuid(),
          pid,
          pimpinan,
          '', '', 'PENGASUH', 'Ustadz', 'Dirasah Islamiyah & Turots', 'Pondok Pesantren', 1, 'TRUE', 'TRUE', nowWib, nowWib
        ]);
        summary.enriched_leaders++;
      }
    }

    if (leadersToAppend.length > 0) {
      const lastR = sheetLeaders.getLastRow();
      sheetLeaders.getRange(lastR + 1, 1, leadersToAppend.length, leadersToAppend[0].length).setValues(leadersToAppend);
    }
  }

  // 2. Pengayaan Kontak HP
  if (sheetContacts) {
    const cData = sheetContacts.getDataRange().getValues();
    const cMap = {};
    for (let i = 1; i < cData.length; i++) {
      const pid = String(cData[i][1]);
      cMap[pid] = cMap[pid] || [];
      cMap[pid].push(String(cData[i][3]));
    }

    const contactsToAppend = [];
    for (let e = 0; e < enrichmentList.length; e++) {
      const item = enrichmentList[e];
      const pid = item.pesantren_id;
      const phone = item.no_hp;
      if (!phone || phone.length < 8) continue;

      const existingPhones = cMap[pid] || [];
      if (!existingPhones.includes(phone)) {
        contactsToAppend.push([
          Utilities.getUuid(),
          pid,
          'whatsapp',
          phone,
          'Kontak Pimpinan (Master 297)',
          'FALSE',
          'TRUE',
          nowWib,
          nowWib
        ]);
        summary.enriched_contacts++;
      }
    }

    if (contactsToAppend.length > 0) {
      const lastR = sheetContacts.getLastRow();
      sheetContacts.getRange(lastR + 1, 1, contactsToAppend.length, contactsToAppend[0].length).setValues(contactsToAppend);
    }
  }

  // 3. Pengayaan Santri Aggregates
  if (sheetSantri) {
    const santriToAppend = [];
    for (let e = 0; e < enrichmentList.length; e++) {
      const item = enrichmentList[e];
      if (item.santri_total > 0 || item.santri_putra > 0 || item.santri_putri > 0) {
        santriToAppend.push([
          Utilities.getUuid(),
          item.pesantren_id,
          '2024/2025',
          'Genap',
          item.santri_putra || '',
          item.santri_putri || '',
          item.santri_total || '',
          '', '', '',
          item.santri_total || '',
          'Registrasi Master RMI 297',
          'tervalidasi',
          nowWib,
          nowWib
        ]);
        summary.enriched_santri++;
      }
    }

    if (santriToAppend.length > 0) {
      const lastR = sheetSantri.getLastRow();
      sheetSantri.getRange(lastR + 1, 1, santriToAppend.length, santriToAppend[0].length).setValues(santriToAppend);
    }
  }

  // 4. Pengayaan Staff Aggregates
  if (sheetStaff) {
    const staffToAppend = [];
    for (let e = 0; e < enrichmentList.length; e++) {
      const item = enrichmentList[e];
      if (item.ustadz > 0) {
        staffToAppend.push([
          Utilities.getUuid(),
          item.pesantren_id,
          '2024/2025',
          item.ustadz,
          '',
          item.ustadz,
          '', '', '',
          item.ustadz,
          nowWib,
          nowWib
        ]);
        summary.enriched_staff++;
      }
    }

    if (staffToAppend.length > 0) {
      const lastR = sheetStaff.getLastRow();
      sheetStaff.getRange(lastR + 1, 1, staffToAppend.length, staffToAppend[0].length).setValues(staffToAppend);
    }
  }

  // 5. Impor 113 Pesantren Baru
  if (newRecords && Object.keys(newRecords).length > 0) {
    const importRes = handleBatchImportPesantren({
      clearExisting: false,
      tables: newRecords
    });
    summary.new_pesantren = importRes.summary?.pesantren || 0;
    summary.new_locations = importRes.summary?.pesantren_locations || 0;
    summary.new_leaders = importRes.summary?.pesantren_leaders || 0;
    summary.new_contacts = importRes.summary?.pesantren_contacts || 0;
  }

  return {
    success: true,
    message: 'Eksekusi Opsi B (Pengayaan + Impor Baru) berhasil.',
    summary: summary,
    timestamp: new Date().toISOString()
  };
}

/**
 * Menyinkronkan foto_url cover ke sheet 'pesantren' dan galeri foto ke sheet 'pesantren_facilities'
 */
function handleSyncPesantrenMediaUrls(payload) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const covers = payload.covers || [];
  const facilities = payload.facilities || [];
  const summary = { coversUpdated: 0, facilitiesAppended: 0 };
  const now = new Date().toISOString();

  // 1. Update Covers di sheet pesantren
  if (covers.length > 0) {
    const sheetPesantren = ss.getSheetByName('pesantren');
    if (sheetPesantren) {
      const pData = sheetPesantren.getDataRange().getValues();
      const pHeaders = pData[0];
      let colFoto = pHeaders.indexOf('foto_url') + 1;
      if (colFoto === 0) {
        colFoto = pHeaders.length + 1;
        sheetPesantren.getRange(1, colFoto).setValue('foto_url').setFontWeight('bold').setBackground('#005c55').setFontColor('#ffffff');
      }

      // Map ID / Kode ke nomor baris (1-based)
      const rowMap = {};
      for (let r = 1; r < pData.length; r++) {
        const id = String(pData[r][0]);
        const kode = String(pData[r][1]);
        rowMap[id] = r + 1;
        rowMap[kode] = r + 1;
      }

      for (let c = 0; c < covers.length; c++) {
        const item = covers[c];
        const rowNum = rowMap[item.pesantren_id] || rowMap[item.kode_pesantren];
        if (rowNum) {
          sheetPesantren.getRange(rowNum, colFoto).setValue(item.foto_url);
          summary.coversUpdated++;
        }
      }
    }
  }

  // 2. Append Facilities ke sheet pesantren_facilities
  if (facilities.length > 0) {
    let sheetFac = ss.getSheetByName('pesantren_facilities');
    const schema = SCHEMAS.pesantren_facilities || [
      'id', 'pesantren_id', 'kategori_fasilitas', 'nama_fasilitas', 'kondisi',
      'luas_m2', 'keterangan', 'created_at', 'updated_at'
    ];
    if (!sheetFac) {
      sheetFac = ss.insertSheet('pesantren_facilities');
      sheetFac.getRange(1, 1, 1, schema.length).setValues([schema]);
      sheetFac.getRange(1, 1, 1, schema.length).setFontWeight('bold').setBackground('#005c55').setFontColor('#ffffff');
      sheetFac.setFrozenRows(1);
    }

    const facHeaders = sheetFac.getRange(1, 1, 1, sheetFac.getLastColumn()).getValues()[0];
    let colFotoFac = facHeaders.indexOf('foto_url');
    if (colFotoFac === -1) {
      sheetFac.getRange(1, facHeaders.length + 1).setValue('foto_url').setFontWeight('bold').setBackground('#005c55').setFontColor('#ffffff');
    }

    const facRows = [];
    for (let f = 0; f < facilities.length; f++) {
      const fac = facilities[f];
      facRows.push([
        fac.id || Utilities.getUuid(),
        fac.pesantren_id,
        fac.kategori_fasilitas || 'SARANA',
        fac.nama_fasilitas || 'Fasilitas Pondok',
        fac.kondisi || 'Baik',
        fac.luas_m2 || '',
        fac.keterangan || fac.foto_url || '',
        now,
        now,
        fac.foto_url || ''
      ]);
    }

    if (facRows.length > 0) {
      const startRow = sheetFac.getLastRow() + 1;
      sheetFac.getRange(startRow, 1, facRows.length, facRows[0].length).setValues(facRows);
      summary.facilitiesAppended = facRows.length;
    }
  }

  return {
    success: true,
    message: 'Media URLs berhasil disinkronkan ke database Spreadsheet.',
    summary: summary,
    timestamp: now
  };
}
