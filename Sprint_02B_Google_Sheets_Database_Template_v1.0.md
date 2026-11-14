# SPRINT 02B --- GOOGLE SHEETS DATABASE TEMPLATE v1.0

**Program:** DEMAK PESANTREN DATA & DEVELOPMENT\
**Platform:** Pesantren Data Center RMI NU Demak\
**Document ID:** `DPDD-SPRINT-02B-GS-TEMPLATE-v1.0`\
**Version:** 1.0\
**Status:** DRAFT IMPLEMENTATION SPECIFICATION --- REVIEW REQUIRED\
**Parent Documents:** -
`Technical_Architecture_Database_Blueprint_v1.0.md` -
`Database_Dictionary_v1.0.md`

------------------------------------------------------------------------

## 1. Tujuan

Dokumen ini menetapkan spesifikasi workbook Google Sheets yang akan
menjadi basis data operasional awal Pesantren Data Center. Workbook
dirancang sebagai **prototipe operasional yang terstruktur dan dapat
dimigrasikan**, bukan spreadsheet ad hoc.

Google Sheets digunakan sebagai penyimpanan data awal, sedangkan Google
Apps Script bertindak sebagai lapisan aplikasi/server-side untuk
validasi, ID generation, workflow, dan akses data. Struktur data harus
menjaga kompatibilitas konseptual dengan model relasional
PostgreSQL/Supabase pada tahap migrasi.

Dokumen ini adalah spesifikasi template. Pembuatan workbook dan Apps
Script merupakan pekerjaan implementasi terpisah setelah spesifikasi
ditinjau.

## 2. Prinsip Desain

1.  **Database-first:** struktur mengikuti entitas dan relasi data,
    bukan mengikuti tampilan formulir.
2.  **Satu sumber data:** satu workbook utama menjadi sumber data
    operasional untuk fase awal.
3.  **Satu baris satu record:** setiap baris data mewakili satu record;
    jangan menyimpan beberapa entitas dalam satu sel.
4.  **Stable identifiers:** setiap record memiliki primary key teknis
    yang stabil. `pesantren_id` dan kode internal tidak boleh bergantung
    pada nomor baris.
5.  **Relasi melalui ID:** hubungan antar-sheet menggunakan ID, bukan
    nama lembaga/nama orang.
6.  **Controlled vocabularies:** status, kategori, dan pilihan baku
    menggunakan sheet referensi atau validasi.
7.  **Auditability:** perubahan penting memiliki waktu, pelaku, sumber,
    dan riwayat.
8.  **Privacy by design:** data internal, terbatas, dan publik
    dipisahkan secara logis; jangan menyimpan data pribadi santri pada
    fase pendataan institusi.
9.  **Migration-ready:** nama kolom konsisten, tidak memakai merged
    cells, subtotal, formula presentasi, atau header bertingkat di tabel
    transaksi.
10. **Apps Script only access path:** pengguna tidak diberi akses edit
    langsung ke workbook utama. Akses dilakukan melalui aplikasi/form
    yang dikendalikan Apps Script.

## 3. Batasan dan Keputusan Penting

### 3.1 Google Sheets bukan database relasional penuh

Google Sheets tidak menyediakan foreign key, transaksi ACID, row-level
security, atau concurrency control setara PostgreSQL. Karena itu:

-   validasi relasi harus dilakukan oleh Apps Script;
-   operasi pembuatan ID harus menggunakan `LockService`;
-   akses workbook dibatasi kepada akun teknis dan administrator yang
    berwenang;
-   perubahan data penting dicatat dalam log;
-   backup dan pengujian restore wajib dilakukan;
-   beban penggunaan dan batas kuota Google Apps Script harus dipantau.

### 3.2 Pola pendataan hybrid

Alur operasional:

1.  Tim RMI NU Demak mengidentifikasi pesantren dan membuat record awal.
2.  Sistem menerbitkan ID internal setelah pemeriksaan duplikasi dan
    kelengkapan minimum.
3.  Admin Kabupaten menunjuk atau mengundang operator pesantren.
4.  Operator pesantren melengkapi dan memperbarui profil lembaganya
    sendiri.
5.  Perubahan tertentu masuk antrean pemeriksaan/verifikasi.
6.  Verifikator RMI memeriksa data dan menetapkan status verifikasi.
7.  Data publik hanya diterbitkan setelah persetujuan publikasi yang
    sesuai.

Operator pesantren tidak memperoleh akses langsung ke Google Sheets dan
tidak dapat mengubah ID internal atau status verifikasi final.

### 3.3 Kode internal

Format kode institusi:

`RMI-DMK-000001`

Ketentuan: - dibuat oleh server-side Apps Script; - unik dan permanen; -
tidak memakai nomor baris sebagai sumber nomor; - tidak dihapus atau
digunakan ulang; - tidak menyatakan akreditasi, legalitas, atau
pengakuan pemerintah; - NSPP/EMIS disimpan sebagai identifier eksternal
terpisah.

## 4. Struktur Workbook

Nama workbook yang disarankan:

`PESANTREN_DATA_CENTER_MASTER_v1`

Workbook berisi 24 worksheet berikut. Nama sheet menggunakan
`snake_case`, tanpa spasi, agar mudah dipetakan ke tabel PostgreSQL.

  ---------------------------------------------------------------------------------------------
                    No. Worksheet                          Fungsi              Akses normal
  --------------------- ---------------------------------- ------------------- ----------------
                      1 `pesantren`                        Master identitas    Backend
                                                           pesantren           

                      2 `pesantren_locations`              Alamat dan          Backend
                                                           koordinat           

                      3 `pesantren_leaders`                Pengasuh/pimpinan   Backend
                                                           dan riwayat         
                                                           penugasan           

                      4 `pesantren_contacts`               Kontak resmi        Backend
                                                           lembaga             

                      5 `pesantren_legalities`             NSPP, EMIS, badan   Backend
                                                           hukum, dokumen      
                                                           legal               

                      6 `pesantren_education`              Jenis dan jenjang   Backend
                                                           pendidikan          

                      7 `pesantren_resources`              Agregat santri dan  Backend
                                                           SDM                 

                      8 `pesantren_facilities`             Fasilitas pesantren Backend

                      9 `pesantren_programs`               Program             Backend
                                                           unggulan/kegiatan   

                     10 `pesantren_development_profiles`   Profil tata kelola  Backend
                                                           dan kebutuhan       
                                                           pengembangan        

                     11 `pesantren_verifications`          Catatan proses      Backend
                                                           verifikasi          

                     12 `pesantren_data_history`           Riwayat perubahan   Backend
                                                           data                

                     13 `users`                            Akun pengguna       Backend
                                                           aplikasi            

                     14 `roles`                            Referensi peran     Backend

                     15 `user_assignments`                 Penugasan pengguna  Backend
                                                           ke wilayah/lembaga  

                     16 `districts`                        Referensi kecamatan Backend

                     17 `villages`                         Referensi           Backend
                                                           desa/kelurahan      

                     18 `data_sources`                     Referensi asal data Backend

                     19 `publication_consents`             Persetujuan         Backend
                                                           publikasi           

                     20 `annual_snapshots`                 Snapshot data       Backend
                                                           tahunan             

                     21 `document_files`                   Metadata            Backend
                                                           dokumen/file        

                     22 `audit_logs`                       Log aktivitas       Backend
                                                           sistem              

                     23 `id_sequences`                     Pengendali nomor ID Backend

                     24 `system_settings`                  Konfigurasi sistem  Backend
  ---------------------------------------------------------------------------------------------

**Catatan:** daftar ini adalah manifest worksheet untuk template v1.0.
Sebelum implementasi, nama dan kolom harus dicocokkan satu per satu
dengan Database Dictionary yang telah disetujui. Jika terdapat
perbedaan, Database Dictionary menjadi rujukan utama; jangan membuat
kolom baru secara sepihak.

## 5. Standar Header dan Tipe Data

### 5.1 Aturan header

-   Baris 1 adalah header tunggal.
-   Tidak ada judul tambahan di atas header.
-   Tidak ada merged cells.
-   Tidak ada baris kosong di antara header dan data.
-   Nama kolom menggunakan `snake_case`.
-   Header tidak boleh diubah manual setelah Apps Script
    diimplementasikan.
-   Jangan mengubah urutan atau nama kolom tanpa perubahan versi skema.

### 5.2 Representasi tipe data

  -----------------------------------------------------------------------
  Tipe logis              Representasi Sheets     Aturan
  ----------------------- ----------------------- -----------------------
  UUID/string ID          Plain text              Tidak boleh diubah
                                                  menjadi angka

  Kode internal           Plain text              Pertahankan leading
                                                  zero

  Text                    Plain text              Trim whitespace pada
                                                  server

  Integer                 Number                  Bilangan bulat, batas
                                                  validasi ditentukan

  Decimal                 Number                  Gunakan satuan yang
                                                  terdokumentasi

  Boolean                 Checkbox/TRUE-FALSE     Konsisten

  Date                    Date                    Format tampilan
                                                  `yyyy-mm-dd`

  Datetime                Date-time               Simpan dan proses
                                                  dengan zona waktu yang
                                                  konsisten

  Enum/status             Text + validation       Nilai harus dari daftar
                                                  yang diizinkan

  URL                     Plain text              Validasi skema URL

  JSON                    Hindari jika dapat      Hanya untuk payload
                          dinormalisasi           terkontrol yang memang
                                                  diperlukan
  -----------------------------------------------------------------------

Tanggal dan waktu harus diproses secara konsisten. Simpan timestamp
sistem dalam format ISO 8601 UTC pada lapisan aplikasi, lalu tampilkan
dalam zona waktu `Asia/Jakarta` bila diperlukan.

## 6. Spesifikasi Kolom Minimum per Worksheet

Daftar di bawah adalah baseline implementasi awal. Kolom final tetap
harus direkonsiliasi dengan Database Dictionary.

### 6.1 `pesantren`

Satu baris untuk satu lembaga pesantren.

`pesantren_id`, `internal_code`, `institution_name`, `short_name`,
`institution_type`, `rmi_membership_status`, `operational_status`,
`established_date`, `history_summary`, `primary_location_id`,
`primary_leader_id`, `data_entry_status`, `verification_status`,
`publication_status`, `data_source_id`, `created_at`, `created_by`,
`updated_at`, `updated_by`, `archived_at`.

Aturan: - `pesantren_id` adalah ID teknis stabil. - `internal_code` unik
dan permanen. - `institution_name` wajib. - status pendataan,
verifikasi, dan publikasi adalah tiga atribut berbeda. -
`primary_location_id` dan `primary_leader_id` harus merujuk record yang
valid bila diisi.

### 6.2 `pesantren_locations`

Satu pesantren dapat memiliki lebih dari satu lokasi jika model bisnis
mengizinkan.

`location_id`, `pesantren_id`, `location_type`, `address_line`, `rt`,
`rw`, `village_id`, `district_id`, `postal_code`, `latitude`,
`longitude`, `location_notes`, `is_primary`,
`location_verification_status`, `verified_at`, `verified_by`,
`created_at`, `updated_at`.

Aturan: - koordinat disimpan sebagai decimal; - koordinat tidak boleh
dianggap terverifikasi hanya karena diisi; - satu lokasi utama per
pesantren harus dijaga oleh validasi aplikasi.

### 6.3 `pesantren_leaders`

`leader_id`, `pesantren_id`, `full_name`, `position_title`, `phone`,
`email`, `is_primary`, `valid_from`, `valid_until`, `is_active`,
`created_at`, `updated_at`.

Batasi informasi pribadi pada kebutuhan administrasi. Jangan menambahkan
NIK, nomor KK, atau data sensitif lain tanpa dasar kebutuhan dan
persetujuan yang jelas.

### 6.4 `pesantren_contacts`

`contact_id`, `pesantren_id`, `contact_type`, `contact_name`,
`position_title`, `phone`, `email`, `website_url`, `is_public`,
`created_at`, `updated_at`.

Kontak yang ditandai `is_public = TRUE` tetap memerlukan pemeriksaan
kebijakan publikasi.

### 6.5 `pesantren_legalities`

`legality_id`, `pesantren_id`, `identifier_type`, `identifier_number`,
`issuing_authority`, `document_file_id`, `issue_date`, `expiry_date`,
`verification_status`, `verification_notes`, `created_at`, `updated_at`.

NSPP, EMIS, dan nomor badan hukum adalah identifier berbeda. Jangan
menyamakan ID internal RMI dengan identifier pemerintah.

### 6.6 `pesantren_education`

`education_id`, `pesantren_id`, `education_type`, `education_level`,
`institution_name`, `management_status`, `is_active`, `notes`,
`created_at`, `updated_at`.

### 6.7 `pesantren_resources`

`resource_id`, `pesantren_id`, `reporting_year`, `santri_total`,
`santri_male_total`, `santri_female_total`, `santri_mukim_total`,
`santri_non_mukim_total`, `teacher_total`, `staff_total`,
`data_source_id`, `reported_at`, `created_at`, `updated_at`.

Aturan: - seluruh angka merupakan agregat; - jumlah komponen tidak boleh
melebihi total tanpa penjelasan; - satu pesantren dapat memiliki satu
atau lebih snapshot per tahun sesuai aturan pelaporan; - jangan
memasukkan nama atau identitas individual santri.

### 6.8 `pesantren_facilities`

`facility_id`, `pesantren_id`, `facility_type`, `quantity`,
`condition_status`, `ownership_status`, `notes`, `created_at`,
`updated_at`.

### 6.9 `pesantren_programs`

`program_id`, `pesantren_id`, `program_name`, `program_category`,
`description`, `is_active`, `start_year`, `created_at`, `updated_at`.

### 6.10 `pesantren_development_profiles`

`profile_id`, `pesantren_id`, `assessment_year`, `governance_level`,
`financial_management_level`, `digitalization_level`,
`protection_system_level`, `economic_potential`, `development_needs`,
`assessment_notes`, `assessed_by`, `created_at`, `updated_at`.

Profiling merupakan alat pemetaan kebutuhan dan pengembangan, bukan
pemeringkatan atau akreditasi resmi. Definisi skala harus ditetapkan
dalam instrumen penilaian.

### 6.11 `pesantren_verifications`

`verification_id`, `pesantren_id`, `verification_scope`,
`verification_status`, `verification_method`, `evidence_notes`,
`reviewer_user_id`, `submitted_at`, `reviewed_at`, `created_at`.

Verifikasi identitas, lokasi, legalitas, dan profil dapat memiliki hasil
yang berbeda. Verifikasi RMI adalah pemeriksaan administratif internal,
bukan pengesahan pemerintah.

### 6.12 `pesantren_data_history`

`history_id`, `pesantren_id`, `entity_name`, `record_id`, `field_name`,
`old_value`, `new_value`, `change_reason`, `changed_by`, `changed_at`,
`change_source`.

Catat perubahan penting. Hindari menyimpan rahasia atau data pribadi
yang tidak diperlukan ke dalam log.

### 6.13 `users`

`user_id`, `full_name`, `email`, `phone`, `auth_provider_id`,
`account_status`, `last_login_at`, `created_at`, `updated_at`.

Password tidak boleh disimpan di Google Sheets. Autentikasi harus
menggunakan mekanisme aman; Apps Script tidak boleh membuat sistem
penyimpanan password sendiri.

### 6.14 `roles`

`role_id`, `role_code`, `role_name`, `description`, `is_active`,
`created_at`.

Role baseline: `SUPER_ADMIN`, `ADMIN_KABUPATEN`, `ADMIN_KECAMATAN`,
`OPERATOR_PESANTREN`.

### 6.15 `user_assignments`

`assignment_id`, `user_id`, `role_id`, `pesantren_id`, `district_id`,
`village_id`, `assignment_status`, `valid_from`, `valid_until`,
`created_by`, `created_at`.

Validasi kombinasi scope dan role di backend. Operator pesantren hanya
boleh mengelola lembaga yang ditugaskan kepadanya.

### 6.16 `districts`

`district_id`, `district_code`, `district_name`, `is_active`,
`created_at`, `updated_at`.

Isi dengan referensi resmi 14 kecamatan Kabupaten Demak setelah
diverifikasi terhadap sumber administrasi wilayah yang berwenang.

### 6.17 `villages`

`village_id`, `district_id`, `village_code`, `village_name`,
`administrative_type`, `is_active`, `created_at`, `updated_at`.

Setiap desa/kelurahan harus terhubung ke satu kecamatan. Kode wilayah
harus mengikuti sumber referensi resmi dan disimpan sebagai teks.

### 6.18 `data_sources`

`data_source_id`, `source_code`, `source_name`, `source_type`,
`description`, `is_active`, `created_at`.

Contoh sumber: pendataan lapangan RMI, formulir operator pesantren,
dokumen resmi, pembaruan administratif.

### 6.19 `publication_consents`

`consent_id`, `pesantren_id`, `consent_scope`, `consent_status`,
`consenting_person`, `consenting_position`, `evidence_file_id`,
`consented_at`, `recorded_by`, `created_at`, `updated_at`.

Persetujuan publikasi harus spesifik terhadap ruang lingkup informasi.
Persetujuan menampilkan profil umum tidak otomatis berarti persetujuan
menampilkan semua dokumen/kontak.

### 6.20 `annual_snapshots`

`snapshot_id`, `pesantren_id`, `snapshot_year`, `snapshot_payload`,
`snapshot_created_at`, `created_by`, `notes`.

Snapshot adalah arsip keadaan data pada periode tertentu. Format payload
harus ditetapkan dan diuji sebelum dipakai; jangan menjadikan JSON
sebagai pengganti tabel operasional terstruktur.

### 6.21 `document_files`

`document_file_id`, `pesantren_id`, `document_category`, `file_name`,
`mime_type`, `file_size_bytes`, `storage_provider`, `storage_file_id`,
`storage_url`, `access_classification`, `uploaded_by`, `uploaded_at`,
`verification_status`.

Simpan file di Google Drive dengan izin akses terbatas. Jangan
mengandalkan URL publik untuk dokumen internal.

### 6.22 `audit_logs`

`audit_log_id`, `actor_user_id`, `action_type`, `entity_name`,
`record_id`, `action_summary`, `request_id`, `ip_address`, `user_agent`,
`created_at`.

Log bersifat append-only bagi pengguna aplikasi. Batasi akses karena log
dapat memuat metadata aktivitas.

### 6.23 `id_sequences`

`sequence_key`, `prefix`, `last_value`, `padding_length`, `updated_at`,
`updated_by`.

Sheet ini hanya boleh ditulis oleh fungsi server-side yang mengunci
proses dengan `LockService`. Pengguna tidak boleh mengedit nilai
sequence secara manual.

### 6.24 `system_settings`

`setting_key`, `setting_value`, `value_type`, `description`,
`is_secret`, `updated_at`, `updated_by`.

Jangan menyimpan secret, token, private key, atau credential di sheet
ini. Secret dikelola melalui konfigurasi aman Apps Script/Google Cloud.

## 7. Referensi Wilayah

-   Gunakan daftar kecamatan dan desa/kelurahan dari sumber administrasi
    resmi.
-   Jangan mengetik nama wilayah bebas pada formulir jika pilihan
    referensi tersedia.
-   `villages.district_id` harus menunjuk kecamatan yang benar.
-   Hindari duplikasi nama desa dengan mengandalkan kode wilayah sebagai
    identifier.
-   Perubahan administratif wilayah harus dicatat dan tidak menghapus
    referensi historis.

**Data wilayah belum boleh dianggap final sebelum dilakukan verifikasi
sumber dan tanggal pembaruannya.**

## 8. Data Validation dan Controlled Values

Nilai berikut adalah nilai awal yang direkomendasikan dan perlu dikunci
dalam kamus status aplikasi.

  -----------------------------------------------------------------------
  Field                               Nilai awal
  ----------------------------------- -----------------------------------
  `data_entry_status`                 `IDENTIFIED`, `INVITED`,
                                      `IN_PROGRESS`, `SUBMITTED`,
                                      `NEEDS_REVISION`, `COMPLETED`

  `verification_status`               `NOT_SUBMITTED`, `PENDING`,
                                      `IN_REVIEW`, `VERIFIED`,
                                      `REJECTED`, `NEEDS_REVISION`

  `publication_status`                `NOT_PUBLISHED`, `PENDING_CONSENT`,
                                      `APPROVED`, `PUBLISHED`,
                                      `WITHDRAWN`

  `operational_status`                `ACTIVE`, `INACTIVE`, `CLOSED`,
                                      `UNKNOWN`

  `account_status`                    `INVITED`, `ACTIVE`, `SUSPENDED`,
                                      `DISABLED`

  `assignment_status`                 `ACTIVE`, `REVOKED`, `EXPIRED`

  `location_verification_status`      `UNVERIFIED`, `PENDING`,
                                      `VERIFIED`, `REJECTED`

  `consent_status`                    `NOT_REQUESTED`, `PENDING`,
                                      `GRANTED`, `DENIED`, `WITHDRAWN`
  -----------------------------------------------------------------------

Jangan menyamakan status `COMPLETED` dengan `VERIFIED` atau `PUBLISHED`.

## 9. Primary Key, ID dan Relasi

### 9.1 ID teknis

-   Gunakan UUID atau ID unik yang dibuat server-side untuk primary key
    record.
-   ID teknis tidak boleh berubah setelah record dibuat.
-   Jangan menggunakan `ROW()`, nomor baris, atau urutan sort sebagai
    ID.
-   ID tidak boleh dibuat oleh formula yang dapat berubah.

### 9.2 ID internal pesantren

-   `internal_code` dibuat setelah pemeriksaan duplikasi minimum.
-   Alokasi nomor harus atomic menggunakan `LockService`.
-   Format awal: `RMI-DMK-000001`.
-   Sequence disimpan pada `id_sequences`.
-   Jika proses gagal, sistem harus menghindari nomor ganda; celah nomor
    diperbolehkan dan tidak perlu diisi ulang.

### 9.3 Relasi utama

``` text
pesantren
 ├── pesantren_locations
 ├── pesantren_leaders
 ├── pesantren_contacts
 ├── pesantren_legalities
 ├── pesantren_education
 ├── pesantren_resources
 ├── pesantren_facilities
 ├── pesantren_programs
 ├── pesantren_development_profiles
 ├── pesantren_verifications
 ├── pesantren_data_history
 ├── publication_consents
 ├── annual_snapshots
 └── document_files

districts
 └── villages
      └── pesantren_locations

users
 └── user_assignments
      ├── roles
      ├── pesantren (opsional)
      └── districts (opsional)
```

Apps Script wajib memvalidasi bahwa foreign key yang dikirim memang ada
dan sesuai scope pengguna.

## 10. Konvensi Formula dan Kolom Turunan

-   Hindari formula sebagai mekanisme utama integritas data.
-   Formula hanya untuk kebutuhan tampilan atau agregasi non-kritis.
-   Jangan menulis formula ke kolom ID, status final, atau audit.
-   Kolom turunan harus dapat dihitung ulang dari data sumber.
-   Formula tidak boleh menjadi satu-satunya mekanisme validasi.
-   Dashboard dan laporan sebaiknya dihitung melalui fungsi backend atau
    sheet agregasi terpisah pada tahap berikutnya.

## 11. Proteksi dan Hak Akses Workbook

  Aktor                Akses
  -------------------- ------------------------------------------------
  Super Admin teknis   Administrasi penuh, terbatas
  Admin Kabupaten      Melalui aplikasi; tidak edit workbook langsung
  Admin Kecamatan      Melalui aplikasi; data sesuai wilayah
  Operator Pesantren   Melalui aplikasi; data lembaga yang ditugaskan
  Publik               Tidak memiliki akses workbook

Pengamanan minimum: - workbook tidak dibagikan dengan akses publik; -
jangan gunakan `Anyone with the link` untuk workbook atau dokumen
internal; - akun teknis menggunakan prinsip least privilege; - lindungi
header dan sheet referensi; - simpan secret di Script Properties atau
secret manager yang sesuai; - jangan mengirim credential melalui
HTML/JavaScript frontend; - pisahkan data development dan production; -
catat aktivitas tulis dan perubahan penting.

Proteksi range di Google Sheets bukan pengganti autentikasi dan
otorisasi aplikasi.

## 12. Standar Apps Script yang Mengonsumsi Workbook

Apps Script harus menggunakan nama worksheet dan header sebagai kontrak,
bukan asumsi nomor kolom.

Fungsi fondasi yang diperlukan: - `getSheetByName()` dengan pemeriksaan
sheet wajib; - `validateWorkbookSchema()` untuk memeriksa nama sheet dan
header; - `getHeaderMap()` untuk memetakan nama kolom ke indeks; -
`validateForeignKeys()` untuk memeriksa relasi; -
`generateTechnicalId()` untuk primary key; - `generateInternalCode()`
dengan `LockService`; - `appendAuditLog()` untuk aktivitas; -
`appendDataHistory()` untuk perubahan data; - `validatePayload()` untuk
validasi input; - `authorizeRequest()` untuk memeriksa identitas, role,
dan scope.

Ketentuan: - gunakan batch read/write untuk mengurangi pemanggilan
Spreadsheet service; - validasi semua input di server; - jangan
mempercayai nilai role atau `pesantren_id` yang dikirim browser; -
gunakan lock untuk operasi sequence dan proses yang rawan benturan; -
tangani error dengan kode yang konsisten; - jangan mengembalikan seluruh
baris sheet yang tidak diperlukan; - hindari `getDataRange()` berulang
pada setiap record dalam loop.

## 13. Backup, Restore dan Operasional

Minimum operasional: 1. Backup berkala workbook utama. 2. Simpan backup
pada lokasi Drive dengan akses terbatas. 3. Catat waktu, pelaksana, dan
hasil backup. 4. Lakukan uji restore ke salinan terpisah. 5. Jangan
menguji restore dengan menimpa workbook produksi. 6. Simpan versi skema
dan changelog. 7. Tetapkan prosedur pemulihan jika workbook terhapus,
rusak, atau mencapai batas kapasitas.

Backup belum dianggap memadai sebelum restore berhasil diuji.

## 14. Rencana Pengisian Awal

Urutan pengisian yang disarankan:

1.  `districts`
2.  `villages`
3.  `roles`
4.  `data_sources`
5.  `id_sequences`
6.  `system_settings` (hanya konfigurasi non-secret)
7.  `users`
8.  `user_assignments`
9.  `pesantren`
10. sheet turunan pesantren sesuai kebutuhan
11. `audit_logs` dan `pesantren_data_history` melalui aplikasi

Data kecamatan/desa harus diverifikasi sebelum digunakan untuk input
produksi.

## 15. Acceptance Criteria --- Sprint 02B

Sprint 02B dinyatakan selesai apabila:

-   [ ] Workbook master dibuat dengan nama dan lokasi yang disetujui.
-   [ ] Seluruh 24 worksheet tersedia dengan nama tepat.
-   [ ] Setiap worksheet memiliki header tunggal dan konsisten.
-   [ ] Nama kolom cocok dengan Database Dictionary yang disahkan.
-   [ ] Tidak ada merged cells atau baris judul tambahan.
-   [ ] Format ID/kode disetel sebagai plain text.
-   [ ] Kolom tanggal, angka, boolean, dan enum memiliki format/validasi
    yang tepat.
-   [ ] Referensi kecamatan/desa memiliki sumber dan tanggal verifikasi.
-   [ ] Relasi antar-sheet terdokumentasi.
-   [ ] Hak akses workbook dibatasi.
-   [ ] Tidak ada password atau secret di dalam workbook.
-   [ ] Contoh data uji menggunakan data sintetis, bukan data pribadi
    nyata.
-   [ ] Backup awal dibuat dan uji restore ke salinan berhasil.
-   [ ] `validateWorkbookSchema()` dapat memeriksa worksheet dan header.
-   [ ] Tidak ada data produksi yang dimasukkan sebelum acceptance dan
    persetujuan implementasi.

## 16. Risiko dan Mitigasi

  -----------------------------------------------------------------------
  Risiko                  Dampak                  Mitigasi
  ----------------------- ----------------------- -----------------------
  Edit langsung workbook  Data rusak/tidak        Akses hanya backend dan
                          tercatat                admin teknis

  Duplikasi ID            Identitas lembaga       LockService +
                          bentrok                 pemeriksaan unik

  Relasi yatim            Data tidak konsisten    Validasi foreign key di
                                                  Apps Script

  Salah referensi wilayah Pemetaan keliru         Referensi resmi dan
                                                  verifikasi

  Perubahan header        Apps Script gagal       Schema validation dan
                                                  versioning

  Kuota Apps Script       Layanan melambat/gagal  Batch operations,
                                                  monitoring, rencana
                                                  migrasi

  Kebocoran dokumen       Risiko privasi          Drive restricted access

  Backup tidak dapat      Kehilangan data         Uji restore berkala
  dipulihkan                                      

  Spreadsheet tumbuh      Performa menurun        Monitoring dan trigger
  terlalu besar                                   migrasi PostgreSQL
  -----------------------------------------------------------------------

## 17. Batas Sprint 02B

**Termasuk:** - spesifikasi workbook; - manifest worksheet; - standar
header dan tipe data; - validasi dasar; - relasi data; - pengamanan
workbook; - acceptance criteria.

**Tidak termasuk:** - pembuatan Apps Script CRUD lengkap; - autentikasi
produksi; - dashboard admin; - portal operator pesantren; - integrasi
website publik; - GIS; - import data massal; - migrasi ke
PostgreSQL/Supabase.

Pekerjaan tersebut masuk ke sprint/subphase berikutnya.

## 18. Gerbang Persetujuan

Sebelum workbook produksi dibuat:

1.  Cocokkan seluruh nama tabel dan kolom dengan
    `Database_Dictionary_v1.0.md`.
2.  Selesaikan konflik atau perbedaan sebagai change request
    terdokumentasi.
3.  Setujui sumber referensi wilayah.
4.  Setujui klasifikasi data dan hak akses.
5.  Lakukan review akhir struktur workbook.
6.  Setelah disetujui, buat workbook development/pilot terlebih dahulu.

**Blueprint ini tidak otomatis memberi izin untuk memasukkan data
produksi atau membuka akses kepada operator pesantren.**

------------------------------------------------------------------------

**End of Sprint 02B --- Google Sheets Database Template v1.0**
