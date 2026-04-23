import json

path = 'scripts/ui_strings.json'
with open(path, 'r', encoding='utf-8') as f:
    strings = json.load(f)

for i, s in enumerate(strings, 1):
    print(f"{i:03d}", s)
