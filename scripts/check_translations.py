import json

path = 'js/translations.js'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()
idx = text.find('const translations =')
if idx == -1:
    raise SystemExit('Could not find translations object in file')
json_part = text[idx + len('const translations ='):].strip().rstrip(';')
obj = json.loads(json_part)

keys_with_nl = [k for k in obj['id'].keys() if '\n' in k]
vals_with_nl = [v for v in obj['id'].values() if '\n' in v]
print('Keys with newline:', len(keys_with_nl))
if keys_with_nl:
    print('Example key with newline:', keys_with_nl[0])
print('Values with newline:', len(vals_with_nl))
if vals_with_nl:
    print('Example value with newline:', vals_with_nl[0])
