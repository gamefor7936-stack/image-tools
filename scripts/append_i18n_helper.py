import os

root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
path = os.path.join(root, 'js', 'translations.js')

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'window.i18n' in content or 'translatePage' in content:
    print('Helper code already present; no changes made.')
    raise SystemExit(0)

helper = """

(function () {
    const STORAGE_KEY = 'MARK_TOOLS_LANG';
    const supportedLangs = Object.keys(translations);
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    const storedLang = localStorage.getItem(STORAGE_KEY);
    const defaultLang = document.documentElement.lang || 'id';
    let currentLang = urlLang || storedLang || defaultLang;

    if (!supportedLangs.includes(currentLang)) {
        currentLang = defaultLang;
    }

    function translateText(text, lang = currentLang) {
        if (!text || typeof text !== 'string') return text;
        const trimmed = text.trim();
        const map = translations[lang] || {};
        const translated = map[trimmed];
        if (translated && translated !== trimmed) {
            // preserve leading/trailing whitespace
            return text.replace(trimmed, translated);
        }
        return text;
    }

    function translateAttrs(el, lang) {
        ['placeholder', 'title', 'aria-label', 'alt', 'value'].forEach(attr => {
            if (el.hasAttribute && el.hasAttribute(attr)) {
                const original = el.getAttribute(attr);
                const translated = translateText(original, lang);
                if (translated !== original) {
                    el.setAttribute(attr, translated);
                }
            }
        });
    }

    function walkTextNodes(node, callback) {
        const walker = document.createTreeWalker(
            node,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (n) => {
                    const txt = n.nodeValue.trim();
                    if (!txt) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );
        let current = walker.nextNode();
        while (current) {
            callback(current);
            current = walker.nextNode();
        }
    }

    function translatePage(lang = currentLang) {
        if (!supportedLangs.includes(lang)) lang = defaultLang;
        currentLang = lang;
        localStorage.setItem(STORAGE_KEY, lang);
        document.documentElement.lang = lang;

        walkTextNodes(document.body, (textNode) => {
            textNode.nodeValue = translateText(textNode.nodeValue, lang);
        });

        const allEls = document.querySelectorAll('input,textarea,button,select,option,[title],[aria-label],[alt]');
        allEls.forEach(el => translateAttrs(el, lang));
    }

    function setLanguage(lang) {
        translatePage(lang);
    }

    document.addEventListener('DOMContentLoaded', () => {
        translatePage(currentLang);
    });

    window.i18n = {
        setLanguage,
        translate: translateText,
        translatePage,
        getLanguage: () => currentLang,
        supportedLangs,
    };
})();
"""

# Append helper only if file ends with '};' (closing the object)
if not content.rstrip().endswith('};'):
    print('Unexpected file ending; not appending helper code.')
    raise SystemExit(1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content.rstrip() + helper)

print('Appended i18n helper code to translations.js')
