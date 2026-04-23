import os, re, json
from html.parser import HTMLParser

# Root folder of the project
root = r"c:\Users\Muhammad_Azmi\Documents\MARK_Tools"

# Collect visible text nodes from all HTML files
texts = set()

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self._skip = False
        self._buf = []
    def handle_starttag(self, tag, attrs):
        if tag in ('script','style'):
            self._skip = True
    def handle_endtag(self, tag):
        if tag in ('script','style'):
            self._skip = False
    def handle_data(self, data):
        if self._skip:
            return
        txt = data.strip()
        if not txt:
            return
        # Normalize whitespace (collapse newlines/tabs/spaces into a single space)
        txt = re.sub(r"\s+", " ", txt)
        if re.match(r'^[\s\d\W]+$', txt):
            return
        self._buf.append(txt)
    def get_texts(self):
        return self._buf

for dirpath, dirnames, filenames in os.walk(root):
    for fname in filenames:
        if fname.lower().endswith('.html'):
            path = os.path.join(dirpath, fname)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                data = f.read()
            parser = TextExtractor()
            parser.feed(data)
            for t in parser.get_texts():
                texts.add(t)

# base translation keys (existing translation.js values)
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

base_en = {
    "nav_home": "Home",
    "nav_privacy": "Privacy",
    "hero_title": "All-in-One File Solutions in <br><span>One Place</span>",
    "hero_subtitle": "Free, fast, and 100% secure. Data is processed in your browser.",
    "search_placeholder": "Search tools...",
    "btn_convert": "Convert Now",
    "history_title": "Recent History",
    "footer_rights": "All Rights Reserved."
}

# Start from base translations (these are explicit keys not found in HTML)
trans_id = dict(base_id)
trans_en = dict(base_en)

# Add every extracted text as a key in both languages (value same as key)
for t in sorted(texts):
    if t not in trans_id:
        trans_id[t] = t
    if t not in trans_en:
        trans_en[t] = t

output = {
    "id": trans_id,
    "en": trans_en,
}

out_path = os.path.join(root, 'js', 'translations.js')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write("// js/translations.js\n")
    f.write("const translations = ")
    json.dump(output, f, ensure_ascii=False, indent=4)
    f.write(";\n")

print(f"Wrote translations.js with {len(trans_id)} id keys and {len(trans_en)} en keys")
