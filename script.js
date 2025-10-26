const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwYHRgn859si70wu4zIk7nlqiy8f5HklTtHWjoNswMrw4smf586feUu09brZhzpnfPQ/exec';

document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const uploadBtn = document.getElementById('uploadBtn');
    const btnText = document.getElementById('btnText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultSection = document.getElementById('resultSection');
    const resultMessage = document.getElementById('resultMessage');
    const fileLink = document.getElementById('fileLink');
    const uploadAnother = document.getElementById('uploadAnother');

    // Tampilkan info file
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            fileInfo.textContent = `File: ${file.name} (${formatFileSize(file.size)})`;
        } else {
            fileInfo.textContent = '';
        }
    });

    // Handle form submission - SOLUSI BARU
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validasi form
        const docName = document.getElementById('docName').value.trim();
        const category = document.getElementById('category').value;
        const file = fileInput.files[0];
        
        if (!docName) {
            showResult('error', 'Nama dokumen harus diisi');
            return;
        }
        
        if (!category) {
            showResult('error', 'Kategori harus dipilih');
            return;
        }
        
        if (!file) {
            showResult('error', 'File harus dipilih');
            return;
        }
        
        // Tampilkan loading
        setLoadingState(true);
        
        try {
            // Convert file to base64 untuk dikirim via JSON
            const base64File = await fileToBase64(file);
            
            // Siapkan data
            const formData = {
                docName: docName,
                category: category,
                date: document.getElementById('date').value,
                fileName: file.name,
                fileData: base64File,
                mimeType: file.type
            };
            
            console.log('Mengirim data...');
            
            // Kirim data menggunakan Google Apps Script API
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showResult('success', result.message, result.fileUrl);
            } else {
                showResult('error', result.error || 'Upload gagal');
            }
            
        } catch (error) {
            console.error('Error:', error);
            showResult('error', 'Gagal mengunggah dokumen: ' + error.message);
        } finally {
            setLoadingState(false);
        }
    });

    // Tombol upload lagi
    uploadAnother.addEventListener('click', function() {
        resultSection.style.display = 'none';
        uploadForm.reset();
        fileInfo.textContent = '';
    });

    // Fungsi convert file to base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Hapus data:image/jpeg;base64, prefix
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }

    // Fungsi loading state
    function setLoadingState(isLoading) {
        if (isLoading) {
            btnText.textContent = 'Mengunggah...';
            loadingSpinner.style.display = 'block';
            uploadBtn.disabled = true;
        } else {
            btnText.textContent = 'Unggah Dokumen';
            loadingSpinner.style.display = 'none';
            uploadBtn.disabled = false;
        }
    }

    // Fungsi tampilkan hasil
    function showResult(type, message, fileUrl = null) {
        resultMessage.textContent = message;
        resultMessage.className = 'result-message ' + type;
        
        if (type === 'success' && fileUrl) {
            fileLink.href = fileUrl;
            fileLink.style.display = 'inline-block';
        } else {
            fileLink.style.display = 'none';
        }
        
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Fungsi format ukuran file
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});
