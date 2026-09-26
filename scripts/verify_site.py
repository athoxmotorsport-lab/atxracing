"""Verify the generated static portal and its critical visitor paths."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import os
import sys

ROOT=Path(__file__).resolve().parents[1]/'dist'
BASE=os.environ.get('ATX_BASE_PATH','/atxracing/').rstrip('/')+'/'
class Page(HTMLParser):
 def __init__(self): super().__init__(); self.tags=[]
 def handle_starttag(self,tag,attrs): self.tags.append((tag,dict(attrs)))
def page(path):
 p=Page();p.feed((ROOT/path).read_text());return p.tags

def local_path(url):
 parsed=urlsplit(url)
 if parsed.scheme or parsed.netloc or not parsed.path.startswith(BASE):return None
 candidate=ROOT/parsed.path[len(BASE):]
 if candidate.is_dir():candidate=candidate/'index.html'
 return candidate

assert len(list(ROOT.rglob('*.html')))==198
for path in ROOT.rglob('*.html'):
 for tag,attrs in page(path.relative_to(ROOT)):
  for key in ('href','src'):
   target=local_path(attrs.get(key,''))
   if target is not None:assert target.is_file(),f'{path}: missing {attrs[key]}'
for generated in ROOT.rglob('*'):
 if generated.is_file():
  mirrored=ROOT.parent/generated.relative_to(ROOT)
  assert mirrored.is_file() and mirrored.read_bytes()==generated.read_bytes(),f'missing or stale Pages root file: {mirrored}'
for path in ('index.html','fr/index.html'):
 tags=page(path)
 assert not any(t in ('header','footer') for t,_ in tags)
 assert [a['href'] for t,a in tags if t=='a']==[BASE+'acc/',BASE+'ace/']
 assert [a['src'] for t,a in tags if t=='img']==[BASE+'assets/banner.webp']
for game in ('acc','ace'):
 tags=page(f'{game}/index.html')
 assert not any(t in ('header','footer') for t,_ in tags)
 assert [a['src'] for t,a in tags if t=='img'][0]==BASE+f'assets/{game}-banner.webp'
 assert [a['href'] for t,a in tags if t=='a']==[BASE+f'{lang}/{game}/' for lang in ('fr','en','de','it','es')]
 assert [a['src'] for t,a in tags if t=='img'][1:]==[BASE+f'assets/flag-{lang}.svg' for lang in ('fr','en','de','it','es')]
for lang in ('fr','en','de','it','es'):
 for game in ('ace',):
  for section in ('index.html','courses.html','worldgt.html','daily-race.html','ballade.html','calendar.html','ranking.html','records.html','archives.html','event.html','course.html','rules.html','privacy.html','profile.html'):
   tags=page(f'{lang}/{game}/{section}')
   assert any(t=='nav' and a.get('class')=='game-switch' for t,a in tags)
   assert any(t=='img' and a.get('src')==BASE+f'assets/{game}-banner.webp' for t,a in tags)
   assert len([1 for t,a in tags if t=='nav' and a.get('class')=='header-languages'])==1
   assert [a['href'] for t,a in tags if t=='a' and a.get('hreflang') in ('fr','en','de','it','es')]==[BASE+f'{language}/{game}/{"" if section=="index.html" else section}' for language in ('fr','en','de','it','es')]
   assert not any(t=='div' and a.get('class')=='wrap languages' for t,a in tags)
css=(ROOT/'assets/site.min.css').read_text()
assert '.league-overview{height:480px;' in css
assert 'font-family:Rajdhani' in css
assert 'value="OL"' not in (ROOT/'fr/acc/ranking.html').read_text()
assert not list((ROOT/'assets').glob('site.js')) and not list((ROOT/'assets').glob('site.css'))
assert (ROOT/'assets/site.min.js').is_file() and (ROOT/'assets/site.min.css').is_file()
assert (ROOT/'assets/ranking.min.js').is_file()
for asset in ('account.min.js','events.min.js','circuit-images.min.js'):
 assert (ROOT/'assets'/asset).is_file()
legacy=ROOT.parent/'legacy-acc'
sys.path.insert(0,str(ROOT.parent))
from sync_acc import adapt_html
from acc_translations import WORDS, LOCALES
expected={'index.html','classement.html','calendrier.html','course.html','profil-pilote.html','reglement.html','gtworld.html','daily-race.html','open-lobby.html','archives.html','confidentialite.html','event-admin.html'}
for language in ('fr','en','de','it','es'):
 acc=ROOT/language/'acc'
 if language in LOCALES:
  assert (acc/'acc-translations.js').is_file()
  assert len(WORDS)>150
  for filename,needle in {
   'gtworld.html':('WorldGT <strong>— ', 'data-course-page="WGT"'),
   'reglement.html':(WORDS['Règlement sportif.'][LOCALES[language]],),
   'confidentialite.html':(WORDS['6. Conservation et sécurité'][LOCALES[language]],),
   'classement.html':(WORDS['Classement des pilotes'][LOCALES[language]],),
  }.items():
   markup=(acc/filename).read_text()
   assert all(value in markup for value in needle), f'{language}/{filename}: missing localized content'
 for name in expected:
  src=(legacy/name).read_text();dst=(acc/name).read_text()
  assert dst==adapt_html(src,language),f'ACC page differs from production beyond game and language integration: {language}/{name}'
  assert '<script src="acc-language-bridge.js" defer' in dst, name
  assert 'atx-home.min.css' in dst if name=='index.html' else 'atx-core.min.css' in dst
  for cls in ('side-nav','side-links'):
   assert f'class="{cls}"' in src and f'class="{cls}"' in dst
  original=Page();original.feed(src)
  copied=Page();copied.feed(dst)
  assert len([1 for tag,_ in copied.tags if tag=='main'])==len([1 for tag,_ in original.tags if tag=='main'])
 for page_name,selectors in {
  'classement.html':('data-ranking-panel="circuit"','data-ranking-panel="driver"','data-circuit-ranking-body','data-driver-circuit-grid'),
  'course.html':('data-event-overview','data-event-settings','data-event-honours','data-event-results'),
  'profil-pilote.html':('data-profile-form','data-profile-best-laps','data-profile-results'),
 }.items():
  markup=(acc/page_name).read_text()
  assert all(selector in markup for selector in selectors)
 for css in ('atx-home.min.css','atx-core.min.css','atx-clean-editorial.css','ranking-session-labels.min.css','driver-ranking-premium.min.css','team-ranking-premium.min.css','profile-best-laps.min.css'):
  assert (acc/css).read_bytes()==(legacy/css).read_bytes()
 for js in ('main.min.js','premium-shell.min.js','home-experience.min.js','atx-experience.min.js','ranking-session-labels.min.js','driver-ranking-premium.min.js','team-ranking-premium.min.js','profile-identity-enhancements.min.js'):
  assert (acc/js).read_bytes()==(legacy/js).read_bytes()
 for asset in (legacy/'assets').rglob('*'):
  if asset.is_file():assert (acc/'assets'/asset.relative_to(legacy/'assets')).read_bytes()==asset.read_bytes()
 for event in (legacy/'events').glob('*.html'):
  assert (acc/'events'/event.name).read_text()==adapt_html(event.read_text(),language,nested=True)
print('Verified 198 pages, original ACC HTML structure, production CSS/JS bytes, rankings, profile and game selectors')
