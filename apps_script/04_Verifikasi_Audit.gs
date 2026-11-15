/**
 * =========================================================================
 * 04_Verifikasi_Audit.gs
 * Ruang Kerja Verifikasi Pesantren & Sistem Riwayat Audit Trail
 * =========================================================================
 */

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

