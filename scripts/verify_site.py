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

assert len(list(ROOT.rglob('*.html')))==98
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
 for game in ('acc','ace'):
  for section in ('index.html','courses.html','calendar.html','ranking.html','records.html','archives.html','event.html','rules.html','profile.html'):
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
for language in ('fr','en','de','it','es'):
 ranking=(ROOT/language/'acc/ranking.html').read_text()
 assert all(f'data-view="{view}"' in ranking for view in ('points','circuit','driver','team'))
 assert BASE+'assets/ranking.min.js' in ranking
 assert BASE+'assets/site.min.js' not in ranking
 records=(ROOT/language/'acc/records.html').read_text()
 assert 'id="circuit-grid"' in records and BASE+'assets/circuit-images.min.js' in records
 profile=(ROOT/language/'acc/profile.html').read_text()
 assert 'id="account-app"' in profile and BASE+'assets/account.min.js' in profile
 for section in ('calendar','archives','event'):
  assert BASE+'assets/events.min.js' in (ROOT/language/'acc'/f'{section}.html').read_text()
print('Verified 98 pages, assets, root mirror, language routes, ACC records, calendar, archives, event and Steam profile')
