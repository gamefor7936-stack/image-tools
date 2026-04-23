import os

path = os.path.join(os.path.dirname(__file__), '..', 'js', 'translations.js')
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

# Find last occurrence of a specific marker
marker = '💡'
idx = data.rfind(marker)
print('marker index:', idx)
if idx != -1:
    start = max(0, idx - 200)
    end = min(len(data), idx + 200)
    snippet = data[start:end]
    print('--- snippet ---')
    print(snippet)
    print('--- end snippet ---')

print('Ends with:', repr(data[-40:]))
