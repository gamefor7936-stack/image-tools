import pathlib
path = pathlib.Path('js/translations.js')
text = path.read_text('utf-8')
print('start:', repr(text[:120]))
print('contains const translations =', 'const translations =' in text)
print('index', text.find('const translations ='))
