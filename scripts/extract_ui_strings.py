import os
from html.parser import HTMLParser

root = r"c:\Users\Muhammad_Azmi\Documents\MARK_Tools"

class UIStringExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.strings = set()

    def handle_starttag(self, tag, attrs):
        self.stack.append(tag)

    def handle_endtag(self, tag):
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()

    def handle_data(self, data):
        if not data or not data.strip():
            return
        tag = self.stack[-1] if self.stack else ''
        if tag in ('button', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'label', 'a', 'span', 'li', 'option'):
            s = data.strip()
            s = ' '.join(s.split())
            if s:
                self.strings.add(s)

    def get_strings(self):
        return self.strings

all_strings = set()
for dirpath, dirnames, filenames in os.walk(root):
    for fname in filenames:
        if not fname.lower().endswith('.html'):
            continue
        path = os.path.join(dirpath, fname)
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            data = f.read()
        parser = UIStringExtractor()
        parser.feed(data)
        all_strings.update(parser.get_strings())

import json

out_path = os.path.join(root, 'scripts', 'ui_strings.json')
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(sorted(all_strings), f, ensure_ascii=False, indent=2)

print('Wrote', len(all_strings), 'strings to', out_path)
