import os

path = os.path.join(os.path.dirname(__file__), '..', 'js', 'translations.js')
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()
print('len', len(data))
lines = data.splitlines()
print('Total lines:', len(lines))
print('--- last 60 lines ---')
for line in lines[-60:]:
    print(line)
