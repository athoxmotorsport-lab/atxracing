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

assert len(list(ROOT.rglob('*.html')))==65
for path in ROOT.rglob('*.html'):
 for tag,attrs in page(path.relative_to(ROOT)):
  for key in ('href','src'):
   target=local_path(attrs.get(key,''))
   if target is not None:assert target.is_file(),f'{path}: missing {attrs[key]}'
for generated in ROOT.rglob('*'):
 if generated.is_file():
  mirrored=ROOT.parent/generated.relative_to(ROOT)
  assert mirrored.is_file() and mirrored.read_bytes()==generated.read_bytes(),f'missing or stale Pages root file: {mirrored}'
entry=page('index.html')
assert not any(t in ('header','footer') for t,_ in entry)
assert not any(t=='img' and 'logo' in a.get('src','') for t,a in entry)
assert not any(t=='a' and 'gateway-link' in a.get('class','') for t,a in entry)
assert any(t=='a' and 'auth-steam' in a.get('href','') for t,a in entry)
assert any(t=='script' and a.get('src')==BASE+'assets/entry.min.js' for t,a in entry)
for path,lang in (('fr/index.html','fr'),('en/index.html','en')):
 tags=page(path)
 assert any(t=='header' for t,_ in tags) and any(t=='footer' for t,_ in tags)
 assert len([1 for t,a in tags if t=='nav' and a.get('class')=='header-languages'])==1
 assert len([1 for t,a in tags if t=='nav' and a.get('class')=='side-dock'])==1
 assert [a['href'] for t,a in tags if t=='a' and 'gateway-link' in a.get('class','')]==[BASE+f'{lang}/acc/',BASE+f'{lang}/about.html',BASE+f'{lang}/ace/']
 assert any(t=='img' and a.get('src')==BASE+'assets/landing-banner.jpg' for t,a in tags)
for game in ('acc','ace'):
 tags=page(f'{game}/index.html')
 assert not any(t in ('header','footer') for t,_ in tags)
 assert [a['href'] for t,a in tags if t=='a']==[BASE+f'fr/{game}/']
 assert any(t=='meta' and a.get('http-equiv')=='refresh' and BASE+f'fr/{game}/' in a.get('content','') for t,a in tags)
for lang in ('fr','en'):
 about=page(f'{lang}/about.html')
 assert any(t=='h1' for t,_ in about)
 assert len([1 for t,a in about if t=='nav' and a.get('class')=='header-languages'])==1
 assert [a['href'] for t,a in about if t=='a' and a.get('hreflang') in ('fr','en')]==[BASE+f'{language}/about.html' for language in ('fr','en')]*2
 for game in ('acc','ace'):
  for section in ('index.html','courses.html','worldgt.html','daily-race.html','ballade.html','calendar.html','ranking.html','records.html','archives.html','event.html','course.html','rules.html','privacy.html','profile.html'):
   tags=page(f'{lang}/{game}/{section}')
   assert any(t=='nav' and a.get('class')=='game-switch' for t,a in tags)
   assert any(t=='nav' and a.get('class')=='side-dock' for t,a in tags)
   assert any(t=='img' and a.get('src')==BASE+f'assets/{game}-banner.webp' for t,a in tags)
   assert len([1 for t,a in tags if t=='nav' and a.get('class')=='header-languages'])==1
   assert len([1 for t,a in tags if t=='nav' and a.get('class')=='footer-languages'])==1
   assert [a['href'] for t,a in tags if t=='a' and a.get('hreflang') in ('fr','en')]==[BASE+f'{language}/{game}/{"" if section=="index.html" else section}' for language in ('fr','en')]*2
   assert not any(t=='div' and a.get('class')=='wrap languages' for t,a in tags)
css=(ROOT/'assets/site.min.css').read_text()
assert "url('site-background.jpg')" in css and 'position:fixed' in css
for image in ('site-background.jpg','landing-banner.jpg'):
 assert (ROOT/'assets'/image).is_file()
assert '.league-overview{height:480px;' in css
assert 'font-family:Rajdhani' in css
assert 'value="OL"' not in (ROOT/'fr/acc/ranking.html').read_text()
assert not list((ROOT/'assets').glob('site.js')) and not list((ROOT/'assets').glob('site.css'))
assert (ROOT/'assets/site.min.js').is_file() and (ROOT/'assets/site.min.css').is_file()
assert (ROOT/'assets/ranking.min.js').is_file()
for asset in ('account.min.js','events.min.js','circuit-images.min.js'):
 assert (ROOT/'assets'/asset).is_file()
assert (ROOT/'assets/admin.min.js').is_file()
assert (ROOT/'assets/entry.min.js').is_file() and (ROOT/'assets/gate.min.js').is_file()
for language in ('fr','en'):
 ranking=(ROOT/language/'acc/ranking.html').read_text()
 assert all(f'data-view="{view}"' in ranking for view in ('points','circuit','driver','team'))
 assert BASE+'assets/ranking.min.js' in ranking
 assert BASE+'assets/site.min.js' not in ranking
 records=(ROOT/language/'acc/records.html').read_text()
 assert 'id="circuit-grid"' in records and BASE+'assets/circuit-images.min.js' in records
 profile=(ROOT/language/'acc/profile.html').read_text()
 assert 'id="account-app"' in profile and BASE+'assets/account.min.js' in profile
 admin=(ROOT/language/'acc/admin.html').read_text()
 assert 'id="admin-app"' in admin and BASE+'assets/admin.min.js' in admin
 for section in ('calendar','archives','event','course'):
  assert BASE+'assets/events.min.js' in (ROOT/language/'acc'/f'{section}.html').read_text()
 for section in ('worldgt','daily-race','ballade'):
  assert BASE+'assets/events.min.js' in (ROOT/language/'acc'/f'{section}.html').read_text()
for language in ('de','es','it'):
 assert not (ROOT/language).exists(), 'Only FR and EN should be published'
print('Verified 65 pages, logo-free Steam entrance, side dock, fixed artwork, FR/EN pages, ACC profile and race administration')
