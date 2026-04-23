import os, json

root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

ui_path = os.path.join(root, 'scripts', 'ui_strings.json')
with open(ui_path, 'r', encoding='utf-8') as f:
    strings = json.load(f)

# Create base translation maps
trans_id = {s: s for s in strings}
trans_en = {s: s for s in strings}

output = {
    'id': trans_id,
    'en': trans_en,
}

out_path = os.path.join(root, 'js', 'translations.js')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('// js/translations.js\n')
    json.dump(output, f, ensure_ascii=False, indent=4)
    f.write('\n')

print('Generated translations.js with', len(strings), 'entries')
