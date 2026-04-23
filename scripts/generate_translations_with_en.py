import os, json, re

root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ui_path = os.path.join(root, 'scripts', 'ui_strings.json')

with open(ui_path, 'r', encoding='utf-8') as f:
    strings = json.load(f)

# Base keys that may not be in extracted strings but should exist in translations
base_id = {
    "nav_home": "Beranda",
    "nav_privacy": "Privasi",
    "hero_title": "Semua Alat File dalam <br><span>Satu Tempat</span>",
    "hero_subtitle": "Gratis, cepat, dan 100% aman. Data diproses di browser Anda.",
    "search_placeholder": "Cari alat...",
    "btn_convert": "Konversi Sekarang",
    "history_title": "Histori Pembuatan Terbaru",
    "footer_rights": "Semua Hak Dilindungi."
}

# Combine strings (unique)
all_strings = list(dict.fromkeys(list(base_id.values()) + strings))

# Manual overrides for specific Indonesian phrases / phrases needing exact translation
manual_translations = {
    "Beranda": "Home",
    "Privasi": "Privacy",
    "Semua Alat File dalam <br><span>Satu Tempat</span>": "All-in-One File Solutions in <br><span>One Place</span>",
    "Gratis, cepat, dan 100% aman. Data diproses di browser Anda.": "Free, fast, and 100% secure. Data is processed in your browser.",
    "Cari alat...": "Search tools...",
    "Konversi Sekarang": "Convert Now",
    "Histori Pembuatan Terbaru": "Recent History",
    "Semua Hak Dilindungi.": "All Rights Reserved.",
    "Bisa berkali-kali": "Can be done multiple times",
    "Buat": "Create",
    "Buat Password Aman": "Create a Secure Password",
    "Buat QR code dengan berbagai opsi styling dan data.": "Create a QR code with various styling and data options.",
    "Buat invoice profesional dengan mudah.": "Create a professional invoice easily.",
    "Berbeda dengan layanan konverter online lainnya, MARK_Tools memproses semua file (PDF, Gambar, Teks) langsung di browser Anda menggunakan JavaScript. Kami tidak mengunggah file Anda ke server mana pun. File Anda tetap berada di perangkat Anda selama proses berlangsung.": "Unlike other online converters, MARK_Tools processes all files (PDF, Images, Text) directly in your browser using JavaScript. We never upload your files to any server. Your files stay on your device throughout the process.",
    "Dapatkan password acak aman dan simpan dengan aman.": "Get a secure random password and store it safely.",
    "Ganti": "Replace",
    "Ganti format gambar (jpg, png, webp, dll) langsung di browser.": "Change image format (jpg, png, webp, etc.) directly in the browser.",
    "Gratis, cepat, dan 100% aman. Kami tidak pernah melihat file Anda karena semua diproses di browser Anda sendiri.": "Free, fast, and 100% secure. We never see your files because everything is processed in your browser.",
    "Gunakan Mode OCR (Pro)": "Use OCR Mode (Pro)",
    "Hapus Metadata & Simpan": "Remove Metadata & Save",
    "Hapus metadata foto (Lokasi GPS, Tipe HP, dll) demi keamanan.": "Remove photo metadata (GPS location, device type, etc.) for security.",
    "Hapus metadata seperti tanggal, lokasi, dan perangkat dari foto.": "Remove metadata such as date, location, and device from photos.",
    "Histori Pembuatan Terbaru": "Recent Creation History",
    "Histori Resizer Terbaru": "Recent Resizer History",
    "Histori Sesi Ini": "This Session History",
    "Kembali": "Back",
    "Kenapa Memilih MARK_Tools?": "Why Choose MARK_Tools?",
    "Klik untuk pilih satu atau banyak sekaligus": "Click to select one or multiple at once",
    "Klik untuk tambah file PDF": "Click to add a PDF file",
    "Kompres & Download": "Compress & Download",
    "Konversi & Download (": "Convert & Download (",
    "Konversi Sekarang": "Convert Now",
    "Konversi ke Gambar": "Convert to Image",
    "Konversi teks ke Base64 dan sebaliknya.": "Convert text to Base64 and back.",
    "Kualitas (Makin kecil makin ringan):": "Quality (Smaller = lighter):",
    "Kualitas Tinggi": "High Quality",
    "Mark_Tools mengikuti prosedur standar menggunakan file log. Informasi yang dikumpulkan termasuk alamat IP, jenis browser, ISP, stempel waktu, dan halaman rujukan. Informasi ini tidak terkait dengan informasi apa pun yang dapat diidentifikasi secara pribadi.": "MARK_Tools follows standard log file procedures. Information collected includes IP address, browser type, ISP, timestamps, and referral pages. This information is not linked to any personally identifiable information.",
    "Mengekstrak Halaman...": "Extracting Pages...",
    "Metode Pemecahan:": "Split Method:",
    "Mulai Pecah PDF": "Start Splitting PDF",
    "Nikmati semua fitur profesional tanpa biaya pendaftaran atau langganan.": "Enjoy all professional features with no sign-up or subscription fees.",
    "Pecah PDF menjadi beberapa file sekaligus.": "Split PDF into multiple files at once.",
    "Pecah Setiap Halaman (1 Halaman per PDF)": "Split Every Page (1 Page per PDF)",
    "Pemrosesan Sisi Klien (Client-Side)": "Client-Side Processing",
    "Pengaturan Dokumen": "Document Settings",
    "Pengaturan Logo": "Logo Settings",
    "Perkecil ukuran gambar tanpa mengorbankan kualitas secara drastis.": "Reduce image size without drastically sacrificing quality.",
    "Pilih PDF untuk melihat preview": "Select a PDF to preview",
    "Pilih atau Seret PDF": "Select or Drag PDF",
    "Pisahkan halaman PDF menjadi file terpisah atau ekstrak rentang tertentu.": "Separate PDF pages into individual files or extract a specific range.",
    "Proses & Download Semua (ZIP)": "Process & Download All (ZIP)",
    "Proses instan tanpa antrean server. Secepat kecepatan komputer Anda.": "Instant processing without server queuing. As fast as your computer.",
    "Satukan beberapa gambar menjadi satu file PDF dalam hitungan detik.": "Combine multiple images into a single PDF in seconds.",
    "Simplify or make it good to read.": "Simplify or make it good to read.",
    "Syarat & Ketentuan": "Terms & Conditions",
    "TAMBAH ITEM BARU": "ADD NEW ITEM",
    "Tambah Gambar": "Add Image",
    "Tambahkan Logo (Opsional):": "Add Logo (Optional):",
    "Tambahkan file satu per satu atau sekaligus.": "Add files one at a time or all at once.",
    "Tambahkan teks atau logo sebagai watermark pada dokumen PDF Anda.": "Add text or logo as a watermark to your PDF document.",
    "Tunggu beberapa detik, unduhan akan dimulai otomatis.": "Please wait a few seconds, the download will start automatically.",
    "Ubah 1 Foto ke berbagai ukuran Medsos (Auto-Crop)": "Change 1 Photo to various social media sizes (Auto-Crop)",
    "Ubah Semua Ke:": "Convert All To:",
    "Ubah dokumen PDF Anda menjadi format Microsoft Word (.doc) yang dapat diedit sepenuhnya dengan teknologi OCR.": "Convert your PDF document into a fully editable Microsoft Word (.doc) file using OCR technology.",
    "Ubah huruf dan hitung kata dengan mudah.": "Change case and count words easily.",
    "Ubah satu halaman PDF menjadi gambar berkualitas di browser.": "Convert a single PDF page into a high-quality image in the browser.",
    "Ubah setiap halaman PDF menjadi file gambar terpisah.": "Convert each PDF page into separate image files.",
    "Unduh thumbnail video YouTube secara cepat dan mudah.": "Download YouTube video thumbnails quickly and easily.",
    "Wajib untuk PDF Hasil Scan / Gambar": "Required for Scanned PDF / Image",
    "⚡ Tanpa Menunggu": "⚡ No Waiting",
    "💡 Geser, putar, atau perbesar teks langsung di area preview sebelah kanan.": "💡 Drag, rotate, or zoom text directly in the preview area on the right.",
    "💸 100% Gratis": "💸 100% Free",
    "🔒 Keamanan Total": "🔒 Total Security",
}

# word-level dictionary for minimal translation
word_map = {
    'dan': 'and',
    'atau': 'or',
    'dengan': 'with',
    'yang': 'that',
    'ini': 'this',
    'ke': 'to',
    'di': 'in',
    'untuk': 'for',
    'semua': 'all',
    'file': 'files',
    'kami': 'we',
    'tidak': 'not',
    'setiap': 'every',
    'halaman': 'page',
    'akan': 'will',
    'dalam': 'in',
    'sebuah': 'a',
    'satu': 'one',
    'lainnya': 'other',
    'langsung': 'directly',
    'diunggah': 'uploaded',
    'server': 'server',
    'Anda': 'you',
    'ini': 'this',
    'atau': 'or',
    'ditambahkan': 'added',
    'sebagai': 'as',
    'atau': 'or',
    'lebih': 'more',
    'kecil': 'small',
    'besar': 'large',
    'sangat': 'very',
    'berbagai': 'various',
    'satu': 'one',
    'unduh': 'download',
    'dengan': 'with',
    'agar': 'so',
    'bisa': 'can',
    'sudah': 'already',
    'gratis': 'free',
    'cepat': 'fast',
    'secar': 'as',
    'dapat': 'can',
}

# simple translation function
word_pattern = re.compile(r"\b(\w+)\b", flags=re.UNICODE)


def translate_text(txt):
    if txt in manual_translations:
        return manual_translations[txt]

    def repl(m):
        w = m.group(1)
        low = w.lower()
        if low in word_map:
            trans = word_map[low]
            return trans.capitalize() if w[0].isupper() else trans
        return w

    return word_pattern.sub(repl, txt)

trans_id = {s: s for s in all_strings}
trans_en = {s: translate_text(s) for s in all_strings}

output = {
    'id': {k: v for k, v in trans_id.items()},
    'en': {k: v for k, v in trans_en.items()},
}

out_path = os.path.join(root, 'js', 'translations.js')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('// js/translations.js\n')
    f.write('const translations = ')
    json.dump(output, f, ensure_ascii=False, indent=4)
    f.write(';\n')

print('Generated translations.js with', len(all_strings), 'entries')
