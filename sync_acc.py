"""Mirror the production ACC site without rebuilding its pages or styles.

The checked-in legacy-acc snapshot is copied verbatim except for the Steam
return address and the five-language bridge required by the multi-game site.
This step never reads or writes the ACE section.
"""
from pathlib import Path
import re
import shutil
import json
from acc_translations import WORDS, LOCALES, translate_html

ROOT = Path(__file__).parent
SOURCE = ROOT / 'legacy-acc'
TARGET = ROOT / 'dist'
LANGUAGES = ('fr', 'en', 'de', 'it', 'es')
ALIASES = {
    'ranking.html': 'classement.html',
    'calendar.html': 'calendrier.html',
    'profile.html': 'profil-pilote.html',
    'rules.html': 'reglement.html',
    'privacy.html': 'confidentialite.html',
    'worldgt.html': 'gtworld.html',
    'ballade.html': 'open-lobby.html',
    'event.html': 'course.html',
    'courses.html': 'index.html',
}
SHARED = sorted(p for p in SOURCE.iterdir() if p.suffix in ('.css', '.js'))
ASSETS = (SOURCE / 'assets', SOURCE / 'events')


def adapt_html(original: str, lang: str, nested: bool = False) -> str:
    # The legacy page structure and its production CSS and JS references stay
    # intact. Steam may return only to a path explicitly allowed by the API.
    result = original.replace(
        'href="https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/auth-steam"',
        f'href="https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/auth-steam?return_path=/atxracing/{lang}/acc/profile.html"',
    )
    # Editorial correction requested for the championship. WGT stays the
    # scoring code and the data-course-page/API category is not changed.
    result = result.replace(
        '<h1>ATXRACING - WGT - <strong>Saison 1</strong></h1>',
        '<h1>WorldGT <strong>— Saison 1</strong></h1>',
    )
    result = re.sub(r'<html lang="(?:fr|en)">', f'<html lang="{lang}">', result, count=1)
    result = translate_html(result,lang)
    prefix = '../' if nested else ''
    result = result.replace('</head>', f'<link rel="stylesheet" href="{prefix}acc-language-bridge.css"></head>', 1)
    translations = f'<script src="{prefix}acc-translations.js" defer></script>' if lang in LOCALES else ''
    bridge = translations + f'<script src="{prefix}acc-language-bridge.js" defer data-atx-language="{lang}"></script>'
    return result.replace('</body>', bridge + '</body>', 1)


def sync():
    for lang in LANGUAGES:
        dest = TARGET / lang / 'acc'
        for path in SHARED:
            shutil.copy2(path, dest / path.name)
        shutil.copy2(ROOT / 'src/acc-language-bridge.js', dest / 'acc-language-bridge.js')
        shutil.copy2(ROOT / 'src/acc-language-bridge.css', dest / 'acc-language-bridge.css')
        if lang in LOCALES:
            dictionary={key:values[LOCALES[lang]] for key,values in WORDS.items()}
            (dest / 'acc-translations.js').write_text('window.ATX_ACC_I18N='+json.dumps(dictionary,ensure_ascii=False)+';\n')
        for folder in ASSETS:
            shutil.copytree(folder, dest / folder.name, dirs_exist_ok=True)
        for flag in ('de', 'it', 'es'):
            shutil.copy2(ROOT / 'assets' / f'flag-{flag}.svg', dest / 'assets' / 'ui' / f'flag-{flag}.svg')
        for original in SOURCE.glob('*.html'):
            if original.name.startswith('google'):
                continue
            (dest / original.name).write_text(adapt_html(original.read_text(), lang))
        for original in (SOURCE / 'events').glob('*.html'):
            (dest / 'events' / original.name).write_text(adapt_html(original.read_text(), lang, nested=True))
        for alias, original in ALIASES.items():
            (dest / alias).write_text(adapt_html((SOURCE / original).read_text(), lang))
        # The original circuit records are the 'Classement par circuit' tab,
        # not a separate records page. Keep the old URL as a direct link there.
        (dest / 'records.html').write_text(
            f'<!doctype html><html lang="{lang}"><meta charset="utf-8">'
            f'<meta http-equiv="refresh" content="0;url=classement.html#circuit">'
            f'<title>Classement par circuit · ATX Racing</title>'
            f'<a href="classement.html#circuit">Classement par circuit</a></html>'
        )


if __name__ == '__main__':
    sync()
