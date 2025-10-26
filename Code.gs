// ID Folder Google Drive tempat file akan disimpan
// Ganti dengan ID folder Anda
var FOLDER_ID = 'your_folder_id_here';

// ID Spreadsheet untuk log metadata
// Ganti dengan ID spreadsheet Anda
var SPREADSHEET_ID = 'your_spreadsheet_id_here';

function doPost(e) {
  try {
    // Ambil data dari request
    var data = e.parameter;
    var fileBlob = e.postData.contents;
    
    // Parse data JSON jika dikirim sebagai JSON
    var contentType = e.postData.type;
    if (contentType && contentType.indexOf('application/json') !== -1) {
      var jsonData = JSON.parse(e.postData.contents);
      data = jsonData;
      fileBlob = null;
    } else if (contentType && contentType.indexOf('multipart/form-data') !== -1) {
      // Untuk FormData, file ada di e.parameter.file
      fileBlob = e.parameter.file;
    }
    
    // Validasi data yang diperlukan
    if (!data.docName || !data.category) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'Nama dokumen dan kategori diperlukan'
        }))
        .setMimetype(ContentService.MimeType.JSON);
    }
    
    // Simpan file ke Google Drive jika ada
    var fileUrl = '';
    if (fileBlob && fileBlob !== '') {
      fileUrl = saveFileToDrive(fileBlob, data.docName, data.category);
    }
    
    // Simpan metadata ke Spreadsheet
    saveMetadataToSheet(data, fileUrl);
    
    // Kembalikan respons sukses
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        fileUrl: fileUrl,
        message: 'Dokumen berhasil disimpan'
      }))
      .setMimetype(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Tangani error
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimetype(ContentService.MimeType.JSON);
  }
}

function saveFileToDrive(fileBlob, docName, category) {
  try {
    // Dapatkan folder tujuan
    var folder = DriveApp.getFolderById(FOLDER_ID);
    
    // Buat nama file dengan timestamp untuk menghindari duplikasi
    var timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    var fileName = docName + '_' + timestamp;
    
    // Simpan file ke Drive
    var file = folder.createFile(fileBlob);
    file.setName(fileName);
    
    // Setel deskripsi file dengan metadata
    var description = 'Nama: ' + docName + '\nKategori: ' + category;
    file.setDescription(description);
    
    // Kembalikan URL file
    return file.getUrl();
    
  } catch (error) {
    throw new Error('Gagal menyimpan file ke Drive: ' + error.toString());
  }
}

function saveMetadataToSheet(data, fileUrl) {
  try {
    // Buka spreadsheet
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    
    // Jika sheet kosong, buat header
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 5).setValues([[
        'Timestamp', 
        'Nama Dokumen', 
        'Kategori', 
        'Tanggal', 
        'URL File'
      ]]);
    }
    
    // Siapkan data untuk disimpan
    var timestamp = new Date();
    var rowData = [
      timestamp,
      data.docName,
      data.category,
      data.date || '',
      fileUrl || ''
    ];
    
    // Tambahkan data ke sheet
    sheet.appendRow(rowData);
    
  } catch (error) {
    throw new Error('Gagal menyimpan metadata: ' + error.toString());
  }
}

function doGet(e) {
  // Handler untuk request GET (opsional, untuk testing)
  return ContentService
    .createTextOutput(JSON.stringify({
      message: 'Sistem Kearsipan API berjalan',
      timestamp: new Date()
    }))
    .setMimetype(ContentService.MimeType.JSON);
      }
