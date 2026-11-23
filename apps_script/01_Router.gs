/**
 * =========================================================================
 * 01_Router.gs
 * Central HTTP Router (doGet & doPost) & Action Dispatcher
 * =========================================================================
 */

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

  if (action === 'GET_PENGURUS_ORGANOGRAM' || action === 'GET_ALL_PENGURUS') {
    const res = getPengurusOrganogram();
    return createJsonResponse(res);
  }

  if (action === 'GET_SAMBANG_STATS' || action === 'GET_SAMBANG_DELEGATES') {
    const res = getSambangDelegatesData();
    return createJsonResponse(res);
  }

  if (action === 'GET_BERITA' || action === 'GET_ALL_BERITA') {
    const res = getPublicBeritaList(e ? e.parameter : {});
    return createJsonResponse(res);
  }

  if (action === 'CLEAN_DUMMY_BERITA') {
    const res = handleCleanDummyBerita();
    return createJsonResponse(res);
  }

  if (action === 'CLEAN_SAMBANG_PHONE_NUMBERS') {
    const res = handleCleanSambangDelegatesPhoneNumbers();
    return createJsonResponse(res);
  }

  if (action === 'FIX_LEADERS_PRIMARY') {
    const res = handleFixSpreadsheetLeadersPrimary();
    return createJsonResponse(res);
  }

  if (action === 'CLEANUP_OLD_JPG_LOGOS') {
    const res = handleCleanupOldJpgInLogoFolder();
    return createJsonResponse(res);
  }

  if (action === 'MIGRATE_INITIAL_KLASIFIKASI' || action === 'CALCULATE_KLASIFIKASI') {
    const res = handleMigrateInitialKlasifikasi();
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
    } else if (action === 'UPDATE_PESANTREN_LOGO' || action === 'UPLOAD_PESANTREN_LOGO') {
      result = handleUpdatePesantrenLogo(payload);
    } else if (action === 'UPDATE_VERIFIKASI') {
      result = handleUpdateVerifikasi(payload);
    } else if (action === 'UPDATE_PESANTREN_PROFILE') {
      result = handleUpdatePesantrenProfile(payload, lock);
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
    } else if (action === 'REQUEST_OTP' || action === 'auth.admin.requestOtp') {
      result = handleRequestOtp(payload);
    } else if (action === 'VERIFY_OTP' || action === 'auth.admin.verifyOtp') {
      result = handleVerifyOtp(payload);
    } else if (action === 'FAST_LOGIN_EMAIL' || action === 'auth.admin.fastLogin') {
      result = handleFastLoginEmail(payload);
    } else if (action === 'REGISTER_PESANTREN_SELF' || action === 'auth.pesantren.registerSelf') {
      result = handleSelfRegisterPesantren(payload, lock);
    } else if (action === 'SAVE_PENGURUS_RECORD' || action === 'SAVE_PENGURUS') {
      result = handleSavePengurusRecord(payload);
    } else if (action === 'DELETE_PENGURUS_RECORD' || action === 'DELETE_PENGURUS') {
      result = handleDeletePengurusRecord(payload);
    } else if (action === 'SAVE_BERITA' || action === 'SYNC_BERITA') {
      result = handleSaveBerita(payload);
    } else if (action === 'CLEAN_DUMMY_BERITA') {
      result = handleCleanDummyBerita();
    } else if (action === 'CLEAN_SAMBANG_PHONE_NUMBERS') {
      result = handleCleanSambangDelegatesPhoneNumbers();
    } else if (action === 'SUBMIT_SAMBANG_DELEGATE') {
      result = handleSubmitSambangDelegate(payload, lock);
    } else if (action === 'SCAN_CHECKIN_SAMBANG') {
      result = handleScanCheckinSambang(payload, lock);
    } else if (action === 'GET_SAMBANG_STATS' || action === 'GET_SAMBANG_DELEGATES') {
      result = getSambangDelegatesData();
    } else if (action === 'BATCH_IMPORT_PESANTREN') {
      result = handleBatchImportPesantren(payload, lock);
    } else if (action === 'EXECUTE_OPTION_B_ENRICH_AND_IMPORT') {
      result = handleExecuteOptionB(payload);
    } else if (action === 'UPLOAD_PESANTREN_MEDIA_CHUNK') {
      result = handleUploadPesantrenMediaChunk(payload);
    } else if (action === 'SYNC_PESANTREN_MEDIA_URLS') {
      result = handleSyncPesantrenMediaUrls(payload);
    } else if (action === 'FIX_LEADERS_PRIMARY') {
      result = handleFixSpreadsheetLeadersPrimary();
    } else if (action === 'UPLOAD_AND_REPLACE_LOGO_PESANTREN') {
      result = handleUploadAndReplaceLogoPesantren(payload);
    } else if (action === 'CLEANUP_OLD_JPG_LOGOS') {
      result = handleCleanupOldJpgInLogoFolder();
    } else if (action === 'MIGRATE_INITIAL_KLASIFIKASI' || action === 'CALCULATE_KLASIFIKASI') {
      result = handleMigrateInitialKlasifikasi();
    }
    
    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message, stack: err.stack });
  } finally {
    lock.releaseLock();
  }
}

