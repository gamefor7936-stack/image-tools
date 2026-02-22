const { jsPDF } = window.jspdf;

// --- FUNGSI IMAGE TO PDF ---
async function convertToPDF() {
    const input = document.getElementById('pdfInput');
    const btn = document.getElementById('pdfBtn');
    
    if (input.files.length === 0) return alert("Pilih gambar dulu!");

    btn.innerText = "Memproses...";
    btn.disabled = true;

    const doc = new jsPDF();
    
    for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const imageData = await readFileAsDataURL(file);
        
        // Atur agar satu gambar satu halaman penuh
        const imgProps = doc.getImageProperties(imageData);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        if (i > 0) doc.addPage();
        doc.addImage(imageData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }
    
    doc.save("Hasil-Konversi.pdf");
    btn.innerText = "Download PDF";
    btn.disabled = false;
}

// --- FUNGSI COMPRESSOR ---
async function compressImage() {
    const fileInput = document.getElementById('compressInput');
    const qualityValue = document.getElementById('qualityThreshold').value;
    const btn = document.getElementById('compressBtn');
    const imageFile = fileInput.files[0];

    if (!imageFile) return alert("Pilih gambar dulu!");

    btn.innerText = "Mengompres...";
    btn.disabled = true;

    const options = {
        maxSizeMB: qualityValue, // Menggunakan nilai slider sebagai target MB
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: parseFloat(qualityValue) // Mengatur kualitas awal
    };

    try {
        const compressedFile = await imageCompression(imageFile, options);
        saveFile(URL.createObjectURL(compressedFile), `compressed_${imageFile.name}`);
    } catch (error) {
        alert("Gagal mengompres: " + error.message);
    } finally {
        btn.innerText = "Kompres & Download";
        btn.disabled = false;
    }
}

// --- Split PDF ---
async function splitPDF() {
    const input = document.getElementById('splitInput');
    const btn = document.getElementById('splitBtn');
    const progressText = document.getElementById('splitProgress');
    const mode = document.getElementById('splitMode').value;
    const pagesPerFile = parseInt(document.getElementById('pagesPerFile').value);
    
    if (input.files.length === 0) return alert("Silakan pilih file PDF terlebih dahulu!");

    // 1. Validasi Angka Nol atau Negatif
    if (mode === 'fixed' && (isNaN(pagesPerFile) || pagesPerFile <= 0)) {
        return alert("Jumlah halaman harus lebih besar dari 0!");
    }

    const file = input.files[0];
    btn.disabled = true;
    btn.innerText = "Menganalisa...";
    progressText.classList.remove('hidden');

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();

        // 2. Validasi Jika Input Lebih Besar dari Total Halaman
        if (mode === 'fixed' && pagesPerFile >= pageCount) {
            alert(`Peringatan: PDF ini hanya memiliki ${pageCount} halaman. Tidak ada yang perlu dipecah karena input Anda (${pagesPerFile}) mencakup seluruh isi file.`);
            btn.disabled = false;
            btn.innerText = "Mulai Pecah PDF";
            progressText.classList.add('hidden');
            return; // Hentikan proses
        }

        // 3. Fallback/Peringatan Jika Input > Setengah Total Halaman
        if (mode === 'fixed' && pagesPerFile > pageCount / 2) {
            const konfirmasi = confirm(`PDF memiliki ${pageCount} halaman. Jika Anda memecah setiap ${pagesPerFile} halaman, Anda hanya akan mendapatkan 2 file (file pertama berisi ${pagesPerFile} hal, file kedua berisi sisanya). Lanjutkan?`);
            if (!konfirmasi) {
                btn.disabled = false;
                btn.innerText = "Mulai Pecah PDF";
                progressText.classList.add('hidden');
                return;
            }
        }

        const zip = new JSZip();
        const step = (mode === 'every') ? 1 : pagesPerFile;

        for (let i = 0; i < pageCount; i += step) {
            progressText.innerText = `Memproses bagian ${Math.floor(i/step) + 1}...`;
            
            const newPdf = await PDFLib.PDFDocument.create();
            const pagesToCopy = [];
            for (let j = i; j < i + step && j < pageCount; j++) {
                pagesToCopy.push(j);
            }

            const copiedPages = await newPdf.copyPages(pdfDoc, pagesToCopy);
            copiedPages.forEach(page => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            const fileName = (mode === 'every') 
                ? `halaman_${i + 1}.pdf` 
                : `halaman_${i+1}_sampai_${Math.min(i+step, pageCount)}.pdf`;
            
            zip.file(fileName, pdfBytes);
            await new Promise(resolve => setTimeout(resolve, 5));
        }

        progressText.innerText = "Menyiapkan Download...";
        const zipContent = await zip.generateAsync({ type: "blob" });
        saveFile(URL.createObjectURL(zipContent), `Split_${file.name}.zip`);

    } catch (error) {
        console.error(error);
        alert("Terjadi kesalahan. Pastikan file PDF Anda tidak diproteksi.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Mulai Pecah PDF";
        progressText.classList.add('hidden');
    }
}

// Fungsi untuk memunculkan/menyembunyikan input angka
function toggleSplitInput() {
    const mode = document.getElementById('splitMode').value;
    const inputDiv = document.getElementById('fixedPageInput');
    
    if (mode === 'fixed') {
        inputDiv.style.display = 'block'; // Tampilkan jika pilih 'fixed'
    } else {
        inputDiv.style.display = 'none';  // Sembunyikan jika pilih 'every'
    }
}

// Helper untuk download file
function saveFile(url, fileName) {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
}

// Helper: Membaca file gambar jadi DataURL
function readFileAsDataURL(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });
}