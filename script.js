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

//--- Merge PDF ---
// Variabel global untuk menyimpan antrean file
let selectedFiles = [];

// 1. Fungsi saat user memilih file
function handleMergeFiles(input) {
    const files = Array.from(input.files);
    
    files.forEach(file => {
        // Tambahkan ke array global
        selectedFiles.push(file);
    });

    // Reset input agar bisa pilih file yang sama lagi jika mau
    input.value = "";
    
    renderQueue();
}

// 2. Fungsi untuk menampilkan daftar file di UI
function renderQueue() {
    const queueDiv = document.getElementById('fileQueue');
    const fileCountSpan = document.getElementById('fileCount'); // Elemen ini bisa null saat proses merge
    
    if (queueDiv) {
        queueDiv.innerHTML = ""; 
        selectedFiles.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = "flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200 text-[10px]";
            item.innerHTML = `
                <span class="truncate w-32 font-medium text-gray-700">${index + 1}. ${file.name}</span>
                <button onclick="removeFromQueue(${index})" class="text-red-500 hover:text-red-700 font-bold">Hapus</button>
            `;
            queueDiv.appendChild(item);
        });
    }

    // CEK: Hanya update angka jika elemennya ada (tidak null)
    if (fileCountSpan) {
        fileCountSpan.innerText = selectedFiles.length;
    }
}

// 3. Fungsi hapus file dari antrean
function removeFromQueue(index) {
    selectedFiles.splice(index, 1);
    renderQueue();
}

// 4. Update Fungsi Merge PDF lama Anda
async function mergePDF() {
    const btn = document.getElementById('mergeBtn');
    if (selectedFiles.length < 2) return alert("Pilih minimal 2 file!");

    btn.disabled = true;
    btn.innerText = "Sedang Menggabungkan...";

    try {
        const mergedPdf = await PDFLib.PDFDocument.create();
        for (const file of selectedFiles) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        const pdfBytes = await mergedPdf.save();
        saveFile(URL.createObjectURL(new Blob([pdfBytes])), "Merged.pdf");

        // RESET SETELAH SUKSES
        selectedFiles = [];
        
        // Kembalikan tombol ke HTML semula AGAR span id="fileCount" muncul lagi
        btn.innerHTML = `Gabungkan PDF (<span id="fileCount">0</span> File)`;
        btn.disabled = false;

        renderQueue();
        alert("Berhasil menggabungkan PDF!");

    } catch (error) {
        console.error(error);
        alert("Gagal menggabungkan PDF.");
        // Kembalikan tombol jika gagal
        btn.innerHTML = `Gabungkan PDF (<span id="fileCount">${selectedFiles.length}</span> File)`;
        btn.disabled = false;
    }
}

// --- FUNGSI IMAGE CONVERTER ---
// Variabel global untuk antrean gambar
let selectedImages = [];

// 1. Handle pemilihan file gambar
function handleImageConvertFiles(input) {
    const files = Array.from(input.files);
    files.forEach(file => selectedImages.push(file));
    input.value = ""; // Reset input
    renderImageQueue();
}

// 2. Tampilkan daftar gambar di UI
function renderImageQueue() {
    const queueDiv = document.getElementById('imageQueue');
    const countSpan = document.getElementById('imageCount');
    if (!queueDiv) return;

    queueDiv.innerHTML = "";
    if (countSpan) countSpan.innerText = selectedImages.length;

    selectedImages.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = "flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200 text-[10px]";
        item.innerHTML = `
            <span class="truncate w-32 font-medium text-gray-700 text-balance uppercase text-[9px]">${index + 1}. ${file.name}</span>
            <button onclick="removeImageFromQueue(${index})" class="text-red-500 hover:text-red-700 font-bold">Hapus</button>
        `;
        queueDiv.appendChild(item);
    });
}

// 3. Hapus gambar dari antrean
function removeImageFromQueue(index) {
    selectedImages.splice(index, 1);
    renderImageQueue();
}

// 4. Proses Konversi Massal
async function convertBulkImages() {
    const btn = document.getElementById('convertBtn');
    const targetFormat = document.getElementById('targetFormat').value;
    const extension = targetFormat.split('/')[1];

    if (selectedImages.length === 0) return alert("Pilih gambar terlebih dahulu!");

    btn.disabled = true;
    btn.innerText = "Memproses...";

    try {
        const zip = new JSZip();

        for (let i = 0; i < selectedImages.length; i++) {
            const file = selectedImages[i];
            const convertedBlob = await processSingleImage(file, targetFormat);
            
            // Nama file baru (misal: gambar_1.png)
            const newName = file.name.substring(0, file.name.lastIndexOf('.')) || `image_${i+1}`;
            
            if (selectedImages.length === 1) {
                // Jika cuma 1 gambar, langsung download filenya
                saveFile(URL.createObjectURL(convertedBlob), `${newName}.${extension}`);
            } else {
                // Jika banyak, masukkan ke ZIP
                zip.file(`${newName}.${extension}`, convertedBlob);
            }
        }

        if (selectedImages.length > 1) {
            const zipContent = await zip.generateAsync({ type: "blob" });
            saveFile(URL.createObjectURL(zipContent), `Converted_Images.zip`);
        }

        // Reset setelah selesai
        setTimeout(() => {
            selectedImages = [];
            renderImageQueue();
            alert("Konversi selesai!");
            btn.disabled = false;
            btn.innerHTML = `Konversi & Download (<span id="imageCount">0</span>)`;
        }, 500);

    } catch (error) {
        console.error(error);
        alert("Gagal mengonversi gambar.");
        btn.disabled = false;
        btn.innerHTML = `Konversi & Download (<span id="imageCount">${selectedImages.length}</span>)`;
    }
}

// --- FUNGSI PDF TO IMAGE ---
// Konfigurasi Worker PDF.js (Wajib agar tidak error)
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function convertPdfToImage() {
    const input = document.getElementById('pdfToImageInput');
    const btn = document.getElementById('pdfToImgBtn');
    const progressText = document.getElementById('pdfToImgProgress');
    const format = document.getElementById('imgOutputFormat').value;
    const ext = format === 'image/jpeg' ? 'jpg' : 'png';

    if (input.files.length === 0) return alert("Pilih file PDF dulu!");

    btn.disabled = true;
    btn.innerText = "Membaca PDF...";
    progressText.classList.remove('hidden');

    try {
        const file = input.files[0];
        const arrayBuffer = await file.arrayBuffer();
        
        // Load dokumen PDF
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pageCount = pdf.numPages;
        const zip = new JSZip();

        for (let i = 1; i <= pageCount; i++) {
            progressText.innerText = `Me-render halaman ${i} dari ${pageCount}...`;
            
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // Skala 2.0 agar gambar tajam (HD)
            
            // Buat canvas sementara untuk rendering
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            // Ubah canvas ke Blob gambar
            const imageBlob = await new Promise(resolve => {
                canvas.toBlob(blob => resolve(blob), format, 0.9);
            });

            zip.file(`halaman_${i}.${ext}`, imageBlob);
            
            // Beri nafas ke browser
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        progressText.innerText = "Mengompres ke ZIP...";
        const zipContent = await zip.generateAsync({ type: "blob" });
        saveFile(URL.createObjectURL(zipContent), `PDF_Images_${file.name}.zip`);

        alert("Selesai! Semua halaman telah diubah menjadi gambar.");
    } catch (error) {
        console.error(error);
        alert("Gagal mengonversi PDF. Pastikan file tidak rusak.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Konversi ke Gambar";
        progressText.classList.add('hidden');
    }
}

// Helper: Fungsi Inti Konversi via Canvas
function processSingleImage(file, format) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.src = url;
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob((blob) => {
                URL.revokeObjectURL(url); // Bersihkan memori
                resolve(blob);
            }, format, 0.9); // Kualitas 90%
        };
        img.onerror = reject;
    });
}

// --- FUNGSI ADD WATERMARK ---
let fbCanvas; // Fabric Canvas
let wmObject; // Objek Teks Watermark
let originalPdfDoc; // Dokumen PDF asli
let pdfPageScale = 1; // Skala preview dibanding asli

// 1. Inisialisasi Preview saat File dipilih
async function initWatermarkPreview() {
    const input = document.getElementById('watermarkInput');
    const loadingText = document.getElementById('previewLoading');
    const wrapper = document.getElementById('canvasWrapper');

    if (!input.files[0]) return;
    
    loadingText.innerText = "Membaca Halaman PDF...";
    
    const file = input.files[0];
    const arrayBuffer = await file.arrayBuffer();
    originalPdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    
    // Render halaman 1 sebagai Background Preview menggunakan PDF.js
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    
    const viewport = page.getViewport({ scale: 1.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({ canvasContext: context, viewport: viewport }).promise;

    // Tampilkan Wrapper dan Hapus Loading
    loadingText.classList.add('hidden');
    wrapper.classList.remove('hidden');

    // Inisialisasi Fabric Canvas
    if (fbCanvas) fbCanvas.dispose();
    fbCanvas = new fabric.Canvas('watermarkCanvas', {
        width: viewport.width,
        height: viewport.height,
        backgroundImage: new fabric.Image(canvas)
    });

    // Tambah Objek Watermark Awal
    wmObject = new fabric.IText(document.getElementById('wmText').value, {
        left: viewport.width / 2,
        top: viewport.height / 2,
        fontFamily: 'Helvetica',
        fontSize: 40,
        fill: document.getElementById('wmColor').value,
        opacity: document.getElementById('wmOpacity').value,
        originX: 'center',
        originY: 'center',
        angle: 0
    });

    fbCanvas.add(wmObject);
    fbCanvas.setActiveObject(wmObject);
}

// 2. Update Teks/Warna dari Input ke Preview
function updateWM() {
    if (!wmObject) return;
    wmObject.set({
        text: document.getElementById('wmText').value,
        fill: document.getElementById('wmColor').value,
        opacity: parseFloat(document.getElementById('wmOpacity').value)
    });
    fbCanvas.renderAll();
}

// 3. Simpan PDF dengan Koordinat dari Preview
async function saveWatermarkedPDF() {
    if (!originalPdfDoc || !wmObject) return alert("Pilih PDF dulu!");

    const btn = document.getElementById('watermarkBtn');
    btn.innerText = "Memproses Seluruh Halaman...";
    btn.disabled = true;

    try {
        const pages = originalPdfDoc.getPages();
        const font = await originalPdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        
        // Ambil data dari Preview (Fabric)
        const wmData = {
            text: wmObject.text,
            x: wmObject.left,
            y: fbCanvas.height - wmObject.top, // PDFLib koordinat Y dari bawah ke atas
            fontSize: wmObject.fontSize * (wmObject.scaleX || 1),
            angle: -wmObject.angle, // PDFLib rotasi berlawanan arah
            opacity: parseFloat(wmObject.opacity),
            color: hexToRgb(wmObject.fill)
        };

        pages.forEach(page => {
            page.drawText(wmData.text, {
                x: wmData.x - (wmData.fontSize * 2), // Penyesuaian origin
                y: wmData.y,
                size: wmData.fontSize,
                font: font,
                color: PDFLib.rgb(wmData.color.r, wmData.color.g, wmData.color.b),
                opacity: wmData.opacity,
                rotate: PDFLib.degrees(wmData.angle),
            });
        });

        const pdfBytes = await originalPdfDoc.save();
        saveFile(URL.createObjectURL(new Blob([pdfBytes])), "Watermarked_Interactive.pdf");
        alert("Selesai! Watermark diterapkan di semua halaman.");
    } catch (e) {
        console.error(e);
        alert("Gagal menyimpan PDF.");
    } finally {
        btn.innerText = "Download PDF Ber-Watermark";
        btn.disabled = false;
    }
}

// Helper: Konversi HEX ke RGB untuk PDFLib
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
}

// --- QR CODE GENERATOR ---
let qrInstance = null;
function generateQR() {
    const text = document.getElementById('qrText').value;
    const container = document.getElementById('qrcode');
    if (!text) return alert("Masukkan teks atau link!");
    
    container.innerHTML = ""; // Bersihkan QR sebelumnya
    qrInstance = new QRCode(container, {
        text: text,
        width: 128,
        height: 128,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
}

// --- CASE CONVERTER & WORD COUNT ---
function countText() {
    const text = document.getElementById('textContent').value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    document.getElementById('wordCount').innerText = words;
    document.getElementById('charCount').innerText = text.length;
}

function convertCase(type) {
    const area = document.getElementById('textContent');
    if (type === 'upper') area.value = area.value.toUpperCase();
    if (type === 'lower') area.value = area.value.toLowerCase();
    countText();
}

// --- PASSWORD GENERATOR ---
document.getElementById('passLength')?.addEventListener('input', (e) => {
    document.getElementById('lenVal').innerText = e.target.value;
});

function generatePass() {
    const length = document.getElementById('passLength').value;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    document.getElementById('passOutput').value = retVal;
}

function copyPass() {
    const copyText = document.getElementById("passOutput");
    if (!copyText.value) return;
    copyText.select();
    navigator.clipboard.writeText(copyText.value);
    alert("Password berhasil disalin!");
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