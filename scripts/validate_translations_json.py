import os, json, re

path = os.path.join(os.path.dirname(__file__), '..', 'js', 'translations.js')
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('const translations =')
if idx == -1:
    raise SystemExit('Could not find translations object')
json_text = text[idx+len('const translations ='):].strip().rstrip(';')
try:
    obj = json.loads(json_text)
    print('JSON loaded, languages:', list(obj.keys()) if isinstance(obj, dict) else '???')
    # find any keys containing newline
    keys_nl = [k for k in obj.get('id', {}) if '\n' in k]
    print('Keys with newline:', len(keys_nl))
    if keys_nl:
        print(keys_nl[:5])
except json.JSONDecodeError as e:
    print('JSON decode error:', e)
    # show around error position
    pos = e.pos
    print('Error around:', json_text[max(0,pos-40):pos+40])
