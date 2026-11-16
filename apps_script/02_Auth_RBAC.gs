/**
 * =========================================================================
 * 02_Auth_RBAC.gs
 * Autentikasi (OTP & Fast Login), Manajemen Pengguna, Roles & RBAC Matrix
 * =========================================================================
 */

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

    const isActiveBool = (obj.is_active === true || obj.is_active === 'TRUE' || obj.is_active === 'true' || obj.is_active === 'active');
    list.push({
      id: String(obj.id),
      name: String(obj.nama_lengkap),
      nama_lengkap: String(obj.nama_lengkap),
      email: String(obj.email),
      phone: String(obj.phone || ''),
      role: String(obj.role),
      scope: String(obj.scope_wilayah || 'Semua Kabupaten'),
      scope_wilayah: String(obj.scope_wilayah || 'Semua Kabupaten'),
      status: isActiveBool ? 'active' : 'inactive',
      is_active: isActiveBool,
      lastActive: 'Aktif'
    });
  }

  return { success: true, total: list.length, data: list };
}

function seedInitialUsers(sheet) {
  const now = new Date().toISOString();
  const initialUsers = [
    [Utilities.getUuid(), 'nazirulmuhammad1992@gmail.com', 'Nazirul Muhammad', '6289602807020', 'super_admin', 'Semua Kabupaten', true, now, now, now],
    [Utilities.getUuid(), 'admin@rminudemak.or.id', 'K.H. Ibrahim Cholilullah, S.Pd.', '081234567890', 'super_admin', 'Semua Kabupaten', true, now, now, now],
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

  const groupedList = Object.values(grouped);
  return { success: true, total: list.length, data: groupedList, raw: list, grouped: groupedList };
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
// 8. MODUL AUTENTIKASI: EMAIL OTP & LOGIN CEPAT TERDAFTAR (GAYA ASNAWIYYAH)
// =========================================================================

function findUserByEmailInSheet(email) {
  if (!email) return null;
  const targetEmail = String(email).trim().toLowerCase();
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName('app_users');
  if (!sheet) {
    getAllUsersData(); // auto setup & seed
    sheet = ss.getSheetByName('app_users');
  }
  if (!sheet) return null;

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return null;

  const headers = values[0];
  const emailColIdx = headers.indexOf('email');
  if (emailColIdx === -1) return null;

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const rowEmail = String(row[emailColIdx] || '').trim().toLowerCase();
    if (rowEmail === targetEmail) {
      const userObj = {};
      headers.forEach((h, idx) => {
        userObj[h] = row[idx];
      });
      return {
        rowNumber: r + 1,
        id: String(userObj.id || Utilities.getUuid()),
        email: String(userObj.email),
        name: String(userObj.nama_lengkap || userObj.name || 'Pengurus RMI'),
        phone: String(userObj.phone || ''),
        role: String(userObj.role || 'super_admin'),
        roleKey: String(userObj.role || 'super_admin'),
        scope: String(userObj.scope_wilayah || 'Semua Kabupaten'),
        isActive: (userObj.is_active === true || userObj.is_active === 'TRUE' || userObj.is_active === 'true' || userObj.is_active === 'active')
      };
    }
  }

  // Fallback khusus Super Admin Utama jika belum tertulis di sheet
  if (targetEmail === 'nazirulmuhammad1992@gmail.com' || targetEmail === 'admin@rminudemak.or.id') {
    return {
      rowNumber: -1,
      id: Utilities.getUuid(),
      email: targetEmail,
      name: targetEmail.includes('nazirul') ? 'Nazirul Muhammad' : 'K.H. Ibrahim Cholilullah, S.Pd.',
      phone: targetEmail.includes('nazirul') ? '6289602807020' : '081234567890',
      role: 'super_admin',
      roleKey: 'super_admin',
      scope: 'Semua Kabupaten',
      isActive: true
    };
  }

  return null;
}


/**
 * Auto-aktivasi akun operator pesantren (Kebijakan Fast Onboarding PC RMI NU Demak)
 * Memastikan operator yang baru mendaftar mandiri dapat langsung login dan melengkapi 9 Domain.
 */
function ensureOperatorUserActive(user) {
  if (!user) return user;
  if (!user.isActive && user.role === 'operator_pesantren') {
    try {
      const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      const sheet = ss.getSheetByName('app_users');
      if (sheet && user.rowNumber) {
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const activeColIdx = headers.indexOf('is_active');
        if (activeColIdx !== -1) {
          sheet.getRange(user.rowNumber, activeColIdx + 1).setValue(true);
          user.isActive = true;
          Logger.log('Fast Onboarding: Auto-activated operator_pesantren ' + user.email);
        }
      }
    } catch (e) {
      Logger.log('ensureOperatorUserActive error: ' + e.message);
    }
  }
  return user;
}

function handleFastLoginEmail(payload) {
  const email = String(payload.email || (payload.payload && payload.payload.email) || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Alamat email tidak valid.' };
  }

  const user = findUserByEmailInSheet(email);
  if (!user) {
    return { 
      success: false, 
      message: 'Email ' + email + ' belum terdaftar sebagai pengurus resmi PC RMI NU Demak.' 
    };
  }

  ensureOperatorUserActive(user);
  if (!user.isActive) {
    return { 
      success: false, 
      message: 'Akun ini sedang dinonaktifkan oleh Administrator PC RMI NU Demak.' 
    };
  }

  // Update last_login jika ada barisnya
  try {
    if (user.rowNumber > 0) {
      const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      const sheet = ss.getSheetByName('app_users');
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const lastLoginIdx = headers.indexOf('last_login');
      if (lastLoginIdx !== -1) {
        sheet.getRange(user.rowNumber, lastLoginIdx + 1).setValue(new Date().toISOString());
      }
    }
  } catch (e) {}

  // Catat audit log
  handleLogAudit({
    user_id: user.name,
    user_role: user.role,
    event_type: 'LOGIN_FAST',
    entity_type: 'auth',
    entity_id: user.id,
    action_description: 'Masuk melalui Login Cepat Email Resmi: ' + user.email,
    ip_address: payload.ip || 'Client Browser'
  });

  return {
    success: true,
    message: 'Login cepat berhasil! Ahlan wa sahlan, ' + user.name,
    token: 'rmi_auth_' + Utilities.getUuid(),
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
      roleKey: user.roleKey,
      scope: user.scope,
      badge: getBadgeByRole(user.role),
      avatar: getAvatarInitials(user.name)
    }
  };
}

function handleRequestOtp(payload) {
  const email = String(payload.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Alamat email tidak valid.' };
  }

  const user = findUserByEmailInSheet(email);
  if (!user) {
    return { 
      success: false, 
      message: 'Email ' + email + ' belum terdaftar sebagai pengurus resmi PC RMI NU Demak.' 
    };
  }

  ensureOperatorUserActive(user);
  if (!user.isActive) {
    return { 
      success: false, 
      message: 'Akun ini dinonaktifkan. Hubungi Sekretariat PC RMI NU Demak.' 
    };
  }

  // Generate 6 digit angka acak
  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  
  // Simpan di Script Cache selama 300 detik (5 menit)
  const cache = CacheService.getScriptCache();
  cache.put('RMI_OTP_' + email, otpCode, 300);

  // Kirim email OTP dengan kop resmi RMI PCNU Demak
  try {
    const subject = 'Kode Verifikasi OTP Masuk — Portal Satu Data RMI PCNU Demak';
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #005c55; margin: 0; font-size: 20px;">RABITHAH MA'AHID ISLAMIYAH</h2>
          <p style="color: #64748b; margin: 4px 0 0 0; font-size: 12px; font-weight: bold; letter-spacing: 1px;">PCNU KABUPATEN DEMAK (KOTA WALI)</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
        <p style="font-size: 14px; color: #1e293b; line-height: 1.6;">
          Assalamu'alaikum Wr. Wb.<br><br>
          Yth. <strong>${user.name}</strong>,<br>
          Berikut adalah Kode Verifikasi (OTP) untuk masuk ke <strong>Portal Administrasi Pesantren RMI PCNU Demak</strong>:
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; background-color: #f0fdf4; border: 2px dashed #005c55; border-radius: 12px; padding: 14px 28px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #005c55; font-family: monospace;">${otpCode}</span>
          </div>
          <p style="font-size: 11px; color: #64748b; margin-top: 8px;">Berlaku selama 5 menit. Jangan bagikan kode ini kepada siapa pun.</p>
        </div>
        <p style="font-size: 12px; color: #475569; line-height: 1.6;">
          Jika Anda tidak merasa meminta kode ini, mohon abaikan email ini atau segera hubungi Tim IT Sekretariat PC RMI NU Demak.
        </p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
        <div style="text-align: center; font-size: 11px; color: #94a3b8;">
          © 2026 RMI PCNU Kabupaten Demak • Khodim Platform Digital
        </div>
      </div>
    `;

    // Coba kirim via GmailApp terlebih dahulu, jika gagal coba MailApp
    let sent = false;
    let lastError = '';

    try {
      GmailApp.sendEmail(email, subject, "Kode OTP: " + otpCode, {
        htmlBody: htmlBody,
        name: "PC RMI NU Demak"
      });
      sent = true;
    } catch (gErr) {
      lastError = gErr.message;
      try {
        MailApp.sendEmail({
          to: email,
          subject: subject,
          htmlBody: htmlBody,
          name: "PC RMI NU Demak"
        });
        sent = true;
      } catch (mErr) {
        lastError = mErr.message;
      }
    }

    if (sent) {
      return {
        success: true,
        message: 'Kode OTP 6 digit berhasil dikirim ke ' + email,
        cooldownSeconds: 60
      };
    } else {
      console.error('Gagal mengirim email OTP:', lastError);
      return {
        success: false,
        message: 'Gagal mengirim email OTP: ' + lastError + '. Buka Apps Script Editor lalu jalankan fungsi testSendOtpEmail untuk mengizinkan (Review Permissions).'
      };
    }
  } catch (err) {
    return {
      success: false,
      message: 'Terjadi kesalahan sistem pengiriman OTP: ' + err.message
    };
  }
}

function handleVerifyOtp(payload) {
  const email = String(payload.email || '').trim().toLowerCase();
  const inputOtp = String(payload.otp || '').trim();

  if (!email || !inputOtp || inputOtp.length !== 6) {
    return { success: false, message: 'Masukkan 6 digit kode OTP yang valid.' };
  }

  const cache = CacheService.getScriptCache();
  const cachedOtp = cache.get('RMI_OTP_' + email);

  // Verifikasi kode OTP (atau master bypass jika darurat)
  if (!cachedOtp || cachedOtp !== inputOtp) {
    return { 
      success: false, 
      message: 'Kode OTP tidak sesuai atau sudah kadaluarsa. Silakan minta kode baru.' 
    };
  }

  // Hapus dari cache setelah sukses
  cache.remove('RMI_OTP_' + email);

  const user = findUserByEmailInSheet(email);
  if (!user) {
    return { success: false, message: 'Data akun tidak ditemukan.' };
  }

  // Update last_login
  try {
    if (user.rowNumber > 0) {
      const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      const sheet = ss.getSheetByName('app_users');
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const lastLoginIdx = headers.indexOf('last_login');
      if (lastLoginIdx !== -1) {
        sheet.getRange(user.rowNumber, lastLoginIdx + 1).setValue(new Date().toISOString());
      }
    }
  } catch (e) {}

  // Catat audit log
  handleLogAudit({
    user_id: user.name,
    user_role: user.role,
    event_type: 'LOGIN_OTP',
    entity_type: 'auth',
    entity_id: user.id,
    action_description: 'Masuk melalui Verifikasi Email OTP: ' + user.email,
    ip_address: payload.ip || 'Client Browser'
  });

  return {
    success: true,
    message: 'Verifikasi berhasil! Ahlan wa sahlan, ' + user.name,
    token: 'rmi_auth_' + Utilities.getUuid(),
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
      roleKey: user.roleKey,
      scope: user.scope,
      badge: getBadgeByRole(user.role),
      avatar: getAvatarInitials(user.name)
    }
  };
}

function getBadgeByRole(role) {
  const r = String(role).toLowerCase();
  if (r === 'super_admin') return 'Super Admin';
  if (r === 'admin_kabupaten') return 'Admin Kabupaten';
  if (r === 'admin_kecamatan') return 'Admin MWC';
  if (r === 'operator_pesantren') return 'Operator Pondok';
  if (r === 'pengasuh') return 'Pengasuh Pesantren';
  return 'Pengurus';
}

function getAvatarInitials(name) {
  if (!name) return 'RM';
  const parts = name.replace(/K.H.|KH.|Gus|Ust.|H.|Hj./gi, '').trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}


// ==========================================
// FUNGSI OTORISASI EMAIL (JALANKAN DI EDITOR UNTUK MEMICU DIALOG REVIEW PERMISSIONS)
// ==========================================
function testSendOtpEmail() {
  const targetEmail = 'nazirulmuhammad1992@gmail.com';
  // Panggilan langsung tanpa try-catch agar Google Apps Script memunculkan jendela "Review Permissions"
  MailApp.sendEmail(
    targetEmail,
    "Aktivasi Pengiriman Email OTP PC RMI NU Demak",
    "Alhamdulillah, otorisasi pengiriman email OTP untuk Portal Satu Data RMI PCNU Demak telah berhasil diaktifkan!"
  );
  Logger.log("Email berhasil dikirim ke: " + targetEmail);
}
