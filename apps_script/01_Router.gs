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
    } else if (action === 'REQUEST_OTP' || action === 'auth.admin.requestOtp') {
      result = handleRequestOtp(payload);
    } else if (action === 'VERIFY_OTP' || action === 'auth.admin.verifyOtp') {
      result = handleVerifyOtp(payload);
    } else if (action === 'FAST_LOGIN_EMAIL' || action === 'auth.admin.fastLogin') {
      result = handleFastLoginEmail(payload);
    } else if (action === 'REGISTER_PESANTREN_SELF' || action === 'auth.pesantren.registerSelf') {
      result = handleSelfRegisterPesantren(payload, lock);
    }
    
    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message, stack: err.stack });
  } finally {
    lock.releaseLock();
  }
}

