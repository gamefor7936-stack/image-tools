import os

path = os.path.join(os.path.dirname(__file__), '..', 'js', 'translations.js')
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

marker = '💡'
idx = data.rfind(marker)
if idx == -1:
    raise SystemExit('marker not found')
start = max(0, idx - 200)
end = min(len(data), idx + 200)
snippet = data[start:end]
print('--- repr snippet ---')
print(repr(snippet))
print('--- end repr snippet ---')
