// URL Google Apps Script Web App (akan diisi setelah deploy)
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

    // Tampilkan info file yang dipilih
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            fileInfo.textContent = `File: ${file.name} (${formatFileSize(file.size)})`;
        } else {
            fileInfo.textContent = '';
        }
    });

    // Tangani pengiriman form
    uploadForm.addEventListener('submit', function(e) {
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
        
        // Siapkan data untuk dikirim
        const formData = new FormData();
        formData.append('docName', docName);
        formData.append('category', category);
        formData.append('date', document.getElementById('date').value);
        formData.append('file', file);
        
        // Kirim data ke Google Apps Script
        fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showResult('success', 'Dokumen berhasil diunggah!', data.fileUrl);
            } else {
                throw new Error(data.error || 'Terjadi kesalahan saat mengunggah');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showResult('error', 'Gagal mengunggah dokumen: ' + error.message);
        })
        .finally(() => {
            setLoadingState(false);
        });
    });

    // Tombol untuk mengunggah dokumen lain
    uploadAnother.addEventListener('click', function() {
        resultSection.style.display = 'none';
        uploadForm.reset();
        fileInfo.textContent = '';
    });

    // Fungsi untuk mengatur status loading
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

    // Fungsi untuk menampilkan hasil
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

    // Fungsi untuk memformat ukuran file
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});
