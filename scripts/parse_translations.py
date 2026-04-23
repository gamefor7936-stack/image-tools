import json, os, re

path = os.path.join(os.path.dirname(__file__), '..', 'js', 'translations.js')
text = open(path, 'r', encoding='utf-8', errors='replace').read()

start = text.find('const translations =')
if start == -1:
    raise SystemExit('no translations declaration')
json_text = text[start + len('const translations ='):].strip()
# Find end of JSON object (before helper code starts)
# Look for the pattern that starts the helper immediately after the object.
split_marker = '\n\n(function'  # likely starts the helper IIFE
idx = json_text.find(split_marker)
if idx != -1:
    json_part = json_text[:idx].rstrip()
else:
    # Fallback: find first occurrence of '\n(function' or '\n(function'
    idx = json_text.find('\n(function')
    if idx != -1:
        json_part = json_text[:idx].rstrip()
    else:
        # Last resort: take up to last occurrence of '};' and hope that's the end
        end = json_text.rfind('};')
        if end == -1:
            raise SystemExit('no end marker')
        json_part = json_text[:end+2].rstrip()

# Ensure we remove any trailing semicolon so JSON can parse
if json_part.endswith(';'):
    json_part = json_part[:-1].rstrip()

# Parse JSON
obj = json.loads(json_part)
print('loaded languages:', list(obj.keys()))
for lang in obj:
    print(f"{lang}: {len(obj[lang])} entries")

# Compare against extracted UI strings
ui_path = os.path.join(os.path.dirname(__file__), 'ui_strings.json')
if os.path.exists(ui_path):
    ui_strings = set(json.load(open(ui_path, 'r', encoding='utf-8')))
    missing = sorted([s for s in ui_strings if s not in obj.get('id', {})])
    print('Missing strings from translations:', len(missing))
    if missing:
        print('Examples:', missing[:10])
else:
    print('ui_strings.json not found, cannot compare')
