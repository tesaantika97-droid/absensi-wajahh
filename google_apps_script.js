/**
 * GOOGLE APPS SCRIPT TEMPLATE - ABSENSI WAJAH
 * 
 * PETUNJUK PENGGUNAAN:
 * 1. Buka Google Sheets (spreadsheet baru atau yang sudah ada).
 * 2. Klik menu "Ekstensi" -> "Apps Script" (Extensions -> Apps Script).
 * 3. Hapus kode bawaan yang ada di editor, lalu tempelkan seluruh kode ini.
 * 4. Simpan proyek dengan menekan ikon Disket atau CTRL+S.
 * 5. Klik tombol "Terapkan" -> "Penerapan Baru" (Deploy -> New deployment).
 * 6. Pilih Jenis Penerapan: "Aplikasi Web" (Web app).
 * 7. Konfigurasikan:
 *    - Deskripsi: Absensi Wajah Web App
 *    - Jalankan sebagai (Execute as): "Saya" (Me - email anda)
 *    - Siapa yang memiliki akses (Who has access): "Siapa saja" (Anyone)
 * 8. Klik "Terapkan" (Deploy). Anda mungkin perlu memberikan izin akses akun Google Anda.
 * 9. Salin "URL Aplikasi Web" (Web App URL) yang dihasilkan.
 * 10. Tempelkan URL tersebut ke kolom pengaturan Google Apps Script di website Absensi Wajah Anda.
 */

// Menangani permintaan POST (saat menyimpan absensi)
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Buat header otomatis jika sheet masih kosong
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Nama", "Tanggal", "Jam", "Foto Wajah (Base64)"]);
    // Format header agar rapi
    sheet.getRange("A1:D1").setFontWeight("bold").setBackground("#F59E0B").setFontColor("#FFFFFF");
  }
  
  try {
    var nama = "";
    var tanggal = "";
    var jam = "";
    var foto = "";
    
    // Periksa jika payload dikirim sebagai JSON string (text/plain)
    if (e.postData && e.postData.contents) {
      var payload = JSON.parse(e.postData.contents);
      nama = payload.nama || "";
      tanggal = payload.tanggal || "";
      jam = payload.jam || "";
      foto = payload.foto || "";
    } else {
      // Jika dikirim sebagai parameter form biasa
      nama = e.parameter.nama || "";
      tanggal = e.parameter.tanggal || "";
      jam = e.parameter.jam || "";
      foto = e.parameter.foto || "";
    }
    
    // Validasi data minimal
    if (!nama) {
      return createJsonResponse("error", "Nama tidak boleh kosong.");
    }
    
    // Tambahkan data ke baris baru di spreadsheet
    sheet.appendRow([nama, tanggal, jam, foto]);
    
    return createJsonResponse("success", "Absensi berhasil disimpan untuk " + nama);
    
  } catch (error) {
    return createJsonResponse("error", "Gagal menyimpan data: " + error.toString());
  }
}

// Menangani permintaan GET (untuk verifikasi URL aktif)
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Google Apps Script Absensi Wajah aktif dan siap menerima data!"
  })).setMimeType(ContentService.MimeType.JSON);
}

// Helper untuk menghasilkan respons JSON yang aman untuk CORS
function createJsonResponse(status, message) {
  var output = {
    status: status,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  return ContentService.createTextOutput(JSON.stringify(output))
                       .setMimeType(ContentService.MimeType.JSON);
}
