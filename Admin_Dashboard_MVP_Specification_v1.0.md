# ADMIN DASHBOARD MVP SPECIFICATION v1.1
## DEMAK PESANTREN DATA & DEVELOPMENT

**Pesantren Data Center — RMI NU Demak**
*(Diselaraskan dengan Standar Nasional Digdaya Pesantren PBNU)*

| Informasi | Keterangan |
|---|---|
| **Dokumen** | Admin Dashboard MVP Specification |
| **Versi** | 1.1 |
| **Status** | Disahkan sebagai Acuan Antarmuka & Fungsional |
| **Tahap** | Sprint 02D — Antarmuka Administrasi (Admin Dashboard MVP) |
| **Parent Documents** | `Technical_Architecture_Database_Blueprint_v1.0.md`<br>`Database_Dictionary_v1.1.md`<br>`Sprint_02B_Google_Sheets_Database_Template_v1.0.md`<br>`Apps_Script_Backend_Specification_v1.0.md` |
| **Penyelarasan Nasional** | Standar Portal Digdaya Pesantren PBNU (`pesantren.nu.id`) |
| **Platform Implementasi** | Frontend: HTML5, Modern CSS (Tailwind/Utility-based), Vanilla JavaScript (Modular ES6)<br>Backend Integrasi: Google Apps Script Web App (API Action Contract)<br>Penyimpanan Awal: Google Sheets (`PESANTREN_DATA_CENTER_MASTER_v1`) |
| **Target Evolusi** | Next.js / Node.js + Supabase PostgreSQL |

---

## 1. Tujuan Dokumen

Dokumen ini mendefinisikan spesifikasi fungsional, arsitektur antarmuka, tata letak interaksi, hierarki navigasi, aturan validasi sisi klien, serta integrasi kontrak API untuk **Admin Dashboard MVP (Minimum Viable Product)** pada platform Pesantren Data Center RMI PCNU Kabupaten Demak.

Admin Dashboard bertindak sebagai ruang kerja operasional terpadu bagi administrator kabupaten, pengurus cabang/kecamatan, dan operator pesantren untuk:
1. Mengidentifikasi dan menerbitkan identitas resmi pesantren se-Kabupaten Demak.
2. Memasukkan, memperbarui, dan melengkapi profil kelembagaan, lokasi, pengasuh, legalitas, santri (agregat), sarana prasarana, serta potensi pengembangan.
3. Memfasilitasi alur verifikasi administratif berjenjang secara objektif dan terstandar.
4. Memvalidasi akurasi geospasial lokasi pesantren.
5. Menghasilkan Buku Induk Pesantren dan rekapitulasi data agregat yang siap dianalisis dan diekspor.
6. Mengendalikan persetujuan publikasi data ke situs resmi `rminudemak.org`.

Dokumen ini menjadi rujukan teknis utama bagi tim pengembang frontend dan desainer UI/UX dalam mengimplementasikan antarmuka Tahap 02D agar selaras dengan kamus data dan batasan backend yang telah disahkan.

---

## 2. Prinsip Desain dan Batasan Operasional

### 2.1 Prinsip Desain Antarmuka

1. **Role-Adaptive & Context-Aware:** Tampilan, menu navigasi, dan tombol aksi menyesuaikan secara dinamis dengan role dan penugasan wilayah/lembaga pengguna (RBAC).
2. **Clarity & Data Integrity First:** Menegaskan pemisahan yang jelas antara 4 status dimensi data: status pendataan, status verifikasi, status lokasi, dan status publikasi.
3. **No Direct Sheet Access:** Antarmuka tidak berinteraksi langsung dengan Google Sheets. Seluruh pertukaran data wajib melewati lapisan API Apps Script yang terproteksi.
4. **Resilient Network Handling:** Mengakomodasi karakteristik backend prototype Google Apps Script (latensi respons, potensi timeout kuota, dan eksekusi asinkron) dengan menyediakan indikator visual *loading state*, *skeleton screen*, serta penanganan error yang manusiawi.
5. **Data Minimization & Privacy by Design:** Tidak menampilkan atau menyediakan form isian data individual santri (nama, NIK, NISN). Menjaga kerahasiaan nomor kontak personal dan dokumen internal sebelum adanya persetujuan publikasi resmi (*publication consent*).
6. **Mobile-Responsive & Operator-Friendly:** Antarmuka dirancang optimal untuk layar desktop administrator, namun tetap responsif dan fungsional pada tablet serta ponsel pintar untuk operator pesantren di lapangan.
7. **Audit-Ready Operations:** Setiap aksi sensitif (perubahan status verifikasi, penolakan revisi, persetujuan publikasi, dan perubahan data profil) mewajibkan konfirmasi dan pencatatan alasan/catatan perubahan.

### 2.2 Batasan Ruang Lingkup MVP (Sprint 02D)

- **Termasuk dalam MVP:**
  - 11 modul menu navigasi utama.
  - Autentikasi berbasis sesi aman melalui endpoint `auth.me` dan adapter sesi.
  - Direktori pencarian, filter wilayah (kecamatan & desa), filter multi-status, serta pagination.
  - Alur identifikasi awal pesantren dengan pengecekan duplikasi dan alokasi ID resmi.
  - Formulir tabulasi profil lengkap pesantren (10 domain profil turunan).
  - Alur kerja verifikasi administratif (peninjauan, permintaan revisi, persetujuan verifikasi).
  - Peta sebaran interaktif berbasis Leaflet.js / OpenStreetMap (tanpa API Key berbayar di fase MVP).
  - Cetak/preview Buku Induk Pesantren (tampilan terstruktur per lembaga).
  - Laporan ringkasan agregat dan ekspor data terbatas (format CSV/Excel).
  - Manajemen akun pengguna, peran, dan penugasan wilayah/lembaga.
  - Tampilan tabel referensi wilayah 14 kecamatan di Kabupaten Demak.
  - Log audit dan riwayat perubahan data per record.
- **Tidak termasuk dalam MVP (Ditunda ke Fase Berikutnya):**
  - Sistem pengaduan atau penanganan kasus kekerasan/perlindungan santri.
  - Modul akuntansi keuangan, SPP, donasi, atau gateway pembayaran pesantren.
  - Integrasi WhatsApp Gateway otomatis untuk notifikasi status.
  - Pemrosesan citra satelit atau GIS poligon lahan/gedung tingkat lanjut.
  - Fitur drag-and-drop builder untuk kustomisasi skema form oleh pengguna.

---

## 3. Persona Pengguna dan Matriks Hak Akses Antarmuka (RBAC v1.2)

Berdasarkan `Database_Dictionary_v1.1.md` dan adopsi modul keamanan Asnawiyyah, hak akses antarmuka dikelompokkan ke dalam 7 tingkatan peran resmi dengan tata kelola terpadu:

| Kode Peran | Nama Peran Resmi | Tingkat | Identitas Badge | Cakupan Kewenangan Antarmuka |
|---|---|:---:|:---:|---|
| `super_admin` | Super Admin (PCNU Demak & IT Core) | 1 | `purple` | Akses penuh (*Penuh / CRUD*) ke seluruh 11 modul, pengaturan sistem, manajemen seluruh akun & peran, audit log lengkap, dan bypass wilayah. |
| `admin_kabupaten` | Admin Kabupaten (Pengurus Harian PC RMI) | 2 | `emerald` | Pengelolaan penuh data pesantren se-Kabupaten Demak, verifikasi final, penerbitan ID resmi, ekspor laporan, dan Buku Induk. |
| `admin_kecamatan` | Admin Kecamatan (Koordinator 14 MWC NU) | 3 | `amber` | Supervisi wilayah kecamatan penugasannya, verifikasi berkas awal, dan pemantauan sebaran pesantren setempat. |
| `operator_pesantren` | Operator Pesantren (Sekretariat Pondok) | 4 | `cyan` | Entri dan pembaruan data mandiri profil lembaga binaan, unggah berkas IZOP & foto, serta pengajuan verifikasi. |
| `pengasuh` | Dewan Masyayikh / Pengasuh | 5 | `indigo` | Supervisi kurikulum kitab kuning, sanad keilmuan, persetujuan legalitas, dan monitoring read-only lembaga. |
| `verifikator` | Tim Asesor & Verifikator Lapangan | 6 | `rose` | Validasi lapangan berkas izin operasional, NSPP Kemenag, titik geospasial GIS, dan standar Pesantren Ramah Anak. |
| `guest` | Tamu Terdaftar / Peneliti Eksternal | 7 | `slate` | Akses baca terbatas pada rekapitulasi agregat statistik dan direktori publik. |

### 3.1 Pemisahan Menu Tata Kelola & Penyimpanan Google Sheets
Menu Tata Kelola kini dipisahkan secara modular menjadi 2 menu independen dengan persistensi spreadsheet terpisah:
1. **Manajemen Pengguna Terpadu (`#view-pengguna`)**:
   - Backing Spreadsheet: Worksheet **`app_users`**
   - Kolom: `id`, `email`, `nama_lengkap`, `phone`, `role`, `scope_wilayah`, `is_active`, `last_login`, `created_at`, `updated_at`.
   - Fitur UI: 4 KPI Cards gradien Asnawiyyah, Horizontal Pill Filters (`Semua`, `Online`, `Super Admin`, `Admin Kab`, `Admin Kec`, `Operator Pontren`), tombol WhatsApp langsung, dan modal pembuatan user.
2. **Manajemen Peran & Hak Akses (`#view-peran`)**:
   - Backing Spreadsheet: Worksheet **`app_roles`** (Master 7 Peran) & **`rbac_permissions`** (Matriks 11 Modul x 7 Peran = 77 baris izin).
   - Fitur UI: 4 KPI Cards Keamanan Sistem, Tabel Matriks RBAC interaktif 11 Modul dengan 5 tingkat izin (`Penuh`, `Lihat Saja`, `Entri & Input`, `Milik Sendiri`, `Tutup`). Setiap perubahan sel langsung disinkronkan ke sheet `rbac_permissions` dan dicatat ke `audit_logs`.

### 3.2 Matriks Otoritas 11 Modul Sistem (Tabel RBAC Interaktif)

| No | Modul Menu | Super Admin | Admin Kab. | Admin Kec. | Operator Pontren | Dewan Masyayikh | Verifikator | Tamu |
|:--:|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **Dashboard Operasional** | Penuh | Penuh | Milik Sendiri | Milik Sendiri | Lihat Saja | Lihat Saja | Tutup |
| 2 | **Direktori Pesantren** | Penuh | Penuh | Lihat Saja | Lihat Saja | Lihat Saja | Lihat Saja | Lihat Saja |
| 3 | **Inisiasi Record Baru** | Penuh | Penuh | Entri & Input | Entri & Input | Tutup | Entri & Input | Tutup |
| 4 | **Ruang Kerja Verifikasi** | Penuh | Penuh | Entri & Input | Tutup | Lihat Saja | Entri & Input | Tutup |
| 5 | **Peta Geospasial GIS** | Penuh | Penuh | Lihat Saja | Lihat Saja | Lihat Saja | Lihat Saja | Lihat Saja |
| 6 | **Buku Induk Pesantren** | Penuh | Penuh | Milik Sendiri | Milik Sendiri | Lihat Saja | Lihat Saja | Tutup |
| 7 | **Laporan & Statistik** | Penuh | Penuh | Milik Sendiri | Tutup | Lihat Saja | Tutup | Tutup |
| 8 | **Manajemen Pengguna** | Penuh | Penuh | Tutup | Tutup | Tutup | Tutup | Tutup |
| 9 | **Manajemen Peran (RBAC)**| Penuh | Lihat Saja | Tutup | Tutup | Tutup | Tutup | Tutup |
| 10 | **Referensi Wilayah** | Penuh | Penuh | Lihat Saja | Lihat Saja | Lihat Saja | Lihat Saja | Lihat Saja |
| 11 | **Riwayat Audit Trail** | Penuh | Lihat Saja | Tutup | Tutup | Tutup | Tutup | Tutup |

---

## 4. Arsitektur Antarmuka dan State Management

### 4.1 Tumpukan Teknologi Antarmuka (MVP Stack)

```text
+--------------------------------------------------------------------------+
|                            Web Browser Client                            |
|                                                                          |
|  +--------------------------------------------------------------------+  |
|  |                     Admin Dashboard Application                    |  |
|  |                                                                    |  |
|  |  +--------------------+  +--------------------+  +--------------+  |  |
|  |  |   UI Components    |  |   Core Framework   |  | State & Store|  |  |
|  |  |  - Modal Manager   |  |  - Vanilla JS ES6  |  | - AuthState  |  |  |
|  |  |  - Data Table      |  |  - Tailwind CSS    |  | - AppState   |  |  |
|  |  |  - Form Engine     |  |  - Heroicons (SVG) |  | - CacheStore |  |  |
|  |  |  - Notification    |  |  - Leaflet.js (Map)|  |              |  |  |
|  |  +--------------------+  +--------------------+  +--------------+  |  |
|  |                                                                    |  |
|  |  +--------------------------------------------------------------+  |  |
|  |  |                       API Adapter Layer                      |  |  |
|  |  |  - Request Normalizer (action, requestId, payload)           |  |  |
|  |  |  - Session & Token Interceptor                               |  |  |
|  |  |  - Response Parser & Error Dissector                         |  |  |
|  |  +--------------------------------------------------------------+  |  |
|  +--------------------------------------------------------------------+  |
+--------------------------------------------------------------------------+
                                    |
                           HTTPS JSON Payload
                                    |
                                    v
+--------------------------------------------------------------------------+
|                  Google Apps Script Web App Router                       |
|           (Action dispatcher, validation, RBAC, and storage)             |
+--------------------------------------------------------------------------+
```

### 4.2 Struktur State Sisi Klien

Aplikasi mengadopsi struktur state terpusat (*Global Reactive Store Pattern*) tanpa dependensi framework berat:

```javascript
window.AppState = {
  auth: {
    isAuthenticated: false,
    user: {
      userId: null,
      email: null,
      fullName: null,
      role: null, // super_admin, admin_kabupaten, admin_kecamatan, operator_pesantren
      assignments: {
        pesantrenIds: [],
        districtIds: []
      }
    },
    token: null
  },
  ui: {
    activeModule: 'dashboard', // id modul aktif
    sidebarOpen: true,
    isGlobalLoading: false,
    activeModal: null,
    toasts: []
  },
  referenceData: {
    districts: [], // cache referensi 14 kecamatan
    villages: [],  // cache desa per kecamatan terpilih
    dataSources: [],
    roles: []
  },
  currentViewData: {
    pesantrenList: [],
    pagination: {
      page: 1,
      pageSize: 20,
      totalRecords: 0,
      totalPages: 0
    },
    filters: {
      searchQuery: '',
      districtId: '',
      villageId: '',
      operationalStatus: '',
      verificationStatus: '',
      publicationStatus: ''
    },
    selectedPesantren: null // data detail aktif untuk profiling/verifikasi/buku induk
  }
};
```

---

## 5. Desain Komponen, Layout & Navigasi Global

Antarmuka mengusung tata letak *Modern Enterprise Administration* dengan proporsi yang ergonomis dan warna khas RMI-NU (Hijau Nuansa Islami Modern, Abu Netral, dan Aksen Emas/Kuning untuk peringatan).

### 5.1 Skema Tata Letak Layar (Layout Grid)

```text
+-----------------------------------------------------------------------------------+
|  [Logo RMI NU Demak]  Pesantren Data Center          [Pencarian Cepat]  [User Profile] |
|-----------------------------------------------------------------------------------|
| SIDEBAR NAVIGASI      | MAIN WORKSPACE CONTENT                                     |
|                       |                                                           |
| 1. Dashboard          | [Breadcrumbs: Home > Direktori Pesantren]                 |
| 2. Direktori          |-----------------------------------------------------------|
| 3. Tambah Pesantren   | [Header Halaman: Judul Modul & Tombol Aksi Utama]         |
| 4. Verifikasi Data    |-----------------------------------------------------------|
| 5. Lokasi & Peta      | [Filter Bar / Search Controls]                            |
| 6. Buku Induk         |-----------------------------------------------------------|
| 7. Laporan            | [Tabel Data / Kartu Metrik / Formulir Tabulasi]           |
| 8. Pengguna & Akses   |                                                           |
| 9. Ref. Wilayah       |                                                           |
| 10. Log Aktivitas     |                                                           |
| 11. Pengaturan        | [Pagination Bar: Menampilkan 1-20 dari 350 Pesantren]     |
|-----------------------------------------------------------------------------------|
| [Collapse Sidebar]    | Status Koneksi: Terhubung ke Apps Script Gateway (v1.0)   |
+-----------------------------------------------------------------------------------+
```

### 5.2 Aturan Komponen UI Inti

1. **Top Navbar:**
   - Menampilkan logo resmi RMI PCNU Demak, nama sistem "Pesantren Data Center", indikator koneksi backend, dan dropdown profil pengguna (nama lengkap, badge role, tombol ubah profil, dan tombol logout).
2. **Left Sidebar Navigasi:**
   - Menu tersusun secara hierarki vertikal dengan ikon representatif (SVG).
   - Menu yang tidak sesuai dengan hak akses pengguna disembunyikan secara otomatis (*security by authorization*, bukan sekadar disabled).
   - Menampilkan *badge counter* dinamis pada menu **Verifikasi Data** (misal: angka pesantren yang menunggu verifikasi: `[12]`).
3. **Status Badges Standar:**
   - **Status Pendataan:**
     - `draft`: Abu-abu (Draft)
     - `submitted`: Biru Muda (Diajukan)
     - `revision_required`: Oranye (Perlu Revisi)
     - `completed`: Hijau Zamrud (Lengkap)
   - **Status Verifikasi:**
     - `not_verified`: Abu-abu Netral (Belum Diverifikasi)
     - `under_review`: Kuning Amber (Sedang Ditinjau)
     - `verified`: Hijau Tua (Terverifikasi RMI)
     - `rejected`: Merah Crimson (Ditolak)
   - **Status Lokasi:**
     - `not_verified`: Abu-abu (Belum Dicek)
     - `under_review`: Kuning (Dalam Pemeriksaan)
     - `verified`: Biru Langit (Koordinat Valid)
     - `needs_correction`: Oranye (Perlu Koreksi)
   - **Status Publikasi:**
     - `private`: Hitam/Gelap (Internal Khusus)
     - `pending_approval`: Kuning Emas (Menunggu Persetujuan)
     - `approved`: Biru Indigo (Disetujui)
     - `published`: Hijau Terang (Tayang di Web)
     - `unpublished`: Merah Marun (Ditarik dari Publik)

---

## 6. Spesifikasi Rinci 11 Modul Menu Admin Dashboard MVP

### 6.1 Modul 1: Dashboard (Overview & Agregasi Metrik)

**Tujuan:** Memberikan gambaran komprehensif bagi pimpinan RMI dan administrator terkait progres pendataan seluruh pesantren di Kabupaten Demak.

**Elemen Utama Antarmuka:**
1. **Kartu Ringkasan Metrik Utama (Top Metric Cards):**
   - *Total Pesantren Terdaftar:* Total record aktif (`active` + `inactive`).
   - *Sudah Diverifikasi:* Persentase dan jumlah record berstatus `status_verifikasi = 'verified'`.
   - *Antrean Verifikasi:* Jumlah record berstatus `status_verifikasi = 'under_review'` atau `status_pendataan = 'submitted'`.
   - *Lokasi Terpetakan:* Jumlah lembaga dengan koordinat valid (`status_verifikasi_lokasi = 'verified'`).
   - *Total Agregat Santri:* Akumulasi santri mukim & non-mukim se-kabupaten dari pelaporan tahun aktif.
2. **Grafik / Diagram Visualisasi Distribusi (Ringan / SVG CSS-based):**
   - *Sebaran per Kecamatan:* Diagram batang horizontal menunjukkan jumlah pesantren di 14 kecamatan (Mranggen, Sayung, Karangtengah, Demak, Bonang, Wedung, dll.).
   - *Rasio Keanggotaan RMI:* Donut chart perbandingan `member`, `non_member`, dan `unknown`.
   - *Kesiapan Publikasi:* Diagram status publikasi (`published`, `pending_approval`, `private`).
3. **Tabel Antrean Prioritas Tindak Lanjut (Urgent Action Queue):**
   - Menampilkan 5 record terbaru yang mengajukan pembaruan data atau revisi mendesak.
   - Kolom: Kode RMI, Nama Pesantren, Kecamatan, Tanggal Pengajuan, Aksi Cepat (*Tinjau Sekarang*).

---

### 6.2 Modul 2: Direktori Pesantren (Master List, Filter, Search & Pagination)

**Tujuan:** Pusat pencarian dan eksplorasi data pesantren dengan kapabilitas penyaringan yang fleksibel dan terstruktur.

**Elemen Utama Antarmuka:**
1. **Control Panel Filter & Pencarian:**
   - *Input Search Bar:* Pencarian teks instan (mencakup: `nama_resmi`, `nama_populer`, `kode_pesantren`, nomor NSPP).
   - *Filter Kecamatan & Desa:* Dropdown berjenjang (memilih kecamatan akan menyaring daftar desa secara dinamis).
   - *Filter Status Keanggotaan:* `Semua`, `Anggota RMI`, `Bukan Anggota`, `Belum Diketahui`.
   - *Filter Status Verifikasi:* `Semua`, `Belum Diverifikasi`, `Sedang Ditinjau`, `Terverifikasi`, `Ditolak`.
   - *Filter Status Publikasi:* `Semua`, `Private`, `Menunggu Persetujuan`, `Tayang di Web`.
   - *Tombol Reset Filter & Refresh Data.*
2. **Data Table Master Direktori:**
   - Kolom:
     1. `No.`
     2. `Kode RMI` (format: `RMI-DMK-000001`, monospaced font).
     3. `Nama Pesantren` (Nama resmi dan nama populer jika ada).
     4. `Kecamatan & Desa` (Misal: Demak Kota - Bintoro).
     5. `Pengasuh Utama` (Nama pimpinan saat ini).
     6. `Status Operasional` (Active / Inactive).
     7. `Status Verifikasi` (Badge indikator).
     8. `Status Publikasi` (Badge indikator).
     9. `Aksi` (Tombol dropdown/ikon: *Lihat Detail*, *Edit Profil*, *Buku Induk*, *Verifikasi*, *Arsipkan*).
3. **Komponen Pagination:**
   - Kontrol pemilih jumlah baris (10, 20, 50 baris per halaman).
   - Tombol *First, Previous, [Nomor Halaman], Next, Last*.
   - Informasi keterbacaan: *"Menampilkan 21-40 dari 348 pesantren"*.

---

### 6.3 Modul 3: Tambah Pesantren (Inisiasi Record Awal & Penerbitan ID)

**Tujuan:** Menyediakan antarmuka pendaftaran lembaga baru melalui alur inisiasi resmi tim RMI, dilengkapi pencegahan duplikasi data.

**Alur Kerja Form Tambah:**
```text
[Langkah 1: Input Data Identitas & Wilayah]
                |
                v
[Langkah 2: Pemeriksaan Duplikasi Otomatis (Nama / Wilayah / NSPP)]
                |
     +----------+----------+
     | Mirip ditemukan     | Data unik & valid
     v                     v
[Peringatan Konfirmasi]  [Penerbitan ID Otomatis via Backend (LockService)]
     |                     |
     +----------+----------+
                |
                v
[Record Pesantren Berhasil Dibuat (Status: Draft/Identified)]
[Opsi Lanjutan: Lanjut Lengkapi Profil / Kembali ke Direktori]
```

**Field Isian Formulir Identifikasi Awal:**
- **Nama Lembaga:**
  - `nama_resmi` (Wajib, teks maks 255 karakter).
  - `nama_populer` (Opsional, teks maks 255 karakter).
- **Lokasi Geografis Awal:**
  - `kecamatan_id` (Wajib, pilihan dropdown dari tabel `districts`).
  - `desa_id` (Wajib, pilihan dropdown dinamis dari tabel `villages`).
  - `alamat` (Wajib, textarea teks lengkap jalan, RT/RW, pedukuhan).
- **Klasifikasi & Keanggotaan:**
  - `status_keanggotaan_rmi` (Wajib: `member`, `non_member`, `unknown`).
  - `tahun_berdiri` (Opsional: angka 4 digit, tidak melebihi tahun sekarang).
  - `sumber_data_id` (Wajib: pilihan dropdown dari tabel `data_sources`).
- **Pimpinan Awal & Kontak (Opsional pada Inisiasi):**
  - `nama_pengasuh` (Nama lengkap pengasuh/pendiri).
  - `nomor_kontak` (Nomor seluler/WhatsApp resmi).
- **Catatan Inisiasi:**
  - `catatan_internal` (Catatan tim verifikator/pendata lapangan).

**Ketentuan Antarmuka:**
- Kode internal `kode_pesantren` **tidak dapat diisi atau diedit** di antarmuka; field ditampilkan terkunci *(read-only)* dengan teks *"Akan diterbitkan otomatis oleh server saat penyimpanan"*.
- Tombol *Simpan & Terbitkan ID RMI* memicu modal konfirmasi ringkasan data sebelum dikirim ke backend.

---

### 6.4 Modul 4: Verifikasi Data (Antrean Review & Workflow Verifikasi)

**Tujuan:** Ruang kerja khusus bagi petugas verifikator RMI untuk memeriksa keabsahan administratif dan kelayakan data yang diajukan oleh operator pesantren.

**Struktur Tampilan Modul:**
1. **Tabs Antrean Status:**
   - Tab 1: *Menunggu Pemeriksaan* (`status_verifikasi = 'under_review'` / `status_pendataan = 'submitted'`).
   - Tab 2: *Perlu Revisi Operator* (`status_verifikasi = 'revision_required'`).
   - Tab 3: *Telah Diverifikasi* (`status_verifikasi = 'verified'`).
   - Tab 4: *Ditolak* (`status_verifikasi = 'rejected'`).
2. **Lembar Evaluasi Verifikasi (Verification Review Workspace):**
   Ketika sebuah pesantren dipilih untuk ditinjau, antarmuka membuka panel perbandingan komprehensif:
   - **Checklist 5 Aspek Verifikasi (Berdasarkan Kamus Data & Standar Nasional):**
     1. *Verifikasi Identitas Lembaga:* Nama resmi, pengasuh, tahun berdiri, dan komitmen Pesantren Aman.
     2. *Verifikasi Legalitas & Cek EMIS:* Nomor NSPP, Izin Operasional Kemenag, Akta Notaris. Tersedia tombol langsung: *"🔍 Validasi Keaslian di EMIS Kemenag"* (`https://emis.kemenag.go.id/emis-dashboard`) untuk memeriksa kesesuaian data dengan database Kementerian Agama.
     3. *Verifikasi Titik Lokasi:* Koordinat latitude/longitude terhadap citra peta wilayah Demak.
     4. *Verifikasi Profil Santri & SDM:* Rasio santri mukim/non-mukim serta keabsahan data dewan asatidz.
     5. *Verifikasi Dokumen Pendukung:* Pratinjau berkas yang diunggah (SK, foto plang nama, sertifikat).
3. **Form Aksi Putusan Verifikasi (Decision Actions):**
   - **Tombol A: "Minta Revisi Data"**
     - Membuka modal isian: *Bagian yang perlu direvisi* (checkbox: Legalitas, Koordinat, Santri, dll.) dan *Uraian Catatan Revisi* (textarea wajib diisi alasan detail).
     - Mengubah status menjadi `revision_required`.
   - **Tombol B: "Verifikasi Administratif (Setujui)"**
     - Membuka modal konfirmasi penetapan status `verified`.
     - Menyimpan ID verifikator, timestamp, dan ringkasan persetujuan.
   - **Tombol C: "Tolak Pengajuan"**
     - Digunakan jika pengajuan tidak memenuhi kriteria pesantren atau terindikasi fiktif. Wajib melampirkan alasan penolakan.

---

### 6.5 Modul 5: Lokasi dan Pemetaan (Geospatial Mapping & Coordinate Picker)

**Tujuan:** Memvisualisasikan titik koordinat seluruh pesantren di peta Kabupaten Demak serta menyediakan alat bantu penentuan titik koordinat yang presisi.

**Komponen Utama Antarmuka:**
1. **Interaktif Map Canvas (Leaflet.js + OpenStreetMap):**
   - Batas administratif Kabupaten Demak (koordinat pusat: lat `-6.8944`, long `110.6386`).
   - Marker clustering untuk mengelompokkan pesantren yang padat dalam satu wilayah kecamatan.
   - Warna Marker sesuai status verifikasi lokasi:
     - Hijau: Lokasi Terverifikasi (`verified`).
     - Kuning: Belum Terverifikasi / Menunggu Pemeriksaan (`not_verified` / `under_review`).
     - Merah/Oranye: Perlu Koreksi (`needs_correction`).
   - *Popup Info:* Ketika marker diklik, menampilkan: Foto plang/gerbang, Nama Pesantren, Kode RMI, Pengasuh, Alamat, Status Verifikasi, dan tombol *Buka Buku Induk*.
2. **Layer Controls & Filter Peta:**
   - Filter layer kecamatan (menampilkan titik pesantren per kecamatan tertentu).
   - Toggles filter status verifikasi lokasi.
3. **Coordinate Picker & Geocoding Validator (Pada Form Edit Lokasi):**
   - Peta interaktif mini dengan *pin marker draggable*.
   - Input manual `latitude` dan `longitude` yang tersinkronisasi otomatis saat pin digeser di peta.
   - Tombol *"Gunakan Lokasi Perangkat Saat Ini"* (HTML5 Geolocation API dengan validasi toleransi akurasi).
   - Indikator peringatan jika koordinat berada di luar batas terluar geografis Kabupaten Demak.

---

### 6.6 Modul 6: Buku Induk Pesantren (Digital Master Profile & Tabulasi Data)

**Tujuan:** Menyajikan profil lengkap dan komprehensif satu pesantren dalam format arsip digital resmi RMI NU Demak, siap cetak atau dibaca secara mendalam, dengan struktur yang selaras dengan portal nasional Digdaya Pesantren PBNU.

**Struktur Navigasi Tab Profil Pesantren:**
- **Header Profil:** Menampilkan Kode RMI, Nama Resmi Pesantren, Foto Utama/Logo, Badge Akreditasi/Verifikasi, Badge "Pesantren Ramah Santri (Pesantren Aman)", Status Publikasi, dan tombol aksi: *Cetak Buku Induk (PDF/Print View)*, *Edit Data*, *Log Riwayat Perubahan*.
- **Tab 1: Identitas, Pimpinan & Dewan Asatidz**
  - Data master pesantren (`pesantren`).
  - Daftar Pengasuh, Dewan Masyayikh, dan Dewan Guru (`pesantren_leaders`) dengan pemisahan tabulasi *Ustadz* dan *Ustadzah*, memuat spesialisasi fan keilmuan dan pendidikan terakhir.
  - Kontak resmi lembaga, media sosial terintegrasi (YouTube, Instagram, TikTok, Facebook), dan hotline pendaftaran santri baru (`pesantren_contacts`).
- **Tab 2: Lokasi & Wilayah**
  - Alamat lengkap, RT/RW, Desa, Kecamatan, Kode Pos (`pesantren_locations`).
  - Peta statis/interaktif mini koordinat pesantren dengan tombol pintas *"Buka di Google Maps"*.
  - Petunjuk aksesibilitas dan transportasi.
- **Tab 3: Legalitas, Perizinan & Validasi Kemenag**
  - Tabel metadata dokumen: NSPP, Izin Kemenag, Akta Notaris, NPWP Lembaga (`pesantren_legalities`).
  - Tombol aksi verifikasi: *"🔍 Validasi Keaslian NSP di EMIS Kemenag"*.
  - Tautan berkas bukti dokumen yang tersimpan aman (`document_files`).
- **Tab 4: Satuan Pendidikan & Kurikulum Kitab Kuning**
  - Jalur pendidikan yang diselenggarakan: Madrasah Diniyah, Formal (MI/MTs/MA/SMK), Tahfidzul Qur'an.
  - **Kurikulum Pembelajaran Kitab Berbasis Marhalah:**
    - *Marhalah Ula (Tingkat Dasar):* Daftar kitab dasar, pengarang (mushannif), dan fan ilmu.
    - *Marhalah Wustho (Tingkat Menengah):* Daftar kitab menengah, pengarang, dan fan ilmu.
    - *Marhalah Ulya (Tingkat Lanjutan):* Daftar kitab babon/tinggi, pengarang, dan fan ilmu.
    - *Kajian Tematik / Khusus:* Thariqah, Bahtsul Masail, dll.
- **Tab 5: Statistik Santri & SDM (Agregat Tahunan)**
  - Rekapitulasi per tahun data: Jumlah santri putra/putri, mukim/non-mukim (`pesantren_resources`).
  - Jumlah dewan pengajar (ustadz/ustadzah) dan tenaga administrasi/kependidikan.
- **Tab 6: Sarana & Fasilitas Terstandar**
  - Fasilitas asrama, masjid/musholla, ruang kelas, perpustakaan, sanitasi sehat, poskestren, laboratorium komputer, wifi/internet (`pesantren_facilities`).
- **Tab 7: Program Unggulan & Ekstrakurikuler**
  - Program khas pesantren: kewirausahaan, tahfidz bersanad, kajian kitab turots, seni hadrah, bela diri (`pesantren_programs`).
- **Tab 8: Kemandirian Ekonomi & Profil Pengembangan**
  - **Badan Usaha / Unit Ekonomi Pesantren:** Tabel unit bisnis (Kopontren, Agribisnis, Retail, Konveksi, Jasa) dengan nama usaha, bentuk legalitas, bidang, dan status usaha aktif.
  - Catatan profiling tata kelola kelembagaan, digitalisasi, dan kebutuhan prioritas pengembangan (`pesantren_development_profiles`).
  - Indikator komitmen implementasi program *Pesantren Aman* (perlindungan santri).
- **Tab 9: Status Publikasi & Persetujuan (Consent)**
  - Pengaturan izin publikasi profil umum, izin kontak publik, dan riwayat persetujuan dari pimpinan pesantren (`publication_consents`).

---

### 6.7 Modul 7: Laporan dan Statistik (Agregasi Data & Ekspor Terbatas)

**Tujuan:** Menghasilkan rekapitulasi data agregat bagi kebutuhan advokasi, perencanaan program pengurus cabang RMI, dan laporan dinas terkait.

**Fitur Utama Antarmuka:**
1. **Pilihan Jenis Rekapitulasi:**
   - *Rekapitulasi Sebaran Lembaga per Kecamatan:* Jumlah total, klasifikasi operasional, dan keanggotaan RMI.
   - *Rekapitulasi Santri & SDM:* Total santri mukim vs non-mukim di seluruh kecamatan.
   - *Rekapitulasi Kepemilikan NSPP & Legalitas:* Jumlah pesantren yang telah ber-NSPP vs belum ber-NSPP.
   - *Rekapitulasi Potensi & Kebutuhan Pengembangan:* Pemetaan kebutuhan sarpras, digitalisasi, dan tata kelola santri.
2. **Filter Parameter Periode:**
   - Pemilih tahun data (`tahun_data` / `tahun_profiling`).
   - Pemilih wilayah (Semua Kecamatan atau filter spesifik).
3. **Data Grid Pratinjau Agregat:**
   - Tampilan tabel pivot yang bersih dengan baris subtotal dan total akhir.
4. **Alat Bantu Ekspor Terkontrol (Export Engine):**
   - *Ekspor Data Agregat (CSV / Excel):* Seluruh pengguna berwenang dapat mengunduh tabel angka agregat.
   - *Ekspor Direktori Pesantren Terbatas:* Memerlukan permission khusus (`export.pesantren`).
   - Sistem menerapkan *Data Sanitization*: Dokumen privat, NIK pengurus, nomor kontak pribadi, dan catatan internal audit **tidak diikutsertakan** dalam file ekspor.

---

### 6.8 Modul 8: Pengguna dan Hak Akses (User Management & Scope Assignment)

**Tujuan:** Mengelola akun pengguna sistem, menetapkan peran, serta mengunci cakupan akses wilayah atau lembaga tertentu.

**Elemen Utama Antarmuka:**
1. **Daftar Akun Pengguna (`users`):**
   - Kolom: Nama Lengkap, Alamat Email, Nomor Telepon/WA, Peran Utama, Cakupan Penugasan, Status Akun (`invited`, `active`, `suspended`, `disabled`), Login Terakhir, Aksi.
2. **Modal Tambah / Undang Pengguna Baru:**
   - Input: Nama Lengkap, Email Aktif (wajib unik), Nomor Telepon, Pemilihan Peran (`roles`).
   - **Pengaturan Cakupan Penugasan (Scope Assignment):**
     - Jika Peran = `operator_pesantren`: Menampilkan dropdown pemilih pesantren (wajib ditautkan ke satu atau lebih `pesantren_id`).
     - Jika Peran = `admin_kecamatan`: Menampilkan dropdown pemilih kecamatan (wajib ditautkan ke `kecamatan_id`).
     - Jika Peran = `admin_kabupaten` / `super_admin`: Cakupan berlaku otomatis se-kabupaten.
3. **Kontrol Status Akun:**
   - Tombol aksi cepat: *Nonaktifkan Sementara (Suspend)*, *Aktifkan Kembali*, *Cabut Penugasan Lembaga*.
   - Tidak ada fitur penghapusan akun secara permanen (hanya penonaktifan untuk menjaga jejak audit di tabel `audit_logs`).

---

### 6.9 Modul 9: Referensi Wilayah (Districts & Villages Lookup)

**Tujuan:** Menyediakan antarmuka peninjauan master data wilayah administratif Kabupaten Demak sebagai landasan validitas relasi lokasi.

**Karakteristik Antarmuka:**
- Tampilan tabel master 14 Kecamatan (`districts`) dan desa/kelurahan (`villages`).
- Menampilkan kode wilayah resmi BPS/Kemendagri dan jumlah pesantren terdaftar pada setiap desa/kecamatan.
- Pencarian cepat desa/kelurahan.
- *Catatan Akses:* Pada MVP, tabel referensi wilayah berstatus *read-only* bagi sebagian besar pengguna guna mencegah kerusakan relasi geospasial yang sedang aktif.

---

### 6.10 Modul 10: Riwayat Aktivitas & Audit Log (Audit Trail)

**Tujuan:** Memberikan transparansi akuntabilitas sistem dengan menampilkan rekaman jejak audit dari setiap perubahan data penting dan aktivitas keamanan.

**Fitur Antarmuka:**
1. **Filter Audit Log:**
   - Filter menurut Waktu (Hari ini, 7 hari terakhir, 30 hari terakhir, Custom Range).
   - Filter Aktor / Pengguna (`user_id`).
   - Filter Jenis Aksi (`login`, `create_pesantren`, `update_profile`, `verify_data`, `change_publication_status`, `export_data`).
   - Filter Entitas / ID Pesantren terkait.
2. **Tabel Jejak Audit (`audit_logs` & `pesantren_data_history`):**
   - Kolom: Timestamp (WIB), Pelaksana (Nama & Role), Tipe Aksi, Entitas yang Diubah, Kode RMI / Nama Lembaga, Ringkasan Perubahan.
   - Tombol *"Lihat Detail Perubahan"*: Membuka modal yang menampilkan perbandingan nilai lama (*old value*) dan nilai baru (*new value*) dalam format visual side-by-side yang bersih.

---

### 6.11 Modul 11: Pengaturan Sistem (System Settings & Health Status)

**Tujuan:** Memantau parameter operasional aplikasi dan konfigurasi non-rahasia sistem.

**Elemen Antarmuka:**
- **System Health Monitor:** Indikator konektivitas ke Google Apps Script Web App, status kuota harian Apps Script (perkiraan pembacaan batch), dan status keterhubungan spreadsheet.
- **Konfigurasi Aplikasi Non-Secret (`system_settings`):**
  - Tahun Data Pelaporan Aktif (misal: `2026`).
  - Status Pendaftaran / Pemutakhiran Mandiri Operator (Dibuka / Ditutup).
  - Teks Pengumuman Banner Dashboard.
- **Batasan Keamanan:** Antarmuka **tidak menyediakan** field untuk melihat atau mengedit API Secret, Service Account Key, atau Script Properties privat.

---

## 7. Desain Formulir dan Validasi Sisi Klien vs Sisi Server

Untuk menjaga integritas data tanpa mengorbankan kenyamanan pengguna (*user experience*), validasi diterapkan dalam dua lapisan:

```text
Input Pengguna (Form UI)
          |
          v
[Lapisan 1: Validasi Sisi Klien (Client-Side)]
  - Cek field required
  - Format email, nomor telepon, URL
  - Format tahun 4 digit (<= tahun saat ini)
  - Rentang koordinat geografis Demak
  - Feedback instan pada UI (merah/hijau)
          |
    Lolos Validasi? --[Tidak]--> Tampilkan pesan error inline pada input field
          |
       [Ya]
          v
Kirim JSON Payload ke Backend Apps Script
          |
          v
[Lapisan 2: Validasi Sisi Server (Server-Side)]
  - Verifikasi identitas & role token
  - Pengecekan foreign key & cakupan wilayah/pesantren
  - Pengecekan duplikasi record
  - Enforce enum nilai baku
  - Sanitasi karakter berbahaya
```

### Standar Format & Aturan Validasi Khusus

| Field / Elemen | Aturan Validasi Klien | Aturan Validasi Server (Apps Script) |
|---|---|---|
| `nama_resmi` | Wajib, min 3 huruf, max 255 huruf. | Trim spasi, cek potensi duplikasi nama di kecamatan yang sama. |
| `kode_pesantren` | Read-only di browser, tidak bisa diinput. | Diterbitkan eksklusif oleh server via `LockService` (`RMI-DMK-000001`). |
| `latitude` & `longitude` | Rentang lat `-7.10` s/d `-6.70`, long `110.40` s/d `110.85` (area Demak). Wajib berpasangan. | Decimal(10,7), verifikasi keberadaan koordinat berpasangan. |
| `nomor_kontak` / `telepon` | Hanya angka, karakter `+`, `-`, dan spasi. Min 9 digit. | Normalisasi format internasional standar (misal: `62812...`). |
| `email` | Format email standar RFC 5322. | Normalisasi lowercase, validasi format, cek keunikan akun. |
| `tahun_data` | Angka bulat 4 digit (contoh: `2026`), rentang `1900` s/d tahun berjalan. | Integer, divalidasi tidak boleh tahun masa depan. |
| `santri_mukim` & `santri_nonmukim` | Bilangan bulat non-negatif (`>= 0`). Boleh kosong jika belum diketahui. | Integer non-negatif. Dilarang otomatis mengganti nilai kosong menjadi 0. |
| Unggah Berkas Dokumen | Maksimal 5 MB, ekstensi yang diizinkan: `.pdf`, `.jpg`, `.jpeg`, `.png`. | Validasi MIME type, simpan ke Drive folder privat, catat metadata. |

---

## 8. Integrasi Kontrak Backend (Action API Mapping)

Antarmuka berkomunikasi dengan Google Apps Script Web App melalui metode POST terpadu yang memetakan setiap interaksi ke *action contract* yang didefinisikan dalam `Apps_Script_Backend_Specification_v1.0.md`.

### 8.1 Pemetaan Aksi UI ke Action Backend

| Modul Antarmuka | Aksi Interaksi Pengguna | Action Contract Backend | Payload Utama |
|---|---|---|---|
| Autentikasi | Inisialisasi Sesi Aplikasi | `auth.me` | `{}` |
| Dashboard | Memuat Agregat & Ringkasan | `dashboard.summary` | `{ districtId?: string }` |
| Direktori | Memuat Tabel Pesantren | `pesantren.list` | `{ filters: {...}, page: 1, pageSize: 20 }` |
| Direktori | Membuka Profil Tunggal | `pesantren.get` | `{ pesantrenId: "uuid" }` |
| Tambah Pesantren | Simpan Record Baru & Terbitkan ID | `pesantren.create` | `{ payload: {...} }` |
| Buku Induk / Edit | Simpan Perubahan Profil | `pesantren.update` | `{ pesantrenId: "uuid", patch: {...} }` |
| Profil Turunan | Simpan Data Lokasi/Legalitas/SDM | `profile.upsert` | `{ pesantrenId: "uuid", domain: "...", data: {...} }` |
| Verifikasi Data | Operator Mengajukan Verifikasi | `verification.submit` | `{ pesantrenId: "uuid", scope: "all" }` |
| Verifikasi Data | Petugas Memberi Putusan Verifikasi | `verification.review` | `{ pesantrenId: "uuid", decision: "verified"|"revision_required", notes: "..." }` |
| Status Publikasi | Permintaan/Persetujuan Publikasi | `publication.approve` | `{ pesantrenId: "uuid", consentId: "uuid" }` |
| Direktori | Mengarsipkan Pesantren | `pesantren.archive` | `{ pesantrenId: "uuid", reason: "..." }` |
| Pengguna | Memuat Daftar Pengguna | `users.list` | `{ page: 1, pageSize: 50 }` |
| Pengguna | Menugaskan Cakupan Pengguna | `users.assign` | `{ userId: "uuid", roleId: "uuid", scope: {...} }` |
| Laporan | Unduh Berkas Ekspor | `export.pesantren` | `{ format: "csv", filters: {...} }` |
| Pengaturan | Health Check Layanan | `system.health` | `{}` |

### 8.2 Standardisasi Format Request & Response

#### Request Format (Client ke Apps Script)
```json
{
  "action": "pesantren.list",
  "requestId": "req-client-1731472800000-abc123",
  "payload": {
    "page": 1,
    "pageSize": 20,
    "filters": {
      "districtId": "dist-001",
      "verificationStatus": "under_review",
      "searchQuery": "Fathul Huda"
    }
  }
}
```

#### Response Format Sukses (Apps Script ke Client)
```json
{
  "success": true,
  "requestId": "req-client-1731472800000-abc123",
  "data": {
    "records": [
      {
        "id": "c1f7b820-9f2d-4e9b-b0b2-7d8b5a1b3c9e",
        "kode_pesantren": "RMI-DMK-000001",
        "nama_resmi": "Pondok Pesantren Fathul Huda",
        "nama_populer": "PP Fathul Huda Sayung",
        "kecamatan": "Sayung",
        "desa": "Sidorejo",
        "pengasuh_utama": "KH. Syamsuddin",
        "status_operasional": "active",
        "status_verifikasi": "under_review",
        "status_publikasi": "private"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalRecords": 1,
      "totalPages": 1
    }
  },
  "meta": {
    "timestamp": "2026-11-13T11:20:00+07:00"
  }
}
```

#### Response Format Gagal (Apps Script ke Client)
```json
{
  "success": false,
  "requestId": "req-client-1731472800000-abc123",
  "error": {
    "code": "ACCESS_DENIED",
    "message": "Anda tidak memiliki kewenangan untuk mengakses data di luar wilayah penugasan Anda.",
    "details": []
  }
}
```

---

## 9. Error Handling, Loading State, dan Feedback Pengguna

Untuk menjamin antarmuka tetap ramah dan dapat dipahami oleh operator dari berbagai latar belakang teknis:

1. **State Loading & Progresif Feedback:**
   - *Skeleton Loaders:* Digunakan saat memuat tabel direktori dan kartu dashboard agar tata letak tidak berkedip (*layout shift*).
   - *Spinners & Disable State:* Tombol simpan/kirim menampilkan animasi spinner kecil dan dinonaktifkan *(disabled)* seketika setelah diklik untuk mencegah submit ganda *(duplicate requests)*.
2. **Katalog Notifikasi Toast Terstandar:**
   - *Toast Sukses (Hijau):* Muncul di pojok kanan atas selama 4 detik saat operasi data berhasil disimpan.
   - *Toast Peringatan (Kuning/Oranye):* Muncul jika ada input yang tidak lengkap atau deteksi calon duplikasi data.
   - *Toast Error (Merah):* Muncul jika terjadi kegagalan jaringan atau penolakan otorisasi backend.
3. **Penanganan Empty State yang Informatif:**
   - Ketika hasil pencarian atau tabel data kosong, antarmuka tidak menampilkan tabel putih kosong, melainkan ilustrasi ramah dengan teks penjelasan: *"Tidak ada data pesantren yang sesuai dengan kriteria filter yang Anda pilih."* dilengkapi tombol *"Reset Filter"*.
4. **Pemetaan Kode Error Backend ke Bahasa Pengguna:**

| Kode Error Backend | Pesan yang Ditampilkan di Antarmuka |
|---|---|
| `AUTH_REQUIRED` / `AUTH_INVALID` | "Sesi masuk Anda telah berakhir. Silakan muat ulang halaman dan masuk kembali." |
| `ACCESS_DENIED` | "Akses ditolak. Akun Anda tidak memiliki izin untuk melakukan aksi ini." |
| `VALIDATION_ERROR` | "Data yang dimasukkan belum lengkap atau tidak valid. Silakan periksa kembali bagian yang ditandai merah." |
| `DUPLICATE_RECORD` | "Terdeteksi potensi duplikasi data pesantren dengan nama atau NSPP yang sama di wilayah ini." |
| `ID_GENERATION_FAILED` | "Gagal menerbitkan ID RMI karena server sedang sibuk. Silakan coba kembali dalam beberapa saat." |
| `QUOTA_EXCEEDED` | "Batas pemrosesan harian sistem tercapai. Silakan hubungi Administrator RMI NU Demak." |
| `INTERNAL_ERROR` | "Terjadi kendala pada layanan server. Tim teknis sedang menelusuri kendala ini." |

---

## 10. Keamanan Antarmuka dan Perlindungan Data Sensitif

1. **Prinsip Tampilan Server-Enforced (UI Guarding):**
   - Elemen tombol aksi administratif sensitif (seperti tombol Verifikasi, tombol Publish, tombol Pengaturan) disembunyikan berdasarkan data konteks user dari server.
   - *Catatan Penting:* Penyembunyian elemen UI hanyalah kenyamanan visual; keamanan hakiki tetap dieksekusi secara ketat oleh *AuthorizationService* di server.
2. **Perlindungan Data Santri:**
   - Antarmuka **sama sekali tidak memiliki form atau tampilan** untuk nama, NIK, tempat tanggal lahir, atau alamat orang tua santri individual.
   - Semua input santri berwujud bilangan agregat total per lembaga.
3. **Penyensoran Informasi Pribadi (*Data Masking*):**
   - Kontak personal pengasuh atau nomor sertifikat kepemilikan tanah pesantren yang belum berstatus `is_public = TRUE` disamarkan di tampilan publik/operator non-berwenang (misal: `0812-****-5678`).
4. **Pencegahan Eksploitasi Klien (*XSS & Injection Prevention*):**
   - Semua teks input dari pengguna wajib di-*escape* saat dirender ke DOM HTML. Tidak menggunakan fungsi `innerHTML` langsung dengan data mentah pengguna.
   - Penolakan terhadap karakter formula spreadsheet pada awal teks (`=`, `+`, `-`, `@`) guna mencegah formula injection saat data diekspor ke format Excel/Sheets.

---

## 11. Non-Functional Requirements Antarmuka

| Aspek | Spesifikasi Kebutuhan Antarmuka |
|---|---|
| **Responsivitas & Layout** | Mendukung layar Desktop (1366x768 ke atas), Layar Tablet (768px - 1024px), dan Layar Ponsel Pintar (min 360px lebar). |
| **Dukungan Peramban (Browser)** | Kompatibel penuh dengan peramban modern: Google Chrome (versi 100+), Mozilla Firefox (100+), Microsoft Edge (100+), dan Safari Mobile/Desktop. |
| **Performa & Ukuran Aset** | Ukuran bundle awal antarmuka (HTML, CSS, JS, SVG assets) tidak melebihi 1.5 MB untuk menjamin kelancaran akses di daerah dengan sinyal seluler terbatas. |
| **Aksesibilitas (A11y)** | Kontras warna teks memenuhi standar WCAG 2.1 AA (rasio kontras minimal 4.5:1 untuk teks biasa); tombol memiliki label semantik yang jelas untuk pembaca layar. |
| **Efisiensi Jaringan** | Menggunakan mekanisme caching lokal (`sessionStorage`) untuk tabel referensi statis (14 kecamatan & desa) agar tidak memanggil backend secara berulang. |

---

## 12. Rencana Uji Antarmuka dan Kriteria Penerimaan (Acceptance Criteria)

### 12.1 Skenario Pengujian Fungsional UI (UAT Matrix)

- [ ] **UAT-01 (Navigasi Sesuai Role):** Login sebagai `operator_pesantren` hanya menampilkan menu Dashboard, Direktori (milik lembaganya), Buku Induk, dan Profil Saya. Menu Verifikasi, Pengguna, dan Pengaturan tidak muncul.
- [ ] **UAT-02 (Pencarian & Filter):** Filter kecamatan "Sayung" pada direktori berhasil memfilter dan hanya menampilkan pesantren di Kecamatan Sayung secara konsisten.
- [ ] **UAT-03 (Penerbitan ID Otomatis):** Form tambah pesantren berhasil menyimpan record baru, dan server mengembalikan kode resmi `RMI-DMK-XXXXXX` yang langsung tampil pada halaman detail tanpa reload manual.
- [ ] **UAT-04 (Pencegahan Form Kosong):** Menekan tombol simpan dengan field nama kosong memunculkan pesan error validasi inline berwarna merah dan mencegah request terkirim ke backend.
- [ ] **UAT-05 (Workflow Verifikasi):** Admin Kabupaten dapat membuka antrean verifikasi, memberikan catatan revisi, dan status pesantren di direktori langsung terbarui menjadi `revision_required`.
- [ ] **UAT-06 (Pemetaan Koordinat):** Menggeser pin marker pada modul peta berhasil memperbarui nilai koordinat latitude dan longitude di input form secara real-time.
- [ ] **UAT-07 (Cetak Buku Induk):** Membuka tampilan cetak Buku Induk Pesantren menghasilkan format dokumen ramah cetak (A4/clean layout) tanpa elemen navigasi sidebar atau tombol UI.
- [ ] **UAT-08 (Ekspor Terproteksi):** Pengguna tanpa izin ekspor tidak dapat melihat tombol unduh CSV/Excel di modul Laporan.

### 12.2 Definition of Done (DoD) — Sprint 02D

Spesifikasi dan implementasi antarmuka Admin Dashboard MVP dinyatakan selesai dan siap untuk integrasi pilot apabila:
1. Seluruh 11 modul menu memiliki representasi antarmuka yang lengkap dan terhubung dengan API Action backend Apps Script.
2. Kontrak data 100% konsisten dengan `Database_Dictionary_v1.0.md` dan `Apps_Script_Backend_Specification_v1.0.md`.
3. Seluruh skenario pengujian fungsional kritis (UAT-01 s/d UAT-08) lulus uji tanpa blocker.
4. Desain antarmuka telah diverifikasi responsif pada perangkat uji desktop dan mobile.
5. Pemilik program (RMI NU Demak) melakukan peninjauan dan memberikan persetujuan tertulis atas alur interaksi antarmuka.

---

## 13. Rencana Implementasi Bertahap (Sprint 02D Breakdown)

Pembangunan antarmuka Admin Dashboard MVP dibagi menjadi 4 sub-tahap terukur:

```text
Sub-Tahap 2D.1: Fondasi Shell, Layout Global & Sistem State
  ├── Penyusunan template HTML modular, Navbar, Sidebar dinamis, dan Footer.
  ├── Konfigurasi Tailwind CSS dan ikon sistem.
  ├── Pembuatan API client adapter (`apiClient.js`) untuk komunikasi ke Apps Script.
  └── Mockup data sesi pengguna dan pengujian RBAC view switcher.

Sub-Tahap 2D.2: Modul Inti Master Data & Formulir Profil
  ├── Pembangunan modul Direktori Pesantren (Tabel, Filter, Pagination).
  ├── Pembangunan form Tambah Pesantren dan modal deteksi duplikasi.
  └── Pembangunan tabulasi Buku Induk Pesantren (Formulir multi-tab profil lembaga).

Sub-Tahap 2D.3: Modul Geospasial & Alur Kerja Verifikasi
  ├── Integrasi Leaflet.js untuk Modul Lokasi & Pemetaan se-Kabupaten Demak.
  ├── Pembangunan ruang kerja Verifikasi Data (Review checklist & modal putusan).
  └── Pembangunan modul persetujuan publikasi dan status izin tayang.

Sub-Tahap 2D.4: Modul Laporan, Pengguna, Audit & Hardening
  ├── Pembuatan Modul Laporan, Statistik Agregat, dan Ekspor CSV/Excel.
  ├── Pembangunan antarmuka Manajemen Pengguna dan penugasan cakupan.
  ├── Tampilan Riwayat Aktivitas / Audit Log dan Pengaturan Sistem.
  └── Pengujian kompatibilitas lintas peramban, responsivitas mobile, dan UAT akhir.
```

---

## 14. Penutup

Dokumen **Admin Dashboard MVP Specification v1.0** ini mengikat secara fungsional seluruh kebutuhan pengguna ke dalam desain antarmuka yang tertib, aman, dan berorientasi data. Dengan spesifikasi ini, proses pengembangan frontend dapat dieksekusi secara terarah tanpa deviasi arsitektur, menjamin kesiapan transisi menuju sistem permanen berbasis Node.js dan Supabase PostgreSQL di masa mendatang.

**Status Dokumen:** DRAFT SPESIFIKASI — Menunggu Review & Tanda Tangan Persetujuan Pemilik Program.

---
*Demak Pesantren Data & Development — RMI PCNU Kabupaten Demak*

