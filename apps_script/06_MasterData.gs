/**
 * =========================================================================
 * 06_MasterData.gs
 * Referensi Master 14 Kecamatan, Standar Kurikulum Turots, & Kategori Lembaga
 * =========================================================================
 */

const MASTER_KECAMATAN_DEMAK = [
  "Bonang", "Demak", "Dempet", "Gajah", "Guntur", "Karanganyar",
  "Karangawen", "Karangtengah", "Mijen", "Mranggen", "Sayung",
  "Wedung", "Wonosalam"
];

const MASTER_TAKhasus_PESANTREN = [
  "Salafiyah Murni (Kitab Kuning)",
  "Tahfidzul Qur'an",
  "Kombinasi (Salaf & Modern)",
  "Modern / Muadalah"
];

function getMasterDistrictList() {
  return { success: true, districts: MASTER_KECAMATAN_DEMAK };
}
