import os

root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
script_path = os.path.join(root, 'js', 'translations.js')

for dirpath, dirnames, filenames in os.walk(root):
    for fname in filenames:
        if not fname.lower().endswith('.html'):
            continue
        html_path = os.path.join(dirpath, fname)
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Skip if already includes translations.js
        if 'translations.js' in content:
            continue

        # Determine relative path from HTML file to translations.js
        rel_path = os.path.relpath(script_path, start=dirpath).replace('\\', '/')
        tag = f'<script src="{rel_path}"></script>'

        if '</head>' not in content:
            print('SKIP (no </head>):', html_path)
            continue

        # Insert just before </head>
        content = content.replace('</head>', f'    {tag}\n</head>')

        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print('Updated', html_path)
