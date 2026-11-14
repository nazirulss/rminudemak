# APPS SCRIPT BACKEND SPECIFICATION
## DEMAK PESANTREN DATA & DEVELOPMENT

**Dokumen:** Apps Script Backend Specification  
**Versi:** 1.0  
**Status:** Draft Spesifikasi Teknis — Menunggu Review dan Persetujuan  
**Tahap:** Sprint 02C — Backend Prototype Foundation  
**Platform awal:** Google Apps Script + Google Sheets  
**Arah migrasi:** Node.js API + PostgreSQL (sesuai keputusan arsitektur final yang akan disahkan)

---

## 1. Tujuan Dokumen

Dokumen ini menetapkan spesifikasi backend berbasis Google Apps Script untuk mendukung sistem pendataan, pemetaan, profiling, dan penguatan tata kelola pesantren Kabupaten Demak.

Backend menjadi lapisan layanan yang menghubungkan antarmuka pengguna dengan Google Sheets sebagai penyimpanan data awal. Implementasi harus menjaga pemisahan antara antarmuka, aturan bisnis, validasi, otorisasi, dan akses data.

Prototype ini bukan sekadar kumpulan fungsi CRUD. Struktur kode, kontrak layanan, dan aturan bisnis harus dirancang agar dapat dipindahkan secara bertahap ke backend Node.js tanpa mengubah konsep data dan alur kerja utama.

## 2. Status Keputusan dan Batasan

### 2.1 Keputusan dasar yang menjadi acuan

1. Program mencakup seluruh pesantren di Kabupaten Demak, bukan hanya anggota RMI NU.
2. Setiap pesantren memperoleh ID internal RMI dengan format `RMI-DMK-000001`.
3. ID bersifat permanen, unik, tidak boleh digunakan ulang, dan bukan nomor registrasi atau akreditasi pemerintah.
4. NSPP dan EMIS disimpan sebagai referensi identitas eksternal yang terpisah.
5. Pendataan menggunakan model hybrid: tim RMI membuat/mengidentifikasi data awal, kemudian operator pesantren dapat melengkapi atau memperbarui data sesuai kewenangannya.
6. Google Sheets digunakan sebagai database prototype awal.
7. Data individu santri tidak termasuk ruang lingkup database institusi tahap awal.
8. Data publikasi harus dibedakan dari data internal dan data terbatas.
9. Persetujuan publikasi harus tersedia sebelum data institusi ditampilkan secara publik.
10. Setiap perubahan penting harus dapat ditelusuri melalui audit log dan riwayat data.

### 2.2 Hal yang belum dianggap final

- Nama dan jumlah kolom final pada setiap worksheet.
- Nama project Google Apps Script dan akun pemiliknya.
- Domain admin dan mekanisme autentikasi produksi.
- Kebijakan retensi data dan jadwal backup final.
- Integrasi Google Maps/geocoding dan layanan eksternal.
- Mekanisme notifikasi email/WhatsApp.
- Keputusan final hosting dan arsitektur migrasi.

**Penting:** Dokumen Sprint 02B dan Database Dictionary harus direkonsiliasi sebelum implementasi. Spesifikasi ini menggunakan 24 worksheet pada rancangan Sprint 02B sebagai baseline logis, bukan pengganti Database Dictionary. Jika terdapat perbedaan nama tabel, kolom, tipe data, atau relasi, Database Dictionary yang telah disahkan menjadi sumber kebenaran.

## 3. Ruang Lingkup Backend v1.0

### 3.1 Termasuk

- Pemeriksaan konfigurasi dan koneksi spreadsheet.
- Pembacaan dan penulisan data melalui repository layer.
- Pembuatan record pesantren.
- Penerbitan ID internal RMI secara aman.
- Pembaruan profil pesantren.
- Pengelolaan lokasi, pengasuh, kontak, legalitas, pendidikan, sumber daya, fasilitas, program, dan profil pengembangan.
- Pengelolaan akun pengguna dan penugasan akses.
- Alur verifikasi data.
- Status kelengkapan data dan status publikasi.
- Pencatatan riwayat perubahan dan audit log.
- Pencarian, filter, pagination, ringkasan dashboard, dan ekspor terbatas.
- Validasi input dan penanganan error terstandar.
- Fungsi administrasi untuk pemeriksaan integritas data.

### 3.2 Tidak termasuk

- Pendataan nama, NIK, alamat, atau data pribadi santri.
- Sistem penanganan kasus perlindungan santri.
- Sistem keuangan, pembayaran, atau donasi.
- Penilaian akreditasi atau penerbitan status legal pemerintah.
- Publikasi otomatis tanpa persetujuan.
- Integrasi WhatsApp gateway berbayar.
- Migrasi produksi ke Node.js/PostgreSQL.
- Penggantian desain antarmuka atau perubahan domain tanpa persetujuan.

## 4. Arsitektur Aplikasi

### 4.1 Arsitektur prototype

```text
Admin / Operator Pesantren
          |
          v
Web Interface
(HTML + CSS + JavaScript)
          |
          v
Google Apps Script
  - Entry point
  - Authentication adapter
  - Authorization / RBAC
  - Validation
  - Business services
  - Repositories
  - Audit & logging
          |
          v
Google Sheets
  - Master data
  - Reference data
  - User assignments
  - Verification records
  - Audit history
```

### 4.2 Prinsip arsitektur

1. UI tidak boleh mengakses worksheet secara langsung.
2. Semua operasi data melewati service layer.
3. Service layer tidak boleh mengandung detail teknis pembacaan sel secara tersebar.
4. Repository menjadi satu-satunya lapisan yang berinteraksi langsung dengan Google Sheets.
5. Validasi dan otorisasi dilakukan di server, bukan hanya di browser.
6. Fungsi sensitif harus memeriksa identitas dan kewenangan pemanggil pada setiap permintaan.
7. Tidak boleh mengandalkan nama tombol atau menu tersembunyi sebagai mekanisme keamanan.
8. Gunakan konfigurasi terpusat; hindari ID spreadsheet dan nama sheet yang tersebar di banyak file.
9. Setiap operasi tulis penting harus menghasilkan audit log.
10. Kontrak fungsi dibuat netral terhadap platform agar dapat diimplementasikan ulang di Node.js.

### 4.3 Catatan model deployment

Apps Script dapat dijalankan sebagai Web App atau sebagai layanan internal yang dipanggil oleh komponen lain. Pilihan deployment harus ditetapkan setelah model autentikasi dan kebutuhan domain diputuskan.

Jangan menganggap `Session.getActiveUser().getEmail()` selalu tersedia. Ketersediaannya bergantung pada jenis akun, domain, dan konfigurasi deployment. Jangan menggunakan email kosong sebagai identitas yang sah.

Jika antarmuka berada di luar Apps Script, CORS, autentikasi, dan pembatasan akses harus diuji secara khusus. Jangan menaruh token rahasia atau credential Google di JavaScript frontend.

## 5. Struktur Modul Backend

Struktur konseptual file Apps Script:

```text
apps-script/
├── appsscript.json
├── 00_Config.gs
├── 01_Constants.gs
├── 02_Utils.gs
├── 03_Response.gs
├── 04_Validation.gs
├── 05_AuthService.gs
├── 06_AuthorizationService.gs
├── 07_SpreadsheetRepository.gs
├── 08_IdService.gs
├── 09_PesantrenService.gs
├── 10_ProfileServices.gs
├── 11_UserService.gs
├── 12_VerificationService.gs
├── 13_PublicationService.gs
├── 14_SearchService.gs
├── 15_DashboardService.gs
├── 16_ExportService.gs
├── 17_AuditService.gs
├── 18_AdminService.gs
├── 19_Router.gs
└── 20_Test.gs
```

Nama file dapat disesuaikan dengan batasan editor Apps Script, tetapi tanggung jawab modul harus tetap dipisahkan.

### 5.1 Tanggung jawab modul

| Modul | Tanggung jawab |
|---|---|
| Config | Membaca konfigurasi dan Script Properties |
| Constants | Nama worksheet, status, role, dan konstanta sistem |
| Utils | Normalisasi string, tanggal, ID, dan helper umum |
| Response | Format respons sukses dan gagal yang konsisten |
| Validation | Validasi format, field wajib, panjang, enum, dan relasi |
| AuthService | Mengidentifikasi pengguna dan status akun |
| AuthorizationService | Memeriksa role, assignment, dan cakupan akses |
| SpreadsheetRepository | Operasi baca/tulis Google Sheets |
| IdService | Penerbitan ID RMI secara terkunci dan unik |
| PesantrenService | Operasi inti master pesantren |
| ProfileServices | Operasi data turunan/profil pesantren |
| UserService | Pengguna, role, dan penugasan |
| VerificationService | Workflow verifikasi |
| PublicationService | Persetujuan dan status publikasi |
| SearchService | Pencarian, filter, dan pagination |
| DashboardService | Statistik agregat |
| ExportService | Ekspor data sesuai kewenangan |
| AuditService | Riwayat perubahan dan aktivitas |
| AdminService | Pemeriksaan sistem dan administrasi terbatas |
| Router | Memetakan action/API ke service yang sesuai |
| Test | Pengujian fungsi dan integrasi |

## 6. Kontrak Data dan Worksheet

Backend dirancang untuk baseline 24 worksheet berikut:

1. `pesantren`
2. `pesantren_locations`
3. `pesantren_leaders`
4. `pesantren_contacts`
5. `pesantren_legalities`
6. `pesantren_education`
7. `pesantren_resources`
8. `pesantren_facilities`
9. `pesantren_programs`
10. `pesantren_development_profiles`
11. `pesantren_verifications`
12. `pesantren_data_history`
13. `users`
14. `roles`
15. `user_assignments`
16. `districts`
17. `villages`
18. `data_sources`
19. `publication_consents`
20. `annual_snapshots`
21. `document_files`
22. `audit_logs`
23. `id_sequences`
24. `system_settings`

### 6.1 Aturan repository

- Setiap worksheet memiliki header yang dikelola secara eksplisit.
- Repository harus memetakan nama kolom ke indeks kolom saat runtime atau saat inisialisasi; jangan mengandalkan nomor kolom hard-coded di business service.
- Header yang hilang, duplikat, atau tidak sesuai harus menghasilkan error konfigurasi dan menghentikan operasi tulis.
- Jangan membuat worksheet atau kolom secara otomatis pada setiap request.
- Perubahan skema hanya melalui prosedur migrasi skema yang disengaja dan terdokumentasi.
- Gunakan ID record internal yang stabil untuk relasi antartabel; jangan menggunakan nomor baris sebagai foreign key.
- Simpan tanggal dalam format konsisten, idealnya ISO 8601, dan tetapkan timezone sistem secara eksplisit.
- Nilai enum harus divalidasi di backend.
- Field yang tidak tersedia dalam Dictionary tidak boleh ditambahkan sepihak.

### 6.2 Operasi repository minimum

```javascript
getSheet_(sheetName)
getHeaderMap_(sheetName)
findById_(sheetName, id)
findMany_(sheetName, filters, options)
insert_(sheetName, record)
updateById_(sheetName, id, patch)
softDeleteById_(sheetName, id, actor)
appendAuditLog_(event)
```

Fungsi di atas adalah kontrak konseptual. Implementasi harus menangani worksheet kosong, data tidak ditemukan, header tidak valid, dan kegagalan layanan Google.

### 6.3 Konsistensi data

Google Sheets tidak menyediakan transaksi database relasional penuh. Karena itu:

- Hindari operasi multi-sheet yang memerlukan atomic transaction.
- Jika satu proses harus menulis ke beberapa sheet, gunakan pola status proses, validasi sebelum menulis, dan mekanisme kompensasi jika langkah berikutnya gagal.
- Catat setiap tahap operasi penting.
- Gunakan `LockService` untuk penerbitan ID dan operasi yang rawan benturan.
- Jangan mengasumsikan `appendRow()` saja cukup untuk menjamin keunikan.
- Untuk data relasional, pastikan parent record valid sebelum membuat child record.
- Lakukan pemeriksaan integritas berkala untuk orphan records dan duplikasi ID.

## 7. Standar ID Pesantren

### 7.1 Format

```text
RMI-DMK-000001
RMI-DMK-000002
RMI-DMK-000003
```

### 7.2 Aturan

1. ID hanya diterbitkan oleh backend.
2. ID tidak boleh ditentukan oleh browser atau operator.
3. ID tidak boleh berubah setelah diterbitkan.
4. ID yang sudah pernah diterbitkan tidak boleh digunakan ulang, termasuk ketika record diarsipkan atau dinonaktifkan.
5. Penerbitan harus menggunakan `LockService` untuk mencegah dua request memperoleh nomor yang sama.
6. Sequence disimpan di `id_sequences` atau mekanisme terpusat yang disepakati.
7. Sebelum mengeluarkan ID, backend memeriksa bahwa ID tersebut belum digunakan.
8. Kegagalan pembuatan record setelah nomor dialokasikan dapat menyebabkan nomor terlewati; nomor yang terlewati tidak boleh dipakai ulang.

### 7.3 Pseudocode penerbitan ID

```javascript
function issuePesantrenId_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const current = readCurrentSequence_();
    const next = current + 1;
    const candidate = "RMI-DMK-" + String(next).padStart(6, "0");

    if (pesantrenIdExists_(candidate)) {
      throw new Error("ID_COLLISION");
    }

    saveCurrentSequence_(next);
    return candidate;
  } finally {
    lock.releaseLock();
  }
}
```

Pseudocode ini belum merupakan implementasi siap produksi. Pembacaan dan penyimpanan sequence harus dibuat konsisten terhadap format Dictionary dan diuji dengan request bersamaan.

## 8. Authentication dan RBAC

### 8.1 Role awal

| Role | Cakupan umum |
|---|---|
| Super Admin | Seluruh konfigurasi dan data sistem |
| Admin Kabupaten | Seluruh data pesantren Kabupaten Demak |
| Admin Kecamatan | Data pesantren dalam kecamatan yang ditugaskan |
| Operator Pesantren | Data pesantren yang secara eksplisit ditugaskan |

Role adalah baseline. Penetapan hak akses detail harus disahkan dalam matriks permission terpisah.

### 8.2 Prinsip otorisasi

- Default deny: akses ditolak kecuali secara eksplisit diizinkan.
- Role tidak otomatis memberikan akses ke semua record.
- Admin Kecamatan harus memiliki assignment kecamatan yang valid.
- Operator Pesantren hanya dapat mengakses record pesantren yang ditugaskan.
- User nonaktif atau assignment nonaktif tidak dapat melakukan operasi.
- Super Admin harus menggunakan akun individual, bukan akun bersama.
- Hak ekspor, penghapusan, perubahan role, dan persetujuan publikasi harus dibatasi secara khusus.
- Pemeriksaan dilakukan pada setiap service yang mengubah atau membaca data terbatas.

### 8.3 Autentikasi Apps Script

Pilihan autentikasi belum final. Sebelum implementasi, tetapkan satu model yang dapat diverifikasi:

**Opsi A — Google Workspace/domain-controlled:** cocok jika seluruh pengguna berada dalam domain Google Workspace yang dikelola dan identitas email dapat dibaca secara konsisten.

**Opsi B — Identity provider eksternal:** autentikasi dikelola penyedia identitas, lalu backend memverifikasi token secara server-side. Jangan menerima email atau role yang dikirim mentah oleh browser sebagai bukti identitas.

**Opsi C — Akses internal terbatas:** hanya untuk uji coba oleh tim kecil, dengan pembatasan akun dan data non-produksi. Opsi ini bukan dasar peluncuran publik.

Jangan membuat sistem password sendiri dengan menyimpan password plaintext atau hash buatan sendiri di Google Sheets. Jangan menggunakan shared secret statis yang ditanam di frontend.

### 8.4 Identitas pengguna

Setiap request terotorisasi harus menghasilkan konteks pengguna server-side:

```javascript
{
  userId: "USR-...",
  email: "operator@example.org",
  role: "OPERATOR_PESANTREN",
  assignedPesantrenIds: ["RMI-DMK-000001"],
  assignedDistrictIds: [],
  isActive: true
}
```

Objek di atas adalah ilustrasi kontrak, bukan nilai atau skema kolom final.

## 9. Business Services dan Aturan Operasi

### 9.1 PesantrenService

Operasi minimum:

- `createPesantren(payload, actor)`
- `getPesantrenById(pesantrenId, actor)`
- `listPesantren(filters, pagination, actor)`
- `updatePesantren(pesantrenId, patch, actor)`
- `archivePesantren(pesantrenId, reason, actor)`

Aturan:
- Record baru memiliki status awal yang ditentukan oleh workflow.
- ID internal diterbitkan server-side.
- Field sistem seperti ID, created timestamp, creator, dan status verifikasi tidak boleh ditimpa oleh payload pengguna.
- Perubahan identitas inti memerlukan validasi tambahan dan dapat memerlukan verifikasi ulang.
- Pengarsipan bukan penghapusan permanen.

### 9.2 ProfileServices

Mengelola record turunan yang terkait dengan pesantren, termasuk lokasi, pengasuh, kontak, legalitas, pendidikan, sumber daya, fasilitas, program, dan profil pengembangan.

Aturan:
- Setiap record turunan harus memiliki relasi ke ID pesantren yang valid.
- Operator hanya dapat mengubah record turunan milik pesantrennya.
- Perubahan data legalitas atau identitas penting dapat memicu status perlu diverifikasi ulang.
- Jumlah santri dan tenaga pendidik dicatat sebagai agregat institusi, bukan data individu.

### 9.3 VerificationService

Status verifikasi minimal harus dibedakan dari status pengisian data. Baseline status yang dapat dipertimbangkan:

- `NOT_SUBMITTED`
- `SUBMITTED`
- `IN_REVIEW`
- `NEEDS_REVISION`
- `VERIFIED`
- `REJECTED`

Alur konseptual:

```text
Draft
  |
  v
Submitted
  |
  v
In Review
  |-------------------|
  v                   v
Needs Revision      Verified
  |                   |
  v                   v
Resubmitted         Published eligibility
```

Ketentuan:
- Hanya petugas yang memiliki permission verifikasi yang dapat mengubah status verifikasi.
- Setiap keputusan verifikasi wajib menyimpan aktor, waktu, hasil, dan catatan.
- `VERIFIED` berarti telah diperiksa secara administratif oleh RMI, bukan akreditasi atau pengesahan pemerintah.
- Data yang direvisi setelah verifikasi dapat kembali ke status pemeriksaan sesuai kebijakan.
- Status final dan nama enum harus diselaraskan dengan Dictionary sebelum coding.

### 9.4 PublicationService

Status publikasi harus terpisah dari status verifikasi.

Syarat publikasi:
1. Record memenuhi standar data minimum.
2. Data telah melalui pemeriksaan yang diwajibkan.
3. Persetujuan publikasi yang relevan tersedia.
4. Tidak ada field internal atau terbatas yang ikut terkirim.
5. Status publikasi diaktifkan oleh role yang berwenang.

Backend publik harus menggunakan allowlist field. Jangan mengirim seluruh row spreadsheet lalu menyembunyikan field sensitif di frontend.

### 9.5 UserService

- Membuat atau mengundang pengguna sesuai model autentikasi terpilih.
- Mengaktifkan/menonaktifkan akun.
- Menetapkan role.
- Menetapkan cakupan kecamatan atau pesantren.
- Mencabut assignment.
- Mencatat perubahan role dan assignment ke audit log.

Pengguna tidak boleh menaikkan role atau mengubah assignment dirinya sendiri.

### 9.6 DashboardService

Menyediakan agregat, misalnya:
- jumlah pesantren terdaftar;
- jumlah per kecamatan;
- status pengisian data;
- status verifikasi;
- status validasi lokasi;
- jumlah data yang perlu diperbarui.

Dashboard tidak boleh menampilkan data terbatas kepada role yang tidak berwenang. Angka agregat harus dihitung dari record aktif dan definisi status yang terdokumentasi.

## 10. API / Action Contract

Untuk menjaga kompatibilitas lintas platform, frontend berkomunikasi menggunakan action contract yang konsisten.

### 10.1 Daftar action konseptual

| Domain | Action | Akses |
|---|---|---|
| System | `system.health` | Admin |
| Auth | `auth.me` | Pengguna terautentikasi |
| Pesantren | `pesantren.create` | Admin sesuai cakupan |
| Pesantren | `pesantren.get` | Sesuai cakupan |
| Pesantren | `pesantren.list` | Sesuai cakupan |
| Pesantren | `pesantren.update` | Sesuai cakupan |
| Pesantren | `pesantren.archive` | Permission khusus |
| Profile | `profile.upsert` | Sesuai cakupan |
| Verification | `verification.submit` | Operator / Admin |
| Verification | `verification.review` | Verifikator |
| Publication | `publication.request` | Sesuai kebijakan |
| Publication | `publication.approve` | Permission khusus |
| Users | `users.list` | Admin |
| Users | `users.assign` | Admin berwenang |
| Dashboard | `dashboard.summary` | Sesuai cakupan |
| Export | `export.pesantren` | Permission ekspor |
| Admin | `admin.integrityCheck` | Super Admin |

Daftar ini adalah kontrak awal. Action final harus diuji terhadap kebutuhan UI dan matriks permission.

### 10.2 Format request

```json
{
  "action": "pesantren.get",
  "requestId": "req-unique-id",
  "payload": {
    "pesantrenId": "RMI-DMK-000001"
  }
}
```

Jangan menaruh `role`, `userId`, atau `isAdmin` dari browser sebagai sumber otorisasi. Identitas dan role harus diperoleh atau diverifikasi di server.

### 10.3 Format response sukses

```json
{
  "success": true,
  "requestId": "req-unique-id",
  "data": {},
  "meta": {
    "timestamp": "2026-11-13T10:00:00+07:00"
  }
}
```

### 10.4 Format response gagal

```json
{
  "success": false,
  "requestId": "req-unique-id",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data yang dikirim belum valid.",
    "details": []
  }
}
```

Pesan error untuk pengguna harus aman dan tidak membocorkan stack trace, credential, isi konfigurasi, atau data internal.

### 10.5 Transport

- Jika menggunakan Apps Script Web App, `doGet(e)` dan/atau `doPost(e)` menjadi entry point sesuai keputusan deployment.
- Untuk operasi yang mengubah data, utamakan POST.
- Jangan menganggap endpoint Apps Script setara dengan REST server penuh.
- Uji format request/response, redirect, autentikasi, dan konsumsi `fetch()` dari domain frontend.
- Bila keterbatasan transport Apps Script menghambat kebutuhan keamanan atau integrasi, hentikan dan evaluasi arsitektur sebelum menambah workaround.

## 11. Validasi Input

Validasi dilakukan di server pada seluruh data masuk.

Jenis validasi:
- required / optional;
- tipe data;
- panjang minimum dan maksimum;
- format email, nomor telepon, URL, dan tanggal;
- nilai enum;
- rentang angka;
- konsistensi antarfield;
- keberadaan foreign key;
- hak akses terhadap record;
- duplikasi identitas;
- sanitasi teks untuk mencegah konten berbahaya saat ditampilkan.

Prinsip:
- Jangan hanya mengandalkan HTML form validation.
- Jangan menyimpan formula yang berasal dari input pengguna sebagai formula spreadsheet.
- Perlakukan input pengguna sebagai data tidak tepercaya.
- Hindari membangun query atau ekspresi dari string input tanpa validasi.
- Normalisasi nomor telepon dan teks sesuai kebijakan data yang disahkan.
- Jangan mengubah data asli secara diam-diam; simpan nilai normalisasi secara konsisten sesuai Dictionary.

## 12. Audit Log dan Riwayat Data

### 12.1 Aktivitas yang wajib dicatat

- Login atau kegagalan autentikasi yang relevan.
- Pembuatan pesantren.
- Perubahan data inti.
- Perubahan record turunan.
- Penerbitan ID.
- Perubahan role dan assignment.
- Pengajuan, pemeriksaan, dan keputusan verifikasi.
- Persetujuan atau pencabutan publikasi.
- Ekspor data.
- Pengarsipan.
- Perubahan konfigurasi penting.

### 12.2 Informasi audit minimum

- ID event;
- timestamp;
- actor/user ID;
- action;
- entity type;
- entity ID;
- hasil operasi;
- ringkasan perubahan atau referensi perubahan;
- request ID;
- alasan/catatan jika diwajibkan.

Jangan menulis password, token, secret, atau data pribadi berlebihan ke log. Batasi akses ke `audit_logs` dan `pesantren_data_history`.

## 13. Keamanan dan Perlindungan Data

Kontrol minimum sebelum digunakan dengan data nyata:

1. Autentikasi yang dapat diverifikasi server-side.
2. RBAC dan pemeriksaan assignment pada setiap operasi.
3. Default deny.
4. Spreadsheet tidak dibagikan secara publik.
5. Script Properties untuk konfigurasi sensitif yang sesuai; jangan menaruh secret di source frontend.
6. Validasi semua input.
7. Batasi ukuran dan tipe file jika upload diaktifkan.
8. Validasi izin akses sebelum membaca atau mengunduh file Drive.
9. Gunakan ID file, bukan URL publik yang dapat ditebak, untuk referensi dokumen privat.
10. Audit log untuk operasi penting.
11. Rate limiting atau kontrol penyalahgunaan yang realistis untuk deployment Apps Script.
12. Backup terjadwal dan uji restore.
13. Pisahkan development, testing, dan production.
14. Jangan menggunakan data nyata pada lingkungan uji tanpa izin dan perlindungan yang sesuai.
15. Jangan menyimpan data individu santri pada sistem pendataan institusi tahap awal.
16. Jangan mempublikasikan koordinat atau kontak personal tanpa dasar persetujuan yang sesuai.

Apps Script memiliki kuota, batas eksekusi, dan keterbatasan concurrency. Sistem harus meminimalkan pembacaan/penulisan sel satu per satu, menggunakan operasi batch, dan memantau kegagalan akibat quota.

## 14. Performa dan Skalabilitas

- Baca range dalam batch menggunakan `getValues()`.
- Tulis data secara batch menggunakan `setValues()` jika memungkinkan.
- Hindari pemanggilan Spreadsheet service berulang di dalam loop.
- Gunakan `CacheService` hanya untuk data referensi atau ringkasan yang aman dan dapat kedaluwarsa.
- Jangan menggunakan cache sebagai sumber kebenaran untuk permission atau status kritis.
- Terapkan pagination pada daftar pesantren.
- Terapkan filter di repository/service dan batasi jumlah hasil.
- Hindari mengirim seluruh database ke browser.
- Catat durasi operasi penting dan error rate.
- Tetapkan batas ukuran ekspor dan gunakan proses bertahap bila diperlukan.

Google Sheets sesuai untuk prototype dan volume kerja terbatas. Jika beban, concurrency, atau kebutuhan transaksi meningkat melampaui batas yang dapat diterima, migrasi ke database relasional harus diprioritaskan.

## 15. Error Handling

Kode error awal:

| Kode | Makna |
|---|---|
| `AUTH_REQUIRED` | Pengguna belum terautentikasi |
| `AUTH_INVALID` | Identitas/token tidak valid |
| `ACCESS_DENIED` | Tidak memiliki izin |
| `VALIDATION_ERROR` | Input tidak valid |
| `NOT_FOUND` | Record tidak ditemukan |
| `DUPLICATE_RECORD` | Data terindikasi duplikat |
| `SCHEMA_MISMATCH` | Header/struktur sheet tidak sesuai |
| `ID_GENERATION_FAILED` | Penerbitan ID gagal |
| `CONFLICT` | Perubahan bertabrakan dengan kondisi data |
| `QUOTA_EXCEEDED` | Kuota layanan terlampaui |
| `INTERNAL_ERROR` | Kesalahan internal |

Aturan:
- Error internal dicatat secara aman.
- Pengguna menerima pesan yang dapat ditindaklanjuti.
- Jangan mengembalikan detail stack trace ke browser.
- Setiap error harus memiliki request ID agar dapat ditelusuri.
- Operasi gagal tidak boleh dilaporkan sebagai berhasil.

## 16. Backup, Restore, dan Pemulihan

Sebelum penggunaan operasional:
- Tetapkan pemilik backup.
- Tetapkan frekuensi backup dan retensi.
- Simpan salinan backup pada lokasi terpisah dengan akses terbatas.
- Dokumentasikan cara memulihkan spreadsheet.
- Uji restore secara berkala pada salinan, bukan langsung pada produksi.
- Pastikan file Drive terkait juga masuk dalam kebijakan backup.
- Catat waktu backup dan hasil pemeriksaan.

Backup yang belum pernah diuji restore belum dapat dianggap sebagai mekanisme pemulihan yang terbukti.

## 17. Strategi Migrasi ke Node.js

Apps Script harus menjadi implementasi awal dari kontrak layanan, bukan pusat aturan bisnis yang tidak terdokumentasi.

### 17.1 Prinsip portabilitas

- Pisahkan business rules dari API transport.
- Gunakan nama action dan bentuk payload yang stabil.
- Gunakan ID record, bukan row number.
- Dokumentasikan validasi dan enum.
- Pisahkan repository dari service.
- Hindari ketergantungan pada objek Apps Script di business service.
- Jangan menjadikan fungsi global Apps Script sebagai kontrak permanen frontend.

### 17.2 Target evolusi

```text
Tahap Prototype
Frontend -> Apps Script Services -> Google Sheets

Tahap Transisi
Frontend -> API Adapter -> Apps Script / Node.js
                         -> Google Sheets

Tahap Backend Node.js
Frontend -> Node.js API -> Repository -> PostgreSQL
                                      -> Object Storage
```

Migrasi database dari Sheets ke PostgreSQL merupakan pekerjaan terpisah dengan mapping, validasi, rekonsiliasi, dan cutover plan tersendiri. Jangan melakukan migrasi otomatis hanya karena backend Node.js telah tersedia.

## 18. Rencana Implementasi Bertahap

### Phase A — Contract & Schema Validation

- Rekonsiliasi Database Dictionary dan Sprint 02B.
- Finalisasi nama worksheet dan header.
- Finalisasi enum dan relasi.
- Tetapkan autentikasi dan matriks permission.
- Tetapkan deployment model.

**Gate:** tidak boleh mulai coding CRUD sebelum kontrak data dan akses disetujui.

### Phase B — Core Foundation

- Konfigurasi project.
- Spreadsheet repository.
- Header/schema validator.
- Response/error handler.
- Utility dan validation.
- Health check.
- Unit test fungsi dasar.

### Phase C — Identity & Access

- Integrasi autentikasi.
- User context server-side.
- RBAC.
- User assignments.
- Pengujian akses lintas role.

**Gate:** tidak boleh memasukkan data nyata sebelum autentikasi dan otorisasi lolos uji.

### Phase D — Master Data

- Penerbitan ID.
- Create/read/update pesantren.
- Relasi data turunan.
- Pencarian dan pagination.
- Audit log.

### Phase E — Workflow

- Pengajuan data.
- Verifikasi dan revisi.
- Persetujuan publikasi.
- Dashboard agregat.
- Ekspor terbatas.

### Phase F — Hardening

- Uji keamanan.
- Uji concurrency ID.
- Uji kuota dan performa.
- Backup/restore.
- Uji regresi.
- Dokumentasi operasional.
- Persetujuan sebelum deployment.

## 19. Test Plan dan Acceptance Criteria

### 19.1 Functional tests

- [ ] Backend dapat membaca konfigurasi.
- [ ] Health check memberi respons yang benar.
- [ ] Schema validator mendeteksi sheet/header yang hilang.
- [ ] Pesantren dapat dibuat oleh role yang berwenang.
- [ ] ID diterbitkan dengan format yang benar.
- [ ] ID tidak duplikat pada request bersamaan.
- [ ] ID tidak dapat diubah melalui update biasa.
- [ ] Data dapat dibaca berdasarkan ID.
- [ ] Filter dan pagination menghasilkan data yang konsisten.
- [ ] Record turunan menolak parent ID yang tidak valid.
- [ ] Operator tidak dapat mengakses pesantren lain.
- [ ] Admin Kecamatan tidak dapat mengakses kecamatan di luar assignment.
- [ ] Verifikasi hanya dapat dilakukan role yang berwenang.
- [ ] Status verifikasi tidak otomatis mengaktifkan publikasi.
- [ ] Data publik hanya memuat field yang diizinkan.
- [ ] Perubahan penting tercatat dalam audit log.
- [ ] Ekspor dibatasi sesuai permission.

### 19.2 Security tests

- [ ] Request tanpa identitas ditolak.
- [ ] User nonaktif ditolak.
- [ ] Role palsu dari browser diabaikan.
- [ ] ID pesantren yang tidak berada dalam assignment ditolak.
- [ ] Input formula tidak dieksekusi sebagai formula.
- [ ] Error response tidak membocorkan secret.
- [ ] Spreadsheet tidak dapat diakses publik.
- [ ] File privat tidak dapat diunduh tanpa izin.
- [ ] Endpoint sensitif tidak dapat dipanggil tanpa otorisasi.

### 19.3 Operational tests

- [ ] Backup berhasil dibuat.
- [ ] Restore berhasil diuji pada salinan.
- [ ] Batas kuota dan kegagalan layanan ditangani.
- [ ] Logging dapat menelusuri request gagal.
- [ ] Pengujian dilakukan di lingkungan non-produksi.
- [ ] Rollback plan tersedia.

### 19.4 Definition of Done

Backend prototype dinyatakan siap untuk pilot terbatas hanya jika:
- kontrak data telah disahkan;
- autentikasi dan RBAC bekerja server-side;
- seluruh functional dan security tests kritis lulus;
- audit log aktif;
- backup dan restore telah diuji;
- tidak ada data sensitif yang terekspos;
- dokumentasi deployment dan rollback tersedia;
- pemilik program memberikan persetujuan eksplisit untuk pilot.

## 20. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Header sheet berubah manual | Backend gagal atau salah memetakan data | Schema validation dan kontrol perubahan |
| ID ganda | Identitas institusi tidak konsisten | LockService, sequence terpusat, collision check |
| Akses berdasarkan role frontend | Kebocoran data | Otorisasi server-side |
| Apps Script quota/concurrency | Layanan lambat atau gagal | Batch operations, pagination, monitoring |
| Penulisan multi-sheet parsial | Relasi data tidak konsisten | Workflow bertahap, audit, kompensasi |
| Akun pengguna tidak dapat diverifikasi | Akses tidak sah | Finalisasi model identity sebelum pilot |
| Spreadsheet dibagikan terlalu luas | Kebocoran data | Akses terbatas dan audit permission |
| Perubahan skema tanpa kontrol | Data rusak | Schema versioning dan migration procedure |
| Prototype berkembang tanpa batas | Biaya migrasi meningkat | Kontrak portabel dan batas waktu penggunaan Sheets |

## 21. Instruksi untuk Developer / AI Coding Agent

Sebelum menulis atau mengubah kode:

1. Baca dokumen ini secara lengkap.
2. Baca Technical Architecture & Database Blueprint yang disahkan.
3. Baca Database Dictionary v1.0 yang disahkan.
4. Baca Sprint 02B Google Sheets Database Template.
5. Audit project Google Sheets dan Apps Script yang sudah ada, jika tersedia.
6. Laporkan perbedaan antara dokumen dan kondisi aktual.
7. Jangan menebak nama kolom atau enum yang belum disahkan.
8. Buat implementation plan dan daftar file yang akan dibuat.
9. Minta persetujuan sebelum perubahan skema, model autentikasi, atau deployment.
10. Kerjakan bertahap dan jalankan test pada setiap tahap.

Jika ditemukan konflik:
- STOP;
- jelaskan konflik dan dampaknya;
- berikan opsi penyelesaian;
- tunggu keputusan pemilik proyek.

Developer/AI agent dilarang:
- mengubah struktur database tanpa persetujuan;
- menghapus atau menimpa data nyata;
- membuka spreadsheet ke publik;
- menaruh credential di frontend;
- melewati RBAC demi mempercepat demo;
- mengaktifkan publikasi otomatis;
- melakukan deployment produksi tanpa persetujuan terpisah.

## 22. Dokumen Turunan yang Dibutuhkan

Setelah spesifikasi ini disetujui, dokumen/artefak berikut perlu disiapkan:

1. Final Database Dictionary dan Schema Manifest.
2. RBAC Permission Matrix.
3. Authentication & Deployment Decision Record.
4. API Contract Specification.
5. Google Apps Script Project Scaffold.
6. Test Cases dan Test Results.
7. Deployment, Backup, dan Rollback Runbook.

---

## 23. Penutup

Apps Script Backend v1.0 ditujukan sebagai fondasi prototype yang disiplin, terukur, dan dapat diuji. Keberhasilan tidak diukur dari seberapa cepat CRUD selesai, melainkan dari konsistensi data, keamanan akses, keterlacakan perubahan, serta kesiapan migrasi.

**Status dokumen: Draft — belum menjadi izin implementasi atau deployment.**

Implementasi baru dapat dimulai setelah kontrak database, autentikasi, dan matriks permission direkonsiliasi serta disetujui.
