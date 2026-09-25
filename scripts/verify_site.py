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

assert len(list(ROOT.rglob('*.html')))==58
for path in ROOT.rglob('*.html'):
 for tag,attrs in page(path.relative_to(ROOT)):
  for key in ('href','src'):
   target=local_path(attrs.get(key,''))
   if target is not None:assert target.is_file(),f'{path}: missing {attrs[key]}'
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
  tags=page(f'{lang}/{game}/index.html')
  assert any(t=='nav' and a.get('class')=='game-switch' for t,a in tags)
  assert any(t=='img' and a.get('src')==BASE+f'assets/{game}-banner.webp' for t,a in tags)
assert 'value="OL"' not in (ROOT/'fr/acc/ranking.html').read_text()
assert not list((ROOT/'assets').glob('site.js')) and not list((ROOT/'assets').glob('site.css'))
assert (ROOT/'assets/site.min.js').is_file() and (ROOT/'assets/site.min.css').is_file()
print('Verified 58 pages, assets, ACC/ACE entry, flag routes, league switch and minified bundles')
