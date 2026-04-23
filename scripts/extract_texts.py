import os, re
from html.parser import HTMLParser

root = r"c:\Users\Muhammad_Azmi\Documents\MARK_Tools"
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

print(f"Found {len(texts)} unique text nodes")
for t in sorted(texts):
    print(t)
