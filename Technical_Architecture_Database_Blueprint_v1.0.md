# TECHNICAL ARCHITECTURE & DATABASE BLUEPRINT v1.0

## DEMAK PESANTREN DATA & DEVELOPMENT

**Program Pendataan, Pemetaan, Profiling, dan Penguatan Tata Kelola
Pesantren Kabupaten Demak**

  -----------------------------------------------------------------------
  Informasi                           Keterangan
  ----------------------------------- -----------------------------------
  Dokumen                             Technical Architecture & Database
                                      Blueprint

  Versi                               1.0

  Status                              Disetujui sebagai acuan arsitektur

  Pemilik Program                     RMI NU Demak

  Platform                            Pesantren Data Center

  Website publik                      https://rminudemak.org

  Tahap awal                          HTML, CSS, JavaScript, Google Apps
                                      Script, Google Sheets

  Arsitektur tujuan                   Node.js / Next.js dan Supabase
                                      PostgreSQL
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 1. Tujuan Dokumen

Dokumen ini menetapkan arsitektur teknis dan prinsip pengelolaan data
Pesantren Data Center. Dokumen menjadi acuan bagi perancangan database,
pengembangan backend, Admin Dashboard, integrasi website publik, serta
migrasi dari prototype menuju sistem permanen.

Sistem dirancang untuk mendata, memverifikasi, memetakan, membuat
profil, dan mendukung pengembangan pesantren di Kabupaten Demak.

Prinsip utama:

> **Build once, evolve progressively.** Struktur data, identitas, aturan
> bisnis, dan kontrak API dirancang agar implementasi dapat berkembang
> tanpa merancang ulang seluruh sistem.

Persetujuan blueprint ini tidak dengan sendirinya mengizinkan deployment
atau perubahan pada website produksi. Perubahan produksi tetap
memerlukan persetujuan tersendiri.

## 2. Ruang Lingkup

### 2.1 Termasuk dalam cakupan

-   Master data pesantren di Kabupaten Demak.
-   Identitas internal RMI NU Demak.
-   Alamat dan lokasi geografis.
-   Data pimpinan, kontak, legalitas, pendidikan, sumber daya,
    fasilitas, dan program.
-   Profiling kebutuhan dan potensi pengembangan pesantren.
-   Pendataan, pembaruan, dan verifikasi.
-   Buku Induk Pesantren.
-   Statistik dan laporan.
-   Pengelolaan pengguna dan hak akses.
-   Publikasi data terpilih ke website RMI NU Demak.
-   Riwayat perubahan dan audit aktivitas.
-   Migrasi dari Google Sheets ke PostgreSQL.

### 2.2 Di luar cakupan awal

-   Pengelolaan data pribadi setiap santri.
-   Sistem akademik atau keuangan pesantren.
-   Sistem registrasi atau akreditasi pemerintah.
-   Pengelolaan kasus perlindungan santri secara individual.
-   Penggantian EMIS, NSPP, atau sistem resmi pemerintah.

Data santri pada tahap ini hanya berupa angka agregat. Data kasus
perlindungan santri harus berada pada sistem terpisah dengan tata kelola
akses khusus.

## 3. Prinsip Arsitektur

1.  **Single source of truth:** satu sumber data induk untuk data
    pesantren.
2.  **Schema-first:** struktur data ditetapkan sebelum membangun
    spreadsheet atau antarmuka.
3.  **API-first:** frontend berkomunikasi dengan backend melalui kontrak
    API yang terdokumentasi.
4.  **Backend-controlled:** semua operasi tulis dan pemeriksaan hak
    akses dilakukan di backend.
5.  **Stable identity:** setiap pesantren memiliki UUID internal dan
    kode RMI permanen.
6.  **Traceability:** perubahan data penting dapat ditelusuri.
7.  **Data minimization:** hanya mengumpulkan data yang diperlukan untuk
    tujuan program.
8.  **Publication by approval:** data internal tidak otomatis menjadi
    data publik.
9.  **Migration-ready:** implementasi awal mengikuti struktur relasional
    yang dapat dipindahkan ke PostgreSQL.
10. **No production change without approval:** pengembangan dan
    pengujian dilakukan terpisah dari produksi.

## 4. Keputusan Teknologi

### 4.1 Tahap awal: prototype dan pilot

  -----------------------------------------------------------------------
  Lapisan                 Teknologi               Tanggung jawab
  ----------------------- ----------------------- -----------------------
  Frontend                HTML, CSS, JavaScript   Website dan Admin
                                                  Dashboard

  Backend sementara       Google Apps Script      API, validasi, proses
                                                  bisnis

  Penyimpanan sementara   Google Sheets           Record data terstruktur

  Dokumen                 Google Drive            Penyimpanan file dengan
                                                  akses terbatas

  Version control         GitHub                  Pengelolaan source
                                                  code, bila sesuai
  -----------------------------------------------------------------------

Google Sheets dan Apps Script digunakan untuk validasi proses bisnis dan
pilot. Keduanya bukan target infrastruktur jangka panjang untuk
operasional berskala besar.

### 4.2 Arsitektur tujuan

  -----------------------------------------------------------------------
  Lapisan                             Teknologi yang direncanakan
  ----------------------------------- -----------------------------------
  Runtime backend                     Node.js

  Framework aplikasi                  Next.js sebagai kandidat utama

  API                                 REST API / Next.js Route Handlers

  Database                            Supabase PostgreSQL

  Authentication                      Supabase Auth atau solusi yang
                                      diputuskan saat implementasi

  File storage                        Supabase Storage

  Version control                     GitHub

  Frontend                            HTML/JavaScript yang berevolusi
                                      atau Next.js
  -----------------------------------------------------------------------

Pemilihan final framework, hosting, dan konfigurasi infrastruktur
dilakukan setelah kebutuhan operasional dan kondisi website diperiksa.
Tidak diasumsikan bahwa Supabase telah aktif hanya karena source code
frontend memuat konfigurasi atau client Supabase.

## 5. Arsitektur Logis

### 5.1 Diagram target

``` text
PUBLIC USERS
    |
    v
rminudemak.org
Public Website
    |
    v
Public API (read-only, approved data)

ADMIN USERS
    |
    v
data.rminudemak.org (proposed)
Admin Dashboard
    |
    v
Application Backend (Node.js / Next.js)
    |
    +-- Authentication
    +-- Authorization / RBAC
    +-- Validation
    +-- Business Services
    +-- Audit Logging
    |
    v
Supabase PostgreSQL
    |
    +-- Master Data
    +-- Verification
    +-- History / Audit
    +-- Reference Data
    |
    v
Supabase Storage
Private documents and approved public assets
```

### 5.2 Arsitektur prototype

Pada tahap prototype, Google Apps Script menggantikan Application
Backend dan Google Sheets menggantikan PostgreSQL. Frontend tetap
berkomunikasi dengan backend melalui kontrak JSON yang dirancang agar
dapat digunakan kembali oleh Node.js.

### 5.3 Pemisahan kanal

-   **Website publik:** menampilkan profil organisasi, direktori, peta,
    statistik, dan informasi yang telah disetujui.
-   **Admin Dashboard:** mengelola data, operator, verifikasi, laporan,
    dan publikasi.
-   **Backend:** satu-satunya jalur untuk validasi, proses bisnis, dan
    operasi tulis.
-   **Database:** menyimpan data induk dan relasinya.

Subdomain `data.rminudemak.org` merupakan usulan, bukan konfigurasi yang
sudah aktif.

## 6. Model Operasional Pendataan Hybrid

Model pendataan yang disetujui adalah **hybrid: identifikasi oleh tim
RMI NU Demak, dilanjutkan pelengkapan dan pembaruan oleh operator
pesantren**.

### 6.1 Tahap A --- Identifikasi oleh RMI NU Demak

Tim Kabupaten atau petugas yang ditugaskan:

1.  Mengidentifikasi pesantren dari sumber yang tersedia.
2.  Memeriksa kemungkinan duplikasi.
3.  Membuat record awal dengan informasi minimum.
4.  Menetapkan kecamatan dan desa berdasarkan referensi wilayah.
5.  Mencatat sumber informasi.
6.  Menerbitkan ID internal setelah pemeriksaan duplikasi dan kelayakan
    record.
7.  Menetapkan status awal pendataan dan verifikasi.

Record awal tidak boleh dianggap telah terverifikasi hanya karena sudah
dibuat oleh tim RMI.

### 6.2 Tahap B --- Undangan dan penugasan operator pesantren

1.  RMI menunjuk atau mengundang operator dari pesantren.
2.  Admin memverifikasi hubungan operator dengan lembaga.
3.  Akun operator dibuat atau diaktifkan.
4.  Operator ditautkan hanya ke pesantren yang menjadi tanggung
    jawabnya.
5.  Aktivasi dan perubahan penugasan dicatat.

Operator tidak boleh dapat mengklaim atau mengambil alih record
pesantren lain hanya dengan mengetahui kode pesantren.

### 6.3 Tahap C --- Pelengkapan oleh pesantren

Operator pesantren dapat:

-   Melengkapi identitas dan alamat.
-   Memperbarui data pengasuh dan kontak resmi.
-   Mengisi data legalitas.
-   Mengisi program pendidikan.
-   Memperbarui angka agregat santri dan SDM.
-   Mengisi fasilitas, program, potensi, dan kebutuhan.
-   Mengunggah dokumen yang diminta.
-   Mengajukan data untuk diperiksa.

Operator tidak dapat menyetujui verifikasi atas datanya sendiri atau
mengubah status verifikasi final.

### 6.4 Tahap D --- Pemeriksaan dan verifikasi RMI

Petugas berwenang:

-   Memeriksa kelengkapan.
-   Memeriksa konsistensi.
-   Meminta revisi.
-   Memverifikasi identitas dan dokumen sesuai kewenangan.
-   Memverifikasi lokasi.
-   Mencatat sumber dan hasil pemeriksaan.
-   Menyetujui atau menolak publikasi sesuai kebijakan.

Verifikasi administratif RMI bukan akreditasi atau pengesahan
pemerintah.

### 6.5 Prinsip pembagian tanggung jawab

  -----------------------------------------------------------------------
  Aktivitas                             Tim RMI        Operator Pesantren
  ------------------- ------------------------- -------------------------
  Identifikasi awal                       Utama               Tidak wajib

  Membuat record awal                        Ya                     Tidak

  Menetapkan ID RMI          Ya, melalui sistem                     Tidak

  Melengkapi profil              Dapat membantu                     Utama

  Mengunggah dokumen             Dapat membantu                        Ya

  Mengajukan                                 Ya                        Ya
  pembaruan                                     

  Verifikasi final        Ya, petugas berwenang                     Tidak

  Persetujuan                   Pihak berwenang  Memberi persetujuan yang
  publikasi                                                    diperlukan

  Mengelola pengguna                      Admin                     Tidak
  dan role                                      
  -----------------------------------------------------------------------

## 7. Identitas Pesantren

### 7.1 Primary key

Setiap record menggunakan UUID sebagai primary key internal database.

### 7.2 Kode pesantren RMI

Format:

`RMI-DMK-000001`

Ketentuan:

-   Unik dan permanen.
-   Dibuat oleh backend, bukan frontend.
-   Tidak dapat dipilih atau diubah operator.
-   Tidak berubah ketika nama pesantren berubah.
-   Tidak digunakan ulang ketika pesantren tidak aktif atau record
    diarsipkan.
-   Penerbitan dicatat dalam audit log.

### 7.3 Pencegahan duplikasi

Sebelum record baru dibuat, sistem memeriksa kombinasi informasi yang
tersedia, seperti nama, desa, kecamatan, alamat, NSPP, dan sumber data.
Kecocokan menghasilkan peringatan untuk pemeriksaan manusia, bukan
penggabungan otomatis.

Penerbitan kode harus atomik. Pada Apps Script gunakan `LockService` dan
mekanisme sequence terpusat. Pada PostgreSQL gunakan sequence atau
transaksi yang aman terhadap konkurensi.

## 8. Domain Model dan Kelompok Tabel

Nama tabel menggunakan huruf kecil dan `snake_case`.

  Kelompok              Tabel utama
  --------------------- --------------------------------------------------
  Master                `pesantren`, `pesantren_locations`
  Pengurus dan kontak   `pesantren_leaders`, `pesantren_contacts`
  Legalitas             `pesantren_legalities`
  Pendidikan            `pesantren_education`, `pesantren_programs`
  Sumber daya           `pesantren_resources`, `pesantren_facilities`
  Profiling             `pesantren_development_profiles`
  Verifikasi            `pesantren_verifications`
  Dokumen               `document_files`
  Publikasi             `publication_consents`
  Sumber data           `data_sources`
  Histori               `data_history`, `audit_logs`, `annual_snapshots`
  Pengguna              `users`, `roles`, `user_assignments`
  Referensi             `districts`, `villages`
  Sistem                `id_sequences`, `system_settings`

Definisi kolom lengkap ditetapkan dalam dokumen terpisah **Database
Dictionary v1.0**.

### 8.1 Relasi utama

-   Satu pesantren dapat memiliki banyak lokasi, pimpinan, kontak,
    legalitas, program, fasilitas, data sumber daya, hasil profiling,
    dokumen, verifikasi, dan histori.
-   Satu kecamatan memiliki banyak desa.
-   Satu desa berada dalam satu kecamatan.
-   Satu pengguna dapat memiliki beberapa penugasan, tetapi setiap
    penugasan dibatasi oleh role dan cakupannya.
-   Satu operator pesantren hanya dapat mengelola pesantren yang
    ditugaskan kepadanya.
-   Setiap perubahan penting dapat ditautkan ke pengguna dan record
    terkait.

### 8.2 Aturan integritas

-   Primary key menggunakan UUID.
-   Foreign key harus valid.
-   Kode pesantren unik.
-   NSPP, bila tersedia, disimpan sebagai identifier referensi dan
    diberi aturan keunikan yang mempertimbangkan data kosong dan
    kualitas sumber.
-   Data tahunan tidak menimpa snapshot tahun sebelumnya.
-   Penghapusan record utama menggunakan mekanisme arsip/nonaktif, bukan
    hard delete rutin.
-   Record anak tidak boleh dibiarkan menjadi yatim.
-   Timestamp disimpan konsisten dan ditampilkan sesuai zona waktu
    pengguna.

## 9. Status dan Workflow

Status berikut adalah dimensi terpisah dan tidak boleh digabung menjadi
satu kolom status.

### 9.1 Status pendataan

-   `draft`
-   `submitted`
-   `revision_required`
-   `completed`

### 9.2 Status verifikasi

-   `not_verified`
-   `under_review`
-   `verified`
-   `rejected`

### 9.3 Status lokasi

-   `not_verified`
-   `under_review`
-   `verified`
-   `needs_correction`

### 9.4 Status publikasi

-   `private`
-   `pending_approval`
-   `approved`
-   `published`
-   `unpublished`

### 9.5 Aturan workflow

-   Operator mengajukan data melalui status `submitted`.
-   Petugas RMI memeriksa dan dapat meminta revisi.
-   Hanya petugas berwenang yang dapat menetapkan status verifikasi
    final.
-   Data terverifikasi belum tentu boleh dipublikasikan.
-   Publikasi memerlukan persetujuan dan pemeriksaan kelayakan data.
-   Perubahan substansial setelah verifikasi dapat memicu verifikasi
    ulang pada bagian terkait.
-   Status setiap dimensi disimpan dan diaudit secara terpisah.

## 10. Google Sheets sebagai Temporary Database

Satu spreadsheet khusus organisasi digunakan sebagai penyimpanan awal.
Setiap tabel direpresentasikan sebagai worksheet dengan header tetap.

Worksheet yang direncanakan:

1.  `pesantren`
2.  `pesantren_locations`
3.  `pesantren_leaders`
4.  `pesantren_contacts`
5.  `pesantren_legalities`
6.  `pesantren_education`
7.  `pesantren_resources`
8.  `pesantren_facilities`
9.  `pesantren_programs`
10. `pesantren_development_profiles`
11. `pesantren_verifications`
12. `document_files`
13. `data_sources`
14. `publication_consents`
15. `data_history`
16. `audit_logs`
17. `annual_snapshots`
18. `users`
19. `roles`
20. `user_assignments`
21. `districts`
22. `villages`
23. `id_sequences`
24. `system_settings`

Aturan worksheet:

-   Baris pertama berisi nama kolom yang identik dengan Database
    Dictionary.
-   Tidak menggunakan merged cells.
-   UUID menjadi identitas record, bukan nomor baris.
-   Relasi menggunakan UUID.
-   Tanggal menggunakan format ISO 8601.
-   Nilai status memakai daftar baku.
-   Tidak mengubah nama kolom tanpa pembaruan dokumentasi.
-   Akses langsung ke spreadsheet dibatasi hanya kepada administrator
    teknis yang membutuhkan.
-   Operator pesantren tidak diberi akses langsung ke spreadsheet.
-   Semua perubahan aplikasi melewati Apps Script.
-   Backup dan uji pemulihan dilakukan secara berkala.

Google Sheets bukan database relasional. Apps Script bertanggung jawab
memvalidasi relasi, konsistensi, hak akses, dan transaksi semu yang
diperlukan.

## 11. Backend Prototype: Google Apps Script

### 11.1 Tanggung jawab

-   Menerima request frontend.
-   Memvalidasi input.
-   Mengautentikasi dan mengotorisasi pengguna.
-   Membatasi cakupan data sesuai penugasan.
-   Menjalankan aturan bisnis.
-   Membaca dan menulis worksheet.
-   Menghasilkan ID secara aman.
-   Mencatat audit dan histori.
-   Mengelola metadata dokumen.
-   Menyediakan API untuk dashboard dan website publik.

### 11.2 Struktur kode

``` text
apps-script/
├── Config.gs
├── Router.gs
├── Response.gs
├── Validation.gs
├── Auth.gs
├── Permission.gs
├── Services/
│   ├── PesantrenService.gs
│   ├── LocationService.gs
│   ├── VerificationService.gs
│   ├── BookService.gs
│   ├── ReportService.gs
│   └── DocumentService.gs
├── Repositories/
│   ├── PesantrenRepository.gs
│   ├── LocationRepository.gs
│   ├── UserRepository.gs
│   └── AuditRepository.gs
└── Utils/
    ├── IdGenerator.gs
    ├── DateUtils.gs
    └── SheetUtils.gs
```

Service memuat aturan bisnis. Repository menjadi lapisan akses
penyimpanan. Dengan pemisahan ini, implementasi Repository dapat diganti
ketika database berpindah ke PostgreSQL.

### 11.3 Kontrak API

API menggunakan JSON dengan bentuk respons konsisten.

Berhasil:

``` json
{
  "success": true,
  "message": "Data pesantren berhasil disimpan",
  "data": {
    "id": "uuid",
    "kode_pesantren": "RMI-DMK-000001"
  }
}
```

Gagal:

``` json
{
  "success": false,
  "message": "Validasi data gagal",
  "errors": [
    {
      "field": "nama_resmi",
      "message": "Nama pesantren wajib diisi"
    }
  ]
}
```

Endpoint konseptual:

  Method   Endpoint                          Fungsi
  -------- --------------------------------- ---------------------
  GET      `/api/v1/pesantren`               Daftar pesantren
  GET      `/api/v1/pesantren/{id}`          Detail pesantren
  POST     `/api/v1/pesantren`               Membuat record awal
  PUT      `/api/v1/pesantren/{id}`          Memperbarui data
  POST     `/api/v1/pesantren/{id}/submit`   Mengajukan data
  POST     `/api/v1/pesantren/{id}/verify`   Verifikasi petugas
  GET      `/api/v1/reports/summary`         Statistik
  GET      `/api/v1/reports/export`          Ekspor laporan

Endpoint di atas merupakan kontrak rancangan, bukan URL yang sudah
aktif. Kontrak request, response, pagination, error code, dan
autentikasi harus didetailkan sebelum implementasi.

## 12. Autentikasi dan Hak Akses

Role utama:

  Role                   Cakupan
  ---------------------- ------------------------------------------
  `super_admin`          Seluruh sistem dan konfigurasi
  `admin_kabupaten`      Seluruh data kabupaten sesuai kewenangan
  `admin_kecamatan`      Data pada kecamatan yang ditugaskan
  `operator_pesantren`   Data pesantren yang ditugaskan

Ketentuan:

-   Setiap pengguna memiliki akun sendiri.
-   Pengguna tidak boleh berbagi akun.
-   Penugasan operator harus diverifikasi.
-   Operator tidak dapat memverifikasi datanya sendiri.
-   Admin Kecamatan dibatasi ke wilayah penugasannya.
-   Hak akses diperiksa di backend, bukan hanya dengan menyembunyikan
    menu.
-   Perubahan role dan penugasan dicatat.
-   Akun yang tidak lagi berwenang harus dinonaktifkan atau dicabut
    aksesnya.

Pada tahap Apps Script, metode autentikasi dan deployment harus diuji
secara khusus. Jangan menganggap identitas email yang dikirim frontend
sebagai bukti autentikasi. Jika Apps Script tidak dapat memenuhi
kebutuhan autentikasi dan pembatasan akses dengan aman, peluncuran untuk
operator eksternal harus ditunda sampai mekanisme yang layak tersedia.

## 13. Dokumen dan File

Dokumen disimpan terpisah dari record data. Database hanya menyimpan
metadata dan lokasi penyimpanan.

Aturan:

-   File tidak dibuat publik secara default.
-   Akses file memerlukan pemeriksaan izin.
-   Batasi ekstensi, MIME type, dan ukuran.
-   Nama file penyimpanan dibuat aman dan tidak mengandalkan nama asli.
-   Catat pengunggah dan waktu unggah.
-   Hindari menyimpan dokumen sensitif pada folder Drive yang dapat
    diakses melalui tautan publik.
-   Pada migrasi, file dipindahkan dengan pemetaan metadata yang tetap
    mempertahankan relasi.

## 14. Keamanan dan Privasi

Klasifikasi data:

  -----------------------------------------------------------------------
  Kategori                Contoh                  Akses
  ----------------------- ----------------------- -----------------------
  Public                  Nama pesantren, alamat  Publik setelah
                          publik, kontak resmi    persetujuan
                          yang disetujui          

  Internal                Profil kelembagaan,     Pengguna berwenang
                          statistik internal,     
                          catatan tindak lanjut   

  Restricted              Dokumen identitas,      Pengguna dengan izin
                          kontak pribadi, dokumen khusus
                          legalitas terbatas      
  -----------------------------------------------------------------------

Kontrol minimum:

-   Validasi seluruh input di server.
-   Otorisasi untuk setiap operasi baca dan tulis.
-   Proteksi endpoint dari penyalahgunaan.
-   Pembatasan upload.
-   Audit log.
-   Backup dan pengujian restore.
-   Pemisahan development, staging, dan production.
-   Pengelolaan secret di server.
-   Tidak menanam service-role key atau kredensial rahasia dalam
    frontend.
-   RLS pada Supabase sebagai lapisan tambahan.
-   Kebijakan retensi dan penghapusan data ditetapkan sebelum
    operasional penuh.

## 15. Integrasi Website Publik

`rminudemak.org` tetap menjadi website publik organisasi.

Pesantren Data Center menjadi sumber data direktori dan statistik yang
telah disetujui.

Aturan:

1.  Website publik tidak mengelola master data secara terpisah.
2.  Website mengambil data melalui public API yang read-only.
3.  API publik hanya mengembalikan field yang disetujui untuk publikasi.
4.  Dokumen internal, kontak pribadi, catatan verifikasi, dan histori
    tidak boleh ikut terekspos.
5.  Data statistik menampilkan definisi dan periode.
6.  Integrasi dilakukan bertahap tanpa mengganti keseluruhan website.
7.  Data lembaga lain seperti Madin dan TPQ tidak otomatis dimasukkan ke
    master pesantren; perlu domain dan keputusan cakupan tersendiri.

Source code website yang diperiksa menunjukkan adanya inisialisasi
Supabase client dan query ke tabel `lembaga`. Hal tersebut belum
membuktikan database Supabase aktif atau tersedia. Konfigurasi itu harus
diverifikasi sebelum dipakai atau dihapus.

## 16. Strategi Migrasi ke Node.js dan Supabase

### Tahap 1 --- Persiapan

-   Bekukan versi Database Dictionary.
-   Validasi header worksheet.
-   Pastikan UUID dan kode RMI konsisten.
-   Bersihkan duplikasi.
-   Validasi referensi wilayah.
-   Inventarisasi file dan metadata.

### Tahap 2 --- Ekspor

-   Ekspor worksheet dalam format terstruktur.
-   Catat jumlah record per tabel.
-   Catat waktu snapshot.
-   Simpan backup sumber.
-   Validasi tipe dan format data.

### Tahap 3 --- Pembuatan PostgreSQL

-   Buat tabel, primary key, foreign key, index, constraint, dan
    sequence.
-   Terapkan kebijakan RLS.
-   Siapkan autentikasi dan role.
-   Siapkan storage bucket privat.
-   Uji migrasi pada staging.

### Tahap 4 --- Import dan rekonsiliasi

-   Import tabel referensi terlebih dahulu.
-   Import master pesantren.
-   Import tabel relasi.
-   Import histori dan audit yang diperlukan.
-   Migrasikan file dan metadata.
-   Cocokkan jumlah record dan integritas relasi.

### Tahap 5 --- Cutover

-   Tentukan waktu perpindahan.
-   Bekukan sementara penulisan pada sistem lama.
-   Lakukan ekspor final.
-   Import perubahan terakhir.
-   Uji fungsi kritis.
-   Alihkan aplikasi ke backend baru.
-   Simpan sistem lama sebagai arsip read-only sesuai kebijakan.

Jangan menjadikan dua database sebagai sumber kebenaran aktif secara
bersamaan tanpa strategi sinkronisasi yang teruji.

## 17. Dashboard dan Modul MVP

Menu Admin Dashboard:

1.  Dashboard.
2.  Direktori Pesantren.
3.  Tambah Pesantren.
4.  Verifikasi Data.
5.  Lokasi dan Pemetaan.
6.  Buku Induk Pesantren.
7.  Laporan dan Statistik.
8.  Pengguna dan Hak Akses.
9.  Referensi Wilayah.
10. Riwayat Aktivitas.
11. Pengaturan Sistem.

Dashboard menampilkan angka aktual dari data, antara lain total
teridentifikasi, data masuk, data terverifikasi, lokasi terverifikasi,
progres per kecamatan, dan antrean tindak lanjut. Tidak boleh
menggunakan angka statis yang tampak sebagai statistik aktual.

MVP memprioritaskan identifikasi, pelengkapan data, pencarian,
verifikasi dasar, dan laporan. GIS lanjutan serta profiling komprehensif
dapat dikembangkan setelah alur inti stabil.

## 18. Non-Functional Requirements

  Aspek             Persyaratan
  ----------------- ------------------------------------------
  Reliability       Backup dan prosedur pemulihan tersedia
  Security          Akses berdasarkan role dan penugasan
  Maintainability   Kode modular dan terdokumentasi
  Scalability       Dapat berkembang untuk cakupan kabupaten
  Portability       Data dapat diekspor dan dimigrasikan
  Auditability      Perubahan penting dapat ditelusuri
  Usability         Dapat digunakan operator nonteknis
  Integrity         ID dan relasi konsisten
  Availability      Gangguan memiliki prosedur penanganan

## 19. Tahapan Implementasi

  -----------------------------------------------------------------------
  Tahap                   Fokus                   Deliverable
  ----------------------- ----------------------- -----------------------
  02A                     Arsitektur dan standar  Blueprint dan Database
                          data                    Dictionary

  02B                     Persiapan penyimpanan   Google Sheets Database
                          awal                    Template

  02C                     Backend sementara       Apps Script API

  02D                     Antarmuka administrasi  Admin Dashboard MVP

  02E                     Workflow                Pelengkapan,
                                                  verifikasi, dan laporan

  02F                     Pilot                   Hasil uji dan perbaikan

  03                      Migrasi permanen        Node.js dan Supabase
                                                  PostgreSQL
  -----------------------------------------------------------------------

## 20. Acceptance Criteria

Blueprint menjadi acuan implementasi apabila:

-   [x] Arah arsitektur bertahap ditetapkan.
-   [x] Model pendataan hybrid disetujui.
-   [x] Pemisahan website publik dan Admin Dashboard ditetapkan.
-   [x] Prinsip schema-first dan API-first ditetapkan.
-   [x] Standar ID internal ditetapkan.
-   [x] Kelompok tabel utama ditetapkan.
-   [x] Pemisahan status pendataan, verifikasi, lokasi, dan publikasi
    ditetapkan.
-   [x] Arah migrasi ke Node.js dan PostgreSQL ditetapkan.
-   [ ] Database Dictionary disahkan sebagai spesifikasi kolom.
-   [ ] Google Sheets Database Template diuji.
-   [ ] Autentikasi dan hak akses prototype diuji.
-   [ ] Backup dan pemulihan diuji.

## 21. Keputusan Lanjutan sebelum Implementasi

Hal-hal berikut perlu ditetapkan dalam spesifikasi operasional:

1.  Akun Google dan kepemilikan aset organisasi.
2.  Penanggung jawab Super Admin dan administrator teknis.
3.  Proses verifikasi identitas operator pesantren.
4.  Prosedur penunjukan dan pencabutan operator.
5.  Kebutuhan dan persetujuan penyimpanan dokumen.
6.  Referensi resmi kecamatan dan desa.
7.  Kebijakan retensi, koreksi, arsip, dan publikasi data.
8.  Hosting, domain admin, dan lingkungan staging.

## 22. Penutup

Technical Architecture & Database Blueprint v1.0 menjadi acuan
pengembangan Pesantren Data Center. Google Sheets dan Apps Script
dipakai untuk menguji proses dan menjalankan pilot secara terkendali.
Node.js dan Supabase PostgreSQL menjadi arsitektur tujuan setelah
kebutuhan, keamanan, dan kesiapan migrasi terpenuhi.

> **Satu data induk, satu identitas pesantren, satu standar verifikasi,
> dan satu sumber kebenaran bagi ekosistem data pesantren RMI NU
> Demak.**
