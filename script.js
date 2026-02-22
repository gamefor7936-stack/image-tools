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
    if (input.files.length === 0) return alert("Pilih file PDF!");

    btn.innerText = "Memproses...";
    btn.disabled = true;

    try {
        const file = input.files[0];
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();
        
        const zip = new JSZip(); // Buat file ZIP baru

        for (let i = 0; i < pageCount; i++) {
            const newPdf = await PDFLib.PDFDocument.create();
            const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
            newPdf.addPage(copiedPage);
            const pdfBytes = await newPdf.save();
            
            // Masukkan tiap halaman ke dalam ZIP
            zip.file(`halaman_${i + 1}.pdf`, pdfBytes);
        }

        // Generate file ZIP dan download
        const zipContent = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipContent);
        saveFile(url, `Hasil_Split_${file.name}.zip`);
        
        alert("Selesai! Semua halaman ada di dalam file ZIP.");
    } catch (error) {
        alert("Gagal memecah PDF.");
    } finally {
        btn.innerText = "Pecah PDF";
        btn.disabled = false;
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