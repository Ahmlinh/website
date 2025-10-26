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

    // Handle form submission
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
            // SOLUSI: Gunakan approach dengan redirect
            await uploadWithRedirect(docName, category, file);
            
        } catch (error) {
            console.error('Error:', error);
            showResult('error', 'Gagal mengunggah dokumen: ' + error.message);
            setLoadingState(false);
        }
    });

    // Tombol upload lagi
    uploadAnother.addEventListener('click', function() {
        resultSection.style.display = 'none';
        uploadForm.reset();
        fileInfo.textContent = '';
    });

    // Fungsi upload dengan redirect approach
    async function uploadWithRedirect(docName, category, file) {
        return new Promise((resolve, reject) => {
            // Buat form sementara
            const tempForm = document.createElement('form');
            tempForm.style.display = 'none';
            tempForm.method = 'POST';
            tempForm.action = SCRIPT_URL;
            tempForm.enctype = 'multipart/form-data';
            
            // Tambahkan field data
            const fields = {
                'docName': docName,
                'category': category,
                'date': document.getElementById('date').value
            };
            
            for (const [key, value] of Object.entries(fields)) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value;
                tempForm.appendChild(input);
            }
            
            // Tambahkan file
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.name = 'file';
            
            // Buat new FileList (tidak bisa langsung, jadi kita buat workaround)
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            
            tempForm.appendChild(fileInput);
            document.body.appendChild(tempForm);
            
            // Handle response dengan window.postMessage
            window.addEventListener('message', function(event) {
                if (event.data && event.data.type === 'uploadResponse') {
                    document.body.removeChild(tempForm);
                    
                    if (event.data.success) {
                        showResult('success', event.data.message, event.data.fileUrl);
                    } else {
                        showResult('error', event.data.error || 'Upload gagal');
                    }
                    setLoadingState(false);
                    resolve();
                }
            });
            
            // Submit form (ini akan membuka tab baru)
            tempForm.submit();
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
