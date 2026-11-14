# DATABASE DICTIONARY v1.1
## DEMAK PESANTREN DATA & DEVELOPMENT

**Pesantren Data Center --- RMI NU Demak**
*(Diselaraskan dengan Standar Nasional Digdaya Pesantren PBNU)*

  Informasi           Keterangan
  ------------------- --------------------------------------------------
  Dokumen             Database Dictionary
  Versi               1.1
  Status              Disahkan sebagai acuan data & implementasi
  Acuan               Technical Architecture & Database Blueprint v1.0
  Cakupan             Master data pesantren Kabupaten Demak & Nasional
  Implementasi awal   Google Sheets + Apps Script
  Target database     Supabase PostgreSQL
  Penyelarasan        Digdaya Pesantren PBNU (pesantren.nu.id)

------------------------------------------------------------------------

# 1. Tujuan dan Konvensi

Dokumen ini mendefinisikan nama tabel, kolom, tipe data konseptual,
kewajiban pengisian, aturan validasi, relasi, dan nilai baku untuk
Pesantren Data Center.

Dictionary ini menjadi sumber acuan bagi: - Pembuatan worksheet Google
Sheets. - Validasi data di Google Apps Script. - Kontrak API. -
Pembuatan tabel PostgreSQL. - Proses ekspor dan migrasi.

## 1.1 Konvensi penamaan

-   Nama tabel dan kolom menggunakan `snake_case`.
-   Nama tabel menggunakan bentuk jamak hanya jika ditetapkan pada
    dictionary; nama yang tercantum di sini harus dipertahankan.
-   Primary key menggunakan kolom `id`.
-   Foreign key menggunakan pola `<nama_entitas>_id`.
-   Kolom waktu menggunakan akhiran `_at` untuk timestamp dan awalan
    `tanggal_` untuk tanggal kalender.
-   Boolean menggunakan awalan `is_` atau `has_` jika sesuai.
-   Nilai status menggunakan kode tetap, bukan label tampilan.
-   Nilai enum ditampilkan dengan huruf kecil dan underscore.
-   UUID adalah identitas record; nomor baris spreadsheet bukan
    identitas.

## 1.2 Tipe data konseptual

  Tipe        Makna               Implementasi Sheets       PostgreSQL
  ----------- ------------------- ------------------------- --------------------
  UUID        ID unik             String UUID               `uuid`
  VARCHAR     Teks pendek         Plain text                `varchar` / `text`
  TEXT        Teks panjang        Plain text                `text`
  INTEGER     Bilangan bulat      Number tanpa desimal      `integer`
  DECIMAL     Angka desimal       Number                    `numeric`
  BOOLEAN     Benar/salah         TRUE/FALSE                `boolean`
  DATE        Tanggal             ISO `YYYY-MM-DD`          `date`
  TIMESTAMP   Waktu               ISO 8601                  `timestamptz`
  JSON        Objek terstruktur   JSON string tervalidasi   `jsonb`

## 1.3 Arti kewajiban

-   **Wajib:** harus tersedia sebelum record dapat disimpan atau dikirim
    pada tahap terkait.
-   **Opsional:** boleh kosong.
-   **Kondisional:** wajib jika kondisi tertentu terpenuhi.

Kolom sistem seperti `id`, `created_at`, dan `updated_at` diisi otomatis
oleh backend.

## 1.4 Standar timestamp

-   Simpan timestamp dalam UTC atau format ISO 8601 yang menyertakan
    zona waktu.
-   Tampilkan kepada pengguna dalam zona waktu Asia/Jakarta.
-   Jangan menyimpan tanggal sebagai teks bebas.
-   `DATE` digunakan untuk tanggal tanpa komponen jam.
-   `TIMESTAMP` digunakan untuk kejadian yang membutuhkan urutan waktu.

------------------------------------------------------------------------

# 2. Aturan Global

## 2.1 Identitas pesantren

-   `id`: UUID primary key.
-   `kode_pesantren`: kode internal RMI dengan format `RMI-DMK-000001`.
-   Kode diterbitkan backend secara atomik.
-   Kode tidak boleh diinput operator, diubah, atau digunakan ulang.
-   Record tidak dihapus secara fisik dalam operasi rutin.

## 2.2 Relasi

-   Setiap foreign key harus menunjuk record yang ada.
-   Apps Script harus memvalidasi relasi karena Google Sheets tidak
    menyediakan foreign key.
-   PostgreSQL menerapkan foreign key constraints.
-   Jangan menggunakan nama pesantren sebagai penghubung tabel.

## 2.3 Data tahunan

Data yang berubah dari tahun ke tahun harus memiliki `tahun_data` atau
`tahun_profiling`. Data tahun lama dipertahankan untuk analisis tren.

## 2.4 Data kosong

-   Nilai kosong berarti belum diketahui atau belum diisi.
-   Jangan mengubah data tidak diketahui menjadi angka nol.
-   Angka nol hanya digunakan jika memang telah dikonfirmasi bahwa
    jumlahnya nol.
-   Untuk data hitungan, gunakan bilangan bulat nonnegatif.

## 2.5 Penghapusan dan arsip

-   Record utama dinonaktifkan atau diarsipkan, bukan dihapus rutin.
-   Penghapusan permanen hanya melalui prosedur khusus dan persetujuan.
-   Histori perubahan tidak boleh ikut hilang ketika record
    dinonaktifkan.

------------------------------------------------------------------------

# 3. Tabel `pesantren`

**Tujuan:** master record identitas setiap pesantren.

  -------------------------------------------------------------------------------------
  Kolom                      Tipe              Kewajiban         Aturan / Keterangan
  -------------------------- ----------------- ----------------- ----------------------
  `id`                       UUID              Wajib, sistem     Primary key

  `kode_pesantren`           VARCHAR(20)       Wajib, sistem     Unik; format
                                                                 `RMI-DMK-000001`

  `nama_resmi`               VARCHAR(255)      Wajib             Nama lembaga
                                                                 sebagaimana digunakan
                                                                 secara resmi

  `nama_populer`             VARCHAR(255)      Opsional          Nama panggilan atau
                                                                 nama yang dikenal

  `tahun_berdiri`            INTEGER           Opsional          Tahun empat digit;
                                                                 tidak boleh di masa
                                                                 depan

  `status_operasional`       VARCHAR(30)       Wajib             `active`, `inactive`,
                                                                 `unknown`

  `status_keanggotaan_rmi`   VARCHAR(30)       Wajib             `member`,
                                                                 `non_member`,
                                                                 `unknown`

  `sumber_data_id`           UUID              Kondisional       FK ke
                                                                 `data_sources.id`

  `status_pendataan`         VARCHAR(30)       Wajib             `draft`, `submitted`,
                                                                 `revision_required`,
                                                                 `completed`

  `status_verifikasi`        VARCHAR(30)       Wajib             `not_verified`,
                                                                 `under_review`,
                                                                 `verified`, `rejected`

  `status_publikasi`         VARCHAR(30)       Wajib             `private`,
                                                                 `pending_approval`,
                                                                 `approved`,
                                                                 `published`,
                                                                 `unpublished`

  `has_komitmen_pesantren_aman` BOOLEAN         Wajib, default    Komitmen program
                                                FALSE             Pesantren Ramah Anak
                                                                  / Pesantren Aman PBNU

  `catatan_internal`         TEXT              Opsional          Catatan internal,
                                                                 tidak untuk publik

  `created_at`               TIMESTAMP         Wajib, sistem     Waktu pembuatan

  `updated_at`               TIMESTAMP         Wajib, sistem     Waktu pembaruan
                                                                 terakhir

  `created_by`               UUID              Wajib, sistem     FK ke `users.id`, jika
                                                                 dibuat oleh pengguna

  `updated_by`               UUID              Opsional, sistem  FK ke `users.id`
  -------------------------------------------------------------------------------------

**Aturan tambahan:** - Kombinasi nama dan wilayah dapat digunakan untuk
mendeteksi calon duplikasi, bukan sebagai unique key otomatis. -
`kode_pesantren` harus unik. - `status_operasional` berbeda dari
`status_verifikasi`. - Record awal yang dibuat tim RMI tidak otomatis
berstatus verified. - `catatan_internal` tidak boleh dikirim melalui
public API.

------------------------------------------------------------------------

# 4. Tabel `pesantren_locations`

**Tujuan:** menyimpan alamat dan titik lokasi pesantren.

  -------------------------------------------------------------------------------------
  Kolom                        Tipe              Kewajiban         Aturan / Keterangan
  ---------------------------- ----------------- ----------------- --------------------
  `id`                         UUID              Wajib, sistem     Primary key

  `pesantren_id`               UUID              Wajib             FK ke `pesantren.id`

  `jenis_lokasi`               VARCHAR(30)       Wajib             `main`, `branch`,
                                                                   `other`

  `alamat`                     TEXT              Wajib             Alamat lengkap

  `desa_id`                    UUID              Kondisional       FK ke `villages.id`

  `kecamatan_id`               UUID              Wajib             FK ke `districts.id`

  `kode_pos`                   VARCHAR(10)       Opsional          Disimpan sebagai
                                                                   teks

  `latitude`                   DECIMAL(10,7)     Opsional          Rentang -90 sampai
                                                                   90

  `longitude`                  DECIMAL(10,7)     Opsional          Rentang -180 sampai
                                                                   180

  `petunjuk_lokasi`            TEXT              Opsional          Keterangan akses
                                                                   lokasi

  `status_verifikasi_lokasi`   VARCHAR(30)       Wajib             `not_verified`,
                                                                   `under_review`,
                                                                   `verified`,
                                                                   `needs_correction`

  `is_primary`                 BOOLEAN           Wajib             Hanya satu lokasi
                                                                   utama aktif per
                                                                   pesantren

  `verified_by`                UUID              Opsional          FK ke `users.id`

  `verified_at`                TIMESTAMP         Opsional          Waktu verifikasi

  `created_at`                 TIMESTAMP         Wajib, sistem     Waktu pembuatan

  `updated_at`                 TIMESTAMP         Wajib, sistem     Waktu pembaruan
  -------------------------------------------------------------------------------------

**Aturan tambahan:** - `latitude` dan `longitude` harus diisi
berpasangan. - `desa_id` harus berada pada `kecamatan_id` yang sama. -
Koordinat yang dikirim operator belum dianggap terverifikasi. - Hanya
satu lokasi utama aktif per pesantren.

------------------------------------------------------------------------

# 5. Tabel `pesantren_leaders`

**Tujuan:** mencatat pengasuh dan pimpinan pesantren.

  -------------------------------------------------------------------------
  Kolom               Tipe              Kewajiban         Aturan /
                                                          Keterangan
  ------------------- ----------------- ----------------- -----------------
  `id`                UUID              Wajib, sistem     Primary key

  `pesantren_id`      UUID              Wajib             FK ke
                                                          `pesantren.id`

  `nama`              VARCHAR(255)      Wajib             Nama pimpinan / ustadz

  `jabatan`           VARCHAR(100)      Wajib             Contoh: pengasuh,
                                                          pimpinan, wakil,
                                                          dewan asatidz

  `kategori_pengajar` VARCHAR(30)       Opsional          `pengasuh`, `ustadz`,
                                                          `ustadzah`, `other`

  `spesialisasi_keilmuan` VARCHAR(150)  Opsional          Fan ilmu: fiqih, nahwu,
                                                          tafsir, hadits, falak,
                                                          tahfidz, tasawuf

  `pendidikan_terakhir` VARCHAR(150)    Opsional          Contoh: Ma'had Aly,
                                                          S1, Lirboyo, Al-Azhar

  `periode_mulai`     DATE              Opsional          Awal periode

  `periode_selesai`   DATE              Opsional          Akhir periode

  `status_aktif`      BOOLEAN           Wajib             Status jabatan
                                                          saat ini

  `catatan`           TEXT              Opsional          Keterangan
                                                          tambahan

  `created_at`        TIMESTAMP         Wajib, sistem     Waktu pembuatan

  `updated_at`        TIMESTAMP         Wajib, sistem     Waktu pembaruan
  -------------------------------------------------------------------------

**Aturan tambahan:** data pimpinan merupakan data personal. Publikasi
nama dan jabatan harus mengikuti kebijakan organisasi dan persetujuan
yang berlaku.

------------------------------------------------------------------------

# 6. Tabel `pesantren_contacts`

**Tujuan:** menyimpan kontak resmi pesantren.

  -----------------------------------------------------------------------------
  Kolom                   Tipe              Kewajiban         Aturan /
                                                              Keterangan
  ----------------------- ----------------- ----------------- -----------------
  `id`                    UUID              Wajib, sistem     Primary key

  `pesantren_id`          UUID              Wajib             FK ke
                                                              `pesantren.id`

  `jenis_kontak`          VARCHAR(30)       Wajib             `phone`,
                                                              `whatsapp`,
                                                              `email`,
                                                              `website`,
                                                              `youtube`,
                                                              `instagram`,
                                                              `facebook`,
                                                              `tiktok`,
                                                              `twitter`,
                                                              `linkedin`,
                                                              `hotline_psb`,
                                                              `social_media`

  `nilai_kontak`          VARCHAR(500)      Wajib             Nomor, alamat
                                                              email, URL, atau
                                                              handle

  `nama_pemilik_kontak`   VARCHAR(255)      Opsional          Penanggung jawab

  `is_primary`            BOOLEAN           Wajib             Kontak utama
                                                              untuk jenisnya

  `is_public`             BOOLEAN           Wajib             Apakah boleh
                                                              ditampilkan ke
                                                              publik

  `created_at`            TIMESTAMP         Wajib, sistem     Waktu pembuatan

  `updated_at`            TIMESTAMP         Wajib, sistem     Waktu pembaruan
  -----------------------------------------------------------------------------

**Aturan tambahan:** - Validasi format disesuaikan dengan
`jenis_kontak`. - Nomor telepon dinormalisasi, idealnya format
internasional. - Kontak pribadi tidak boleh otomatis ditandai publik. -
Persetujuan publikasi tetap mengikuti kebijakan publikasi.

------------------------------------------------------------------------

# 7. Tabel `pesantren_legalities`

**Tujuan:** mencatat nomor dan metadata dokumen legalitas pesantren.

  ------------------------------------------------------------------------------
  Kolom                Tipe              Kewajiban         Aturan / Keterangan
  -------------------- ----------------- ----------------- ---------------------
  `id`                 UUID              Wajib, sistem     Primary key

  `pesantren_id`       UUID              Wajib             FK ke `pesantren.id`

  `jenis_dokumen`      VARCHAR(50)       Wajib             `nspp`,
                                                           `izin_operasional`,
                                                           `akta`, `sk`, `other`

  `nomor_dokumen`      VARCHAR(255)      Opsional          Nomor sesuai dokumen

  `tanggal_terbit`     DATE              Opsional          Tanggal penerbitan

  `tanggal_berakhir`   DATE              Opsional          Jika memiliki masa
                                                           berlaku

  `penerbit`           VARCHAR(255)      Opsional          Instansi penerbit

  `file_id`            UUID              Opsional          FK ke
                                                           `document_files.id`

  `status_validasi`    VARCHAR(30)       Wajib             `not_checked`,
                                                           `under_review`,
                                                           `valid`, `invalid`,
                                                           `unknown`

  `catatan_validasi`   TEXT              Opsional          Catatan petugas

  `created_at`         TIMESTAMP         Wajib, sistem     Waktu pembuatan

  `updated_at`         TIMESTAMP         Wajib, sistem     Waktu pembaruan
  ------------------------------------------------------------------------------

**Aturan tambahan:** - NSPP disimpan sebagai identifier pemerintah,
bukan kode RMI. - Nomor dokumen disimpan sebagai teks untuk
mempertahankan karakter awal dan tanda baca. - Keunikan nomor dokumen
harus mempertimbangkan jenis dan penerbit. - Dokumen tidak otomatis
dipublikasikan.

------------------------------------------------------------------------

# 8. Tabel `pesantren_education`

**Tujuan:** mencatat satuan atau jalur pendidikan yang diselenggarakan
pesantren.

  ----------------------------------------------------------------------------
  Kolom                  Tipe              Kewajiban         Aturan /
                                                             Keterangan
  ---------------------- ----------------- ----------------- -----------------
  `id`                   UUID              Wajib, sistem     Primary key

  `pesantren_id`         UUID              Wajib             FK ke
                                                             `pesantren.id`

  `nama_program`         VARCHAR(255)      Wajib             Nama
                                                             satuan/program
                                                             pendidikan

  `jenjang`              VARCHAR(50)       Opsional          Jenjang
                                                             pendidikan jika
                                                             relevan

  `jenis_pendidikan`     VARCHAR(50)       Wajib             Kategori
                                                             pendidikan

  `marhalah`             VARCHAR(30)       Opsional          Jenjang kitab:
                                                             `ula`, `wustho`,
                                                             `ulya`, `other`, `none`

  `nama_kitab`           VARCHAR(255)      Opsional          Nama kitab kuning yang
                                                             diajarkan (jika relevan)

  `pengarang_kitab`      VARCHAR(255)      Opsional          Nama mushannif / pengarang

  `bidang_ilmu`          VARCHAR(100)      Opsional          Fan ilmu: fiqih, nahwu,
                                                             akhlaq, tauhid, tafsir

  `status_operasional`   VARCHAR(30)       Wajib             `active`,
                                                             `inactive`,
                                                             `planned`

  `nomor_izin`           VARCHAR(255)      Opsional          Nomor izin
                                                             terkait

  `keterangan`           TEXT              Opsional          Catatan

  `created_at`           TIMESTAMP         Wajib, sistem     Waktu pembuatan

  `updated_at`           TIMESTAMP         Wajib, sistem     Waktu pembaruan
  ----------------------------------------------------------------------------

Nilai awal `jenis_pendidikan` yang dapat digunakan: - `diniyah` -
`formal` - `tahfidz` - `kitab_kuning` - `other`

Daftar ini merupakan referensi awal dan dapat dikembangkan melalui tabel
referensi khusus jika kategori bertambah.

------------------------------------------------------------------------

# 9. Tabel `pesantren_resources`

**Tujuan:** menyimpan angka agregat santri dan sumber daya manusia per
tahun.

  ------------------------------------------------------------------------------------
  Kolom                          Tipe              Kewajiban         Aturan /
                                                                     Keterangan
  ------------------------------ ----------------- ----------------- -----------------
  `id`                           UUID              Wajib, sistem     Primary key

  `pesantren_id`                 UUID              Wajib             FK ke
                                                                     `pesantren.id`

  `tahun_data`                   INTEGER           Wajib             Tahun data

  `jumlah_santri_putra`          INTEGER           Opsional          Bilangan bulat
                                                                     \>= 0

  `jumlah_santri_putri`          INTEGER           Opsional          Bilangan bulat
                                                                     \>= 0

  `jumlah_santri_mukim`          INTEGER           Opsional          Bilangan bulat
                                                                     \>= 0

  `jumlah_santri_nonmukim`       INTEGER           Opsional          Bilangan bulat
                                                                     \>= 0

  `jumlah_pengajar`              INTEGER           Opsional          Bilangan bulat
                                                                     \>= 0

  `jumlah_tenaga_kependidikan`   INTEGER           Opsional          Bilangan bulat
                                                                     \>= 0

  `jumlah_pengelola_lain`        INTEGER           Opsional          Bilangan bulat
                                                                     \>= 0

  `sumber_informasi`             VARCHAR(255)      Opsional          Sumber angka

  `catatan`                      TEXT              Opsional          Penjelasan

  `created_at`                   TIMESTAMP         Wajib, sistem     Waktu pembuatan

  `updated_at`                   TIMESTAMP         Wajib, sistem     Waktu pembaruan
  ------------------------------------------------------------------------------------

**Aturan tambahan:** - Unique constraint konseptual: (`pesantren_id`,
`tahun_data`). - Jangan mengasumsikan jumlah santri mukim + nonmukim
selalu sama dengan total putra + putri tanpa definisi dan pemeriksaan
yang konsisten. - Jangan menggunakan nol untuk angka yang belum
diketahui. - Hanya angka agregat; tidak ada nama atau identitas santri
individual.

------------------------------------------------------------------------

# 10. Tabel `pesantren_facilities`

**Tujuan:** mencatat fasilitas dan kondisi sarana pesantren.

  ------------------------------------------------------------------------
  Kolom              Tipe              Kewajiban         Aturan /
                                                         Keterangan
  ------------------ ----------------- ----------------- -----------------
  `id`               UUID              Wajib, sistem     Primary key

  `pesantren_id`     UUID              Wajib             FK ke
                                                         `pesantren.id`

  `nama_fasilitas`   VARCHAR(255)      Wajib             Nama fasilitas

  `kategori`         VARCHAR(50)       Opsional          Contoh: ibadah,
                                                         asrama,
                                                         pendidikan,
                                                         sanitasi

  `jumlah`           INTEGER           Opsional          Bilangan bulat
                                                         \>= 0

  `kondisi`          VARCHAR(30)       Opsional          `good`,
                                                         `adequate`,
                                                         `needs_repair`,
                                                         `unknown`

  `keterangan`       TEXT              Opsional          Catatan kondisi

  `tahun_data`       INTEGER           Opsional          Tahun pendataan

  `created_at`       TIMESTAMP         Wajib, sistem     Waktu pembuatan

  `updated_at`       TIMESTAMP         Wajib, sistem     Waktu pembaruan
  ------------------------------------------------------------------------

------------------------------------------------------------------------

# 11. Tabel `pesantren_programs`

**Tujuan:** mencatat program dan kegiatan pesantren.

  ------------------------------------------------------------------------
  Kolom              Tipe              Kewajiban         Aturan /
                                                         Keterangan
  ------------------ ----------------- ----------------- -----------------
  `id`               UUID              Wajib, sistem     Primary key

  `pesantren_id`     UUID              Wajib             FK ke
                                                         `pesantren.id`

  `nama_program`     VARCHAR(255)      Wajib             Nama program

  `kategori`         VARCHAR(50)       Wajib             `education`,
                                                         `economy`,
                                                         `social`,
                                                         `protection`,
                                                         `other`

  `deskripsi`        TEXT              Opsional          Uraian program

  `status_program`   VARCHAR(30)       Wajib             `active`,
                                                         `inactive`,
                                                         `planned`

  `tahun_mulai`      INTEGER           Opsional          Tahun mulai

  `tahun_selesai`    INTEGER           Opsional          Tahun selesai
                                                         jika berakhir

  `created_at`       TIMESTAMP         Wajib, sistem     Waktu pembuatan

  `updated_at`       TIMESTAMP         Wajib, sistem     Waktu pembaruan
  ------------------------------------------------------------------------

------------------------------------------------------------------------

# 12. Tabel `pesantren_development_profiles`

**Tujuan:** menyimpan hasil profiling, kondisi, potensi, kebutuhan, dan
rekomendasi pengembangan.

  --------------------------------------------------------------------------------
  Kolom                      Tipe              Kewajiban         Aturan /
                                                                 Keterangan
  -------------------------- ----------------- ----------------- -----------------
  `id`                       UUID              Wajib, sistem     Primary key

  `pesantren_id`             UUID              Wajib             FK ke
                                                                 `pesantren.id`

  `tahun_profiling`          INTEGER           Wajib             Tahun penilaian

  `kategori`                 VARCHAR(50)       Wajib             Kategori
                                                                 profiling

  `kondisi_saat_ini`         TEXT              Opsional          Gambaran kondisi

  `tingkat_kebutuhan`        VARCHAR(30)       Opsional          `low`, `medium`,
                                                                 `high`, `urgent`,
                                                                 `unknown`

  `potensi`                  TEXT              Opsional          Potensi yang
                                                                 teridentifikasi

  `kebutuhan_pengembangan`   TEXT              Opsional          Kebutuhan
                                                                 pesantren

  `rekomendasi`              TEXT              Opsional          Rekomendasi
                                                                 tindak lanjut

  `nama_usaha`               VARCHAR(255)      Opsional          Nama unit usaha / badan
                                                                 usaha pesantren

  `bentuk_usaha`             VARCHAR(50)       Opsional          `kopontren`, `yayasan`,
                                                                 `cv`, `pt`, `perorangan`,
                                                                 `other`

  `bidang_usaha`             VARCHAR(100)      Opsional          `retail`, `pertanian`,
                                                                 `peternakan`, `konveksi`,
                                                                 `jasa`, `makanan_minuman`,
                                                                 `other`

  `status_usaha`             VARCHAR(30)       Opsional          `active`, `planned`,
                                                                 `inactive`

  `catatan_verifikator`      TEXT              Opsional          Catatan internal

  `assessed_by`              UUID              Opsional          FK ke `users.id`

  `assessed_at`              TIMESTAMP         Opsional          Waktu asesmen

  `created_at`               TIMESTAMP         Wajib, sistem     Waktu pembuatan

  `updated_at`               TIMESTAMP         Wajib, sistem     Waktu pembaruan
  --------------------------------------------------------------------------------

Nilai awal `kategori`: - `governance` - `administration` - `finance` -
`education` - `digitalization` - `student_protection` -
`economic_independence` - `facilities`

Profiling merupakan instrumen pemetaan kebutuhan dan pengembangan, bukan
akreditasi atau pemeringkatan resmi.

------------------------------------------------------------------------

# 13. Tabel `pesantren_verifications`

**Tujuan:** mencatat setiap proses dan hasil verifikasi.

  ---------------------------------------------------------------------------------
  Kolom                  Tipe              Kewajiban         Aturan / Keterangan
  ---------------------- ----------------- ----------------- ----------------------
  `id`                   UUID              Wajib, sistem     Primary key

  `pesantren_id`         UUID              Wajib             FK ke `pesantren.id`

  `jenis_verifikasi`     VARCHAR(40)       Wajib             `identity`,
                                                             `location`,
                                                             `legality`, `profile`,
                                                             `publication`

  `status`               VARCHAR(30)       Wajib             `under_review`,
                                                             `revision_required`,
                                                             `verified`, `rejected`

  `verifier_id`          UUID              Wajib saat        FK ke `users.id`
                                           diproses          

  `tanggal_verifikasi`   TIMESTAMP         Opsional          Waktu keputusan

  `catatan`              TEXT              Opsional          Hasil pemeriksaan

  `alasan_revisi`        TEXT              Opsional          Wajib jika meminta
                                                             revisi

  `created_at`           TIMESTAMP         Wajib, sistem     Waktu pembuatan
  ---------------------------------------------------------------------------------

**Aturan tambahan:** - Setiap siklus pemeriksaan menghasilkan record
baru atau histori yang dapat ditelusuri. - Operator tidak dapat menjadi
verifier untuk pengajuan miliknya sendiri. - Verifikasi satu jenis tidak
otomatis memverifikasi jenis lain.

------------------------------------------------------------------------

# 14. Tabel `document_files`

**Tujuan:** menyimpan metadata file yang disimpan di Google Drive pada
tahap awal dan object storage pada tahap permanen.

  ------------------------------------------------------------------------------
  Kolom                Tipe              Kewajiban         Aturan / Keterangan
  -------------------- ----------------- ----------------- ---------------------
  `id`                 UUID              Wajib, sistem     Primary key

  `pesantren_id`       UUID              Wajib             FK ke `pesantren.id`

  `kategori_dokumen`   VARCHAR(50)       Wajib             Kategori dokumen

  `nama_file`          VARCHAR(255)      Wajib             Nama asli untuk
                                                           tampilan

  `storage_provider`   VARCHAR(30)       Wajib             `google_drive`,
                                                           `supabase_storage`,
                                                           `other`

  `storage_path`       TEXT              Wajib             ID/path internal
                                                           penyimpanan

  `mime_type`          VARCHAR(150)      Opsional          MIME type

  `ukuran_file`        INTEGER           Opsional          Ukuran byte

  `access_level`       VARCHAR(30)       Wajib             `internal`,
                                                           `restricted`,
                                                           `public_approved`

  `uploaded_by`        UUID              Wajib             FK ke `users.id`

  `uploaded_at`        TIMESTAMP         Wajib, sistem     Waktu unggah

  `is_active`          BOOLEAN           Wajib             Status file
  ------------------------------------------------------------------------------

**Aturan tambahan:** - Jangan menyimpan URL publik permanen untuk
dokumen restricted. - Pada migrasi, `storage_path` diperbarui melalui
proses pemetaan. - Validasi ekstensi, MIME type, dan ukuran dilakukan di
backend.

------------------------------------------------------------------------

# 15. Tabel `data_sources`

**Tujuan:** mencatat sumber awal atau sumber pembaruan data.

  ---------------------------------------------------------------------------------
  Kolom             Tipe              Kewajiban         Aturan / Keterangan
  ----------------- ----------------- ----------------- ---------------------------
  `id`              UUID              Wajib, sistem     Primary key

  `nama_sumber`     VARCHAR(255)      Wajib             Nama sumber

  `jenis_sumber`    VARCHAR(40)       Wajib             `rmi_field_survey`,
                                                        `institution_submission`,
                                                        `government_reference`,
                                                        `public_information`,
                                                        `other`

  `keterangan`      TEXT              Opsional          Penjelasan

  `created_at`      TIMESTAMP         Wajib, sistem     Waktu pembuatan
  ---------------------------------------------------------------------------------

Sumber data membantu membedakan informasi dari survei lapangan,
pengajuan pesantren, referensi pemerintah, dan informasi publik.

------------------------------------------------------------------------

# 16. Tabel `publication_consents`

**Tujuan:** mencatat persetujuan atau dasar otorisasi publikasi data.

  -------------------------------------------------------------------------------------
  Kolom                    Tipe              Kewajiban         Aturan / Keterangan
  ------------------------ ----------------- ----------------- ------------------------
  `id`                     UUID              Wajib, sistem     Primary key

  `pesantren_id`           UUID              Wajib             FK ke `pesantren.id`

  `jenis_persetujuan`      VARCHAR(50)       Wajib             `institution_profile`,
                                                               `contact`, `photo`,
                                                               `document`, `other`

  `status_persetujuan`     VARCHAR(30)       Wajib             `pending`, `granted`,
                                                               `denied`, `withdrawn`

  `tanggal_persetujuan`    DATE              Opsional          Tanggal persetujuan

  `pemberi_persetujuan`    VARCHAR(255)      Opsional          Nama dan kapasitas
                                                               pemberi persetujuan

  `dokumen_pendukung_id`   UUID              Opsional          FK ke
                                                               `document_files.id`

  `catatan`                TEXT              Opsional          Catatan

  `created_at`             TIMESTAMP         Wajib, sistem     Waktu pencatatan

  `updated_at`             TIMESTAMP         Wajib, sistem     Waktu pembaruan
  -------------------------------------------------------------------------------------

Persetujuan publikasi harus spesifik pada jenis data atau materi yang
disetujui. Status `granted` untuk profil tidak otomatis mengizinkan
publikasi semua dokumen atau kontak pribadi.

------------------------------------------------------------------------

# 17. Tabel `data_history`

**Tujuan:** mencatat perubahan data pada record bisnis.

  --------------------------------------------------------------------------
  Kolom                Tipe              Kewajiban         Aturan /
                                                           Keterangan
  -------------------- ----------------- ----------------- -----------------
  `id`                 UUID              Wajib, sistem     Primary key

  `pesantren_id`       UUID              Wajib             FK ke
                                                           `pesantren.id`

  `nama_tabel`         VARCHAR(100)      Wajib             Nama tabel yang
                                                           berubah

  `record_id`          UUID              Wajib             ID record yang
                                                           berubah

  `jenis_perubahan`    VARCHAR(30)       Wajib             `create`,
                                                           `update`,
                                                           `archive`,
                                                           `restore`

  `nilai_sebelumnya`   JSON              Opsional          Snapshot nilai
                                                           lama atau field
                                                           yang berubah

  `nilai_baru`         JSON              Opsional          Snapshot nilai
                                                           baru atau field
                                                           yang berubah

  `changed_by`         UUID              Opsional          FK ke `users.id`
                                                           atau identitas
                                                           sistem

  `changed_at`         TIMESTAMP         Wajib, sistem     Waktu perubahan

  `change_reason`      TEXT              Opsional          Alasan perubahan
  --------------------------------------------------------------------------

Jangan menyimpan kata sandi, token, atau secret dalam histori.

------------------------------------------------------------------------

# 18. Tabel `audit_logs`

**Tujuan:** mencatat aktivitas keamanan dan penggunaan aplikasi.

  ---------------------------------------------------------------------------
  Kolom             Tipe              Kewajiban         Aturan / Keterangan
  ----------------- ----------------- ----------------- ---------------------
  `id`              UUID              Wajib, sistem     Primary key

  `user_id`         UUID              Opsional          FK ke `users.id`;
                                                        kosong untuk proses
                                                        sistem

  `action`          VARCHAR(100)      Wajib             Contoh `login`,
                                                        `create_pesantren`,
                                                        `verify_data`

  `resource_type`   VARCHAR(100)      Opsional          Jenis objek

  `resource_id`     UUID              Opsional          ID objek

  `metadata`        JSON              Opsional          Metadata aman, tanpa
                                                        secret

  `created_at`      TIMESTAMP         Wajib, sistem     Waktu aktivitas
  ---------------------------------------------------------------------------

Audit log bersifat append-only untuk pengguna aplikasi. Koreksi
administratif harus melalui prosedur khusus dan tetap meninggalkan
jejak.

------------------------------------------------------------------------

# 19. Tabel `annual_snapshots`

**Tujuan:** menyimpan snapshot data untuk pelaporan tahunan.

  Kolom             Tipe        Kewajiban       Aturan / Keterangan
  ----------------- ----------- --------------- ----------------------------------
  `id`              UUID        Wajib, sistem   Primary key
  `pesantren_id`    UUID        Wajib           FK ke `pesantren.id`
  `tahun`           INTEGER     Wajib           Tahun snapshot
  `snapshot_data`   JSON        Wajib           Data terpilih pada saat snapshot
  `created_at`      TIMESTAMP   Wajib, sistem   Waktu pembuatan
  `created_by`      UUID        Opsional        FK ke `users.id`

Unique constraint konseptual: (`pesantren_id`, `tahun`) untuk jenis
snapshot yang sama. Jika dibutuhkan beberapa snapshot per tahun,
tambahkan kolom `snapshot_type` dan revisi dictionary.

Snapshot tidak menggantikan tabel sumber.

------------------------------------------------------------------------

# 20. Tabel `users`

**Tujuan:** identitas akun pengguna aplikasi. Pada tahap permanen,
identitas autentikasi dapat ditautkan ke Supabase Auth.

  -----------------------------------------------------------------------
  Kolom             Tipe              Kewajiban         Aturan /
                                                        Keterangan
  ----------------- ----------------- ----------------- -----------------
  `id`              UUID              Wajib, sistem     Primary key
                                                        aplikasi

  `auth_user_id`    UUID              Opsional          ID dari provider
                                                        autentikasi pada
                                                        tahap permanen

  `nama_lengkap`    VARCHAR(255)      Wajib             Nama pengguna

  `email`           VARCHAR(255)      Wajib             Email unik dan
                                                        dinormalisasi

  `nomor_telepon`   VARCHAR(30)       Opsional          Kontak pengguna

  `status_akun`     VARCHAR(30)       Wajib             `invited`,
                                                        `active`,
                                                        `suspended`,
                                                        `disabled`

  `last_login_at`   TIMESTAMP         Opsional          Login terakhir

  `created_at`      TIMESTAMP         Wajib, sistem     Waktu pembuatan

  `updated_at`      TIMESTAMP         Wajib, sistem     Waktu pembaruan
  -----------------------------------------------------------------------

**Aturan tambahan:** - Password tidak disimpan pada worksheet atau tabel
ini. - Password ditangani oleh provider autentikasi. - Email harus unik
setelah normalisasi huruf kecil dan spasi. - Akun operator harus
diundang atau disetujui oleh admin.

------------------------------------------------------------------------

# 21. Tabel `roles` / `app_roles`

**Tujuan:** daftar master 7 peran resmi RMI PCNU Demak dan visualisasinya.

  Kolom         Tipe           Kewajiban       Aturan / Keterangan
  ------------- -------------- --------------- -----------------------------------------------
  `id`          UUID           Wajib, sistem   Primary key
  `role_key`    VARCHAR(50)    Wajib           Unik (`super_admin`, `admin_kabupaten`, dll)
  `role_name`   VARCHAR(100)   Wajib           Nama tampilan lengkap
  `level`       INTEGER        Wajib           Tingkat hierarki kewenangan (1 - 7)
  `description` TEXT           Opsional        Penjelasan wewenang peran
  `badge_color` VARCHAR(30)    Wajib           Warna identitas badge UI Asnawiyyah
  `is_active`   BOOLEAN        Wajib           Status keaktifan role
  `created_at`  TIMESTAMP      Wajib, sistem   Waktu inisialisasi
  `updated_at`  TIMESTAMP      Wajib, sistem   Waktu pembaruan

Master 7 Peran Resmi:
1. `super_admin`: Super Admin (PCNU Demak & IT Core) — Level 1, Badge: `purple`
2. `admin_kabupaten`: Admin Kabupaten (Pengurus Harian PC RMI) — Level 2, Badge: `emerald`
3. `admin_kecamatan`: Admin Kecamatan (Koordinator 14 MWC NU) — Level 3, Badge: `amber`
4. `operator_pesantren`: Operator Pesantren (Sekretariat Pondok) — Level 4, Badge: `cyan`
5. `pengasuh`: Dewan Masyayikh / Pengasuh — Level 5, Badge: `indigo`
6. `verifikator`: Tim Asesor & Verifikator Lapangan — Level 6, Badge: `rose`
7. `guest`: Tamu Terdaftar / Peneliti Eksternal — Level 7, Badge: `slate`

------------------------------------------------------------------------

# 21.1 Tabel `rbac_permissions` (Matriks Hak Akses Dinamis 11 Modul)

**Tujuan:** menyimpan konfigurasi matriks hak akses per modul per peran secara dinamis.

  Kolom               Tipe           Kewajiban       Aturan / Keterangan
  ------------------- -------------- --------------- -------------------------------------------------------------
  `id`                UUID           Wajib, sistem   Primary key
  `module_key`        VARCHAR(50)    Wajib           Kunci unik modul (misal: `dashboard`, `tambah`, `pengguna`)
  `module_name`       VARCHAR(100)   Wajib           Nama tampilan modul
  `role_key`          VARCHAR(50)    Wajib           Kunci peran terkait
  `permission_level`  VARCHAR(30)    Wajib           `full`, `read`, `write`, `read_own`, `none`
  `can_create`        BOOLEAN        Wajib           Hak membuat record baru
  `can_read`          BOOLEAN        Wajib           Hak membaca data
  `can_update`        BOOLEAN        Wajib           Hak mengubah data
  `can_delete`        BOOLEAN        Wajib           Hak menghapus data
  `can_verify`        BOOLEAN        Wajib           Hak melakukan verifikasi/legalisasi
  `updated_by`        VARCHAR(100)   Wajib           Operator yang melakukan perubahan izin
  `updated_at`        TIMESTAMP      Wajib, sistem   Waktu perubahan izin terakhir

------------------------------------------------------------------------

# 22. Tabel `user_assignments`

**Tujuan:** menghubungkan pengguna, role, dan cakupan kewenangan.

  ---------------------------------------------------------------------------
  Kolom                 Tipe              Kewajiban         Aturan /
                                                            Keterangan
  --------------------- ----------------- ----------------- -----------------
  `id`                  UUID              Wajib, sistem     Primary key

  `user_id`             UUID              Wajib             FK ke `users.id`

  `role_id`             UUID              Wajib             FK ke `roles.id`

  `pesantren_id`        UUID              Kondisional       FK ke
                                                            `pesantren.id`,
                                                            untuk operator
                                                            pesantren

  `kecamatan_id`        UUID              Kondisional       FK ke
                                                            `districts.id`,
                                                            untuk admin
                                                            kecamatan

  `status_assignment`   VARCHAR(30)       Wajib             `active`,
                                                            `inactive`,
                                                            `revoked`

  `assigned_by`         UUID              Wajib             FK ke `users.id`

  `assigned_at`         TIMESTAMP         Wajib, sistem     Waktu penugasan

  `expires_at`          TIMESTAMP         Opsional          Masa berlaku jika
                                                            ada
  ---------------------------------------------------------------------------

**Aturan tambahan:** - `operator_pesantren` harus memiliki
`pesantren_id`. - `admin_kecamatan` harus memiliki `kecamatan_id`. -
Penugasan `super_admin` dan `admin_kabupaten` mengikuti kebijakan
administrator. - Backend memeriksa assignment aktif pada setiap
operasi. - Pencabutan akses mengubah status assignment, bukan menghapus
histori.

------------------------------------------------------------------------

# 23. Tabel `districts`

**Tujuan:** referensi kecamatan di Kabupaten Demak.

  ------------------------------------------------------------------------
  Kolom              Tipe              Kewajiban         Aturan /
                                                         Keterangan
  ------------------ ----------------- ----------------- -----------------
  `id`               UUID              Wajib, sistem     Primary key

  `kode_wilayah`     VARCHAR(30)       Wajib             Kode referensi
                                                         resmi jika
                                                         tersedia

  `nama_kecamatan`   VARCHAR(150)      Wajib             Nama kecamatan

  `is_active`        BOOLEAN           Wajib             Status referensi

  `created_at`       TIMESTAMP         Wajib, sistem     Waktu pembuatan
  ------------------------------------------------------------------------

Gunakan referensi wilayah resmi dan versi yang dapat ditelusuri. Jangan
membuat kode wilayah berdasarkan urutan baris spreadsheet.

------------------------------------------------------------------------

# 24. Tabel `villages`

**Tujuan:** referensi desa/kelurahan dan relasinya ke kecamatan.

  -----------------------------------------------------------------------
  Kolom             Tipe              Kewajiban         Aturan /
                                                        Keterangan
  ----------------- ----------------- ----------------- -----------------
  `id`              UUID              Wajib, sistem     Primary key

  `district_id`     UUID              Wajib             FK ke
                                                        `districts.id`

  `kode_wilayah`    VARCHAR(30)       Wajib             Kode referensi
                                                        resmi jika
                                                        tersedia

  `nama_desa`       VARCHAR(150)      Wajib             Nama
                                                        desa/kelurahan

  `jenis_wilayah`   VARCHAR(20)       Wajib             `desa`,
                                                        `kelurahan`

  `is_active`       BOOLEAN           Wajib             Status referensi
  -----------------------------------------------------------------------

Nama desa tidak cukup untuk mengidentifikasi wilayah secara unik.
Gunakan kode wilayah resmi jika tersedia.

------------------------------------------------------------------------

# 25. Tabel `id_sequences`

**Tujuan:** mengelola sequence penerbitan kode internal RMI.

  ----------------------------------------------------------------------------
  Kolom              Tipe              Kewajiban         Aturan / Keterangan
  ------------------ ----------------- ----------------- ---------------------
  `id`               UUID              Wajib, sistem     Primary key

  `sequence_name`    VARCHAR(100)      Wajib             Contoh
                                                         `pesantren_rmi_dmk`

  `prefix`           VARCHAR(30)       Wajib             `RMI-DMK-`

  `current_value`    INTEGER           Wajib             Nomor terakhir yang
                                                         telah dialokasikan

  `padding_length`   INTEGER           Wajib             Contoh `6`

  `updated_at`       TIMESTAMP         Wajib, sistem     Waktu pembaruan
  ----------------------------------------------------------------------------

**Aturan tambahan:** - Satu sequence aktif per jenis kode. - Alokasi
nomor harus atomik. - Nomor yang sudah dialokasikan tidak boleh dipakai
ulang, termasuk jika proses pembuatan record berikutnya gagal. - Pada
Apps Script gunakan `LockService`. - Pada PostgreSQL gunakan sequence
atau mekanisme transaksi yang aman.

------------------------------------------------------------------------

# 26. Tabel `system_settings`

**Tujuan:** menyimpan konfigurasi aplikasi yang bukan secret.

  Kolom             Tipe           Kewajiban       Aturan / Keterangan
  ----------------- -------------- --------------- ---------------------
  `id`              UUID           Wajib, sistem   Primary key
  `setting_key`     VARCHAR(100)   Wajib           Unik
  `setting_value`   TEXT           Opsional        Nilai konfigurasi
  `description`     TEXT           Opsional        Penjelasan
  `updated_by`      UUID           Opsional        FK ke `users.id`
  `updated_at`      TIMESTAMP      Wajib, sistem   Waktu pembaruan

Jangan menyimpan password, API secret, service-role key, token, atau
kredensial sensitif di tabel ini.

------------------------------------------------------------------------

# 27. Daftar Nilai Baku

Nilai berikut harus dipakai konsisten di frontend, Apps Script, dan
PostgreSQL.

## 27.1 Status operasional pesantren

-   `active`
-   `inactive`
-   `unknown`

## 27.2 Status keanggotaan RMI

-   `member`
-   `non_member`
-   `unknown`

## 27.3 Status pendataan

-   `draft`
-   `submitted`
-   `revision_required`
-   `completed`

## 27.4 Status verifikasi

-   `not_verified`
-   `under_review`
-   `verified`
-   `rejected`

## 27.5 Status lokasi

-   `not_verified`
-   `under_review`
-   `verified`
-   `needs_correction`

## 27.6 Status publikasi

-   `private`
-   `pending_approval`
-   `approved`
-   `published`
-   `unpublished`

## 27.7 Tingkat kebutuhan

-   `low`
-   `medium`
-   `high`
-   `urgent`
-   `unknown`

## 27.8 Jenjang Marhalah Kitab Kuning

-   `ula` (Tingkat Dasar)
-   `wustho` (Tingkat Menengah)
-   `ulya` (Tingkat Lanjutan/Tinggi)
-   `other` (Kajian Tematik / Khusus)
-   `none` (Bukan Program Kitab)

## 27.9 Bentuk Badan Usaha Pesantren

-   `kopontren` (Koperasi Pondok Pesantren)
-   `yayasan` (Unit Usaha Yayasan)
-   `cv` (Persekutuan Komanditer)
-   `pt` (Perseroan Terbatas)
-   `perorangan` (Usaha Mandiri/Perorangan)
-   `other` (Bentuk Usaha Lain)

## 27.10 Bidang Usaha Pesantren

-   `retail` (Toko, Minimarket, Kitab/ATK)
-   `pertanian` (Agribisnis, Perkebunan)
-   `peternakan` (Perikanan, Peternakan)
-   `konveksi` (Busana Muslim, Seragam, Sablon)
-   `jasa` (Percetakan, Laundry, Ekspedisi)
-   `makanan_minuman` (Katering, Air Mineral, Roti)
-   `other` (Bidang Usaha Lain)

## 27.11 Kategori Dewan Pengajar / Asatidz

-   `pengasuh` (Pengasuh / Khadimul Ma'had)
-   `ustadz` (Dewan Guru Putra)
-   `ustadzah` (Dewan Guru Putri)
-   `other` (Tenaga Pengajar Tamu/Lainnya)

Label yang tampil di UI boleh berbahasa Indonesia, tetapi kode yang
disimpan harus tetap konsisten.

------------------------------------------------------------------------

# 28. Aturan Validasi Lintas Tabel

  Aturan               Validasi
  -------------------- --------------------------------------------------------
  Nama pesantren       Tidak boleh kosong; trim spasi
  Kode RMI             Unik dan sesuai pola
  Tahun berdiri        Tahun valid dan tidak di masa depan
  Tahun data           Tahun empat digit
  Jumlah santri/SDM    Integer nonnegatif
  Koordinat            Latitude dan longitude berpasangan serta dalam rentang
  Email                Format email valid dan dinormalisasi
  URL                  Skema URL valid
  Nomor telepon        Normalisasi format
  Foreign key          Record referensi harus tersedia
  Desa dan kecamatan   Desa harus berada pada kecamatan yang dipilih
  Status               Harus termasuk daftar nilai baku
  Dokumen              Validasi tipe, ukuran, dan hak akses
  Operator             Harus memiliki assignment aktif
  Verifikasi           Hanya petugas berwenang
  Publikasi            Harus lolos aturan persetujuan

Validasi dilakukan di backend. Validasi frontend hanya membantu
pengalaman pengguna dan tidak menggantikan validasi server.

------------------------------------------------------------------------

# 29. Pemetaan Worksheet Google Sheets

Setiap tabel di bawah menjadi satu worksheet. Header harus identik
dengan urutan kolom dalam dictionary atau manifest implementasi yang
dihasilkan darinya.

  Worksheet                          Tabel
  ---------------------------------- ----------------------------------
  `pesantren`                        `pesantren`
  `pesantren_locations`              `pesantren_locations`
  `pesantren_leaders`                `pesantren_leaders`
  `pesantren_contacts`               `pesantren_contacts`
  `pesantren_legalities`             `pesantren_legalities`
  `pesantren_education`              `pesantren_education`
  `pesantren_resources`              `pesantren_resources`
  `pesantren_facilities`             `pesantren_facilities`
  `pesantren_programs`               `pesantren_programs`
  `pesantren_development_profiles`   `pesantren_development_profiles`
  `pesantren_verifications`          `pesantren_verifications`
  `document_files`                   `document_files`
  `data_sources`                     `data_sources`
  `publication_consents`             `publication_consents`
  `data_history`                     `data_history`
  `audit_logs`                       `audit_logs`
  `annual_snapshots`                 `annual_snapshots`
  `app_users`                        `app_users` (Akun Pengguna Terpadu)
  `app_roles`                        `app_roles` (Master 7 Peran Resmi)
  `rbac_permissions`                 `rbac_permissions` (Matriks Hak Akses 11 Modul)
  `user_assignments`                 `user_assignments`
  `districts`                        `districts`
  `villages`                         `villages`
  `id_sequences`                     `id_sequences`
  `system_settings`                  `system_settings`

Jangan memberikan akses edit langsung kepada operator pesantren pada
workbook utama. Semua operasi dilakukan melalui aplikasi dan backend.

------------------------------------------------------------------------

# 30. Catatan Implementasi dan Hal yang Belum Diputuskan

Database Dictionary v1.0 menetapkan struktur konseptual dan aturan
utama. Hal berikut perlu dipastikan sebelum SQL migration dan pembuatan
spreadsheet final:

1.  Referensi kode wilayah resmi dan sumber datanya.
2.  Apakah satu pesantren dapat memiliki beberapa lokasi operasional
    dalam kebutuhan nyata.
3.  Definisi operasional angka santri mukim/nonmukim dan putra/putri
    agar tidak tumpang tindih.
4.  Daftar kategori program pendidikan dan fasilitas final.
5.  Kebijakan masa berlaku penugasan operator.
6.  Apakah snapshot tahunan cukup satu jenis atau memerlukan beberapa
    jenis snapshot.
7.  Retensi dokumen dan histori.
8.  Field mana yang boleh tampil pada direktori publik.
9.  Prosedur persetujuan publikasi.
10. Mekanisme autentikasi yang aman untuk operator eksternal pada tahap
    Apps Script.

Setiap perubahan struktur setelah dokumen disahkan harus dicatat dalam
changelog dan menaikkan versi jika memengaruhi kompatibilitas data atau
API.

------------------------------------------------------------------------

# 31. Acceptance Criteria Database Dictionary v1.0

-   [ ] Nama tabel dan kolom disetujui.
-   [ ] Tipe data dan aturan wajib/opsional disetujui.
-   [ ] Primary key dan foreign key disetujui.
-   [ ] Daftar nilai baku disetujui.
-   [ ] Aturan ID dan sequence disetujui.
-   [ ] Aturan status dan workflow konsisten.
-   [ ] Field publik dan internal ditetapkan.
-   [ ] Referensi wilayah disiapkan.
-   [ ] Header worksheet dapat dihasilkan tanpa interpretasi ulang.
-   [ ] Skema dapat diterjemahkan ke PostgreSQL tanpa perubahan konsep
    besar.

------------------------------------------------------------------------

# 32. Penutup

Database Dictionary v1.1 menjadi kamus data resmi untuk prototype dan
migrasi Pesantren Data Center yang telah diselaraskan dengan portal nasional Digdaya Pesantren PBNU.

Google Sheets, Apps Script, Node.js, dan Supabase harus mengikuti
definisi data yang sama. Perbedaan implementasi teknologi tidak boleh
mengubah makna, identitas, dan aturan bisnis data.

**Satu definisi data untuk seluruh siklus hidup Pesantren Data Center.**

------------------------------------------------------------------------

# 33. Riwayat Pembaruan (Changelog)

### Versi 1.1 (Penyelarasan Standar Digdaya Pesantren PBNU)
- **Tabel `pesantren`:** Penambahan atribut boolean `has_komitmen_pesantren_aman` untuk mendukung program Pesantren Ramah Anak dan pencegahan kekerasan santri PBNU.
- **Tabel `pesantren_education`:** Penambahan atribut kurikulum terstruktur mencakup `marhalah` (`ula`, `wustho`, `ulya`, `other`), `nama_kitab`, `pengarang_kitab` (mushannif), dan `bidang_ilmu` (fan).
- **Tabel `pesantren_leaders`:** Penambahan atribut klasifikasi dewan guru `kategori_pengajar` (`ustadz`, `ustadzah`), `spesialisasi_keilmuan`, dan `pendidikan_terakhir`.
- **Tabel `pesantren_contacts`:** Perluasan jenis kontak mencakup media sosial modern (`youtube`, `instagram`, `facebook`, `tiktok`, `twitter`, `linkedin`) dan `hotline_psb`.
- **Tabel `pesantren_development_profiles`:** Penambahan atribut pendataan unit ekonomi terstruktur mencakup `nama_usaha`, `bentuk_usaha`, `bidang_usaha`, dan `status_usaha`.
- **Daftar Nilai Baku (Section 27):** Penambahan enum resmi 27.8 (Marhalah Kitab), 27.9 (Bentuk Badan Usaha), 27.10 (Bidang Usaha), dan 27.11 (Kategori Dewan Pengajar).
