"""Verify the generated static portal and its critical visitor paths."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
from hashlib import sha256
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

race_pages=list(ROOT.glob('*/acc/races/*.html'))
assert len(list(ROOT.rglob('*.html')))==91+len(race_pages)
for path in ROOT.rglob('*.html'):
 for tag,attrs in page(path.relative_to(ROOT)):
  for key in ('href','src'):
   target=local_path(attrs.get(key,''))
   if target is not None:
    assert target.is_file(),f'{path}: missing {attrs[key]}'
    if target.parent==ROOT/'assets' and target.suffix in ('.js','.css'):
     assert parse_qs(urlsplit(attrs[key]).query).get('v')==[sha256(target.read_bytes()).hexdigest()[:12]],f'{path}: stale asset revision {attrs[key]}'
for generated in ROOT.rglob('*'):
 if generated.is_file():
  mirrored=ROOT.parent/generated.relative_to(ROOT)
  assert mirrored.is_file() and mirrored.read_bytes()==generated.read_bytes(),f'missing or stale Pages root file: {mirrored}'
entry=page('index.html')
assert not any(t in ('header','footer') for t,_ in entry)
assert not any(t=='img' and 'logo' in a.get('src','') for t,a in entry)
assert not any(t=='a' and 'gateway-link' in a.get('class','') for t,a in entry)
assert any(t=='a' and f'return_path={BASE}fr/acc/profile.html' in a.get('href','') for t,a in entry)
assert any(t=='script' and urlsplit(a.get('src','')).path==BASE+'assets/entry.min.js' for t,a in entry)
assert not any(t=='script' and urlsplit(a.get('src','')).path==BASE+'assets/community.min.js' for t,a in entry)
for path,lang in (('fr/index.html','fr'),('en/index.html','en')):
 tags=page(path)
 assert any(t=='header' for t,_ in tags) and any(t=='footer' for t,_ in tags)
 assert len([1 for t,a in tags if t=='nav' and a.get('class')=='header-languages'])==1
 assert len([1 for t,a in tags if t=='nav' and a.get('class')=='side-dock'])==1
 assert [a['href'] for t,a in tags if t=='a' and a.get('class')=='paddock-game']==[BASE+f'{lang}/acc/',BASE+f'{lang}/ace/']
 assert [a['src'] for t,a in tags if t=='img' and a.get('src','').endswith('-banner.webp')]==[BASE+'assets/acc-banner.webp',BASE+'assets/ace-banner.webp']
 assert any(t=='strong' and 'data-driver-name' in a for t,a in tags)
for game in ('acc','ace'):
 tags=page(f'{game}/index.html')
 assert not any(t in ('header','footer') for t,_ in tags)
 assert [a['href'] for t,a in tags if t=='a']==[BASE+f'fr/{game}/']
 assert any(t=='meta' and a.get('http-equiv')=='refresh' and BASE+f'fr/{game}/' in a.get('content','') for t,a in tags)
for lang in ('fr','en'):
 about=page(f'{lang}/about.html')
 assert any(t=='h1' for t,_ in about)
 assert any(t=='script' and urlsplit(a.get('src','')).path==BASE+'assets/community.min.js' for t,a in about)
 assert len([1 for t,a in about if t=='nav' and a.get('class')=='header-languages'])==1
 assert [a['href'] for t,a in about if t=='a' and a.get('hreflang') in ('fr','en')]==[BASE+f'{language}/about.html' for language in ('fr','en')]*2
 profile=page(f'{lang}/acc/profile.html')
 pilots=page(f'{lang}/acc/pilots.html')
 assert not any(a.get('id')=='driver-search' for _,a in profile)
 assert any(a.get('id')=='driver-search' for _,a in pilots)
 for game in ('acc','ace'):
  for section in ('index.html','courses.html','worldgt.html','worldgt-sprint.html','worldgt-endurance.html','daily-race.html','atx-series.html','calendar.html','ranking.html','records.html','circuits.html','live.html','archives.html','event.html','course.html','rules.html','privacy.html','profile.html','messages.html'):
   tags=page(f'{lang}/{game}/{section}')
   assert any(t=='nav' and a.get('class')=='game-switch' for t,a in tags)
   assert any(t=='nav' and a.get('class')=='side-dock' for t,a in tags)
   assert any(t=='img' and a.get('src')==BASE+f'assets/{game}-banner.webp' for t,a in tags)
   assert len([1 for t,a in tags if t=='nav' and a.get('class')=='header-languages'])==1
   assert len([1 for t,a in tags if t=='nav' and a.get('class')=='footer-languages'])==1
   assert any(t=='script' and urlsplit(a.get('src','')).path==BASE+'assets/community.min.js' for t,a in tags)
   assert [a['href'] for t,a in tags if t=='a' and a.get('hreflang') in ('fr','en')]==[BASE+f'{language}/{game}/{"" if section=="index.html" else section}' for language in ('fr','en')]*2
   assert not any(t=='div' and a.get('class')=='wrap languages' for t,a in tags)
css=(ROOT/'assets/site.min.css').read_text()
assert "url('site-background.webp')" in css and 'position:fixed' in css
for image in ('site-background.webp','landing-banner.jpg','driver-levels-cutout.png'):
 assert (ROOT/'assets'/image).is_file()
for image in ('circuits/red-bull-ring.jpg','events/monza-2026-09-09.jpg','events/nurburgring-gp-2026-09-11.webp','events/barcelona-2026-09-13.jpg','events/kyalami-2026-09-20.jpg'):
 assert (ROOT/'assets'/image).is_file()
assert '.league-overview{height:480px;' in css
assert 'font-family:Rajdhani' in css
assert 'value="OL"' not in (ROOT/'fr/acc/ranking.html').read_text()
assert not list((ROOT/'assets').glob('site.js')) and not list((ROOT/'assets').glob('site.css'))
assert (ROOT/'assets/site.min.js').is_file() and (ROOT/'assets/site.min.css').is_file()
assert (ROOT/'assets/ranking.min.js').is_file()
for asset in ('account.min.js','insignia.min.js','events.min.js','circuit-images.min.js','community.min.js','messages.min.js'):
 assert (ROOT/'assets'/asset).is_file()
assert (ROOT/'assets/admin.min.js').is_file()
assert (ROOT/'assets/entry.min.js').is_file() and (ROOT/'assets/gate.min.js').is_file()
assert (ROOT/'sitemap.xml').is_file() and (ROOT/'robots.txt').is_file()
assert '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' in (ROOT/'sitemap.xml').read_text()
for language in ('fr','en'):
 ranking=(ROOT/language/'acc/ranking.html').read_text()
 assert all(f'data-view="{view}"' in ranking for view in ('points','team'))
 assert all(f'data-view="{view}"' not in ranking for view in ('circuit','driver'))
 assert BASE+'assets/ranking.min.js' in ranking
 assert BASE+'assets/site.min.js' not in ranking
 records=(ROOT/language/'acc/records.html').read_text()
 assert 'id="circuit-grid"' in records and BASE+'assets/circuit-images.min.js' in records
 profile=(ROOT/language/'acc/profile.html').read_text()
 assert 'id="account-app"' in profile and BASE+'assets/account.min.js' in profile
 assert BASE+'assets/insignia.min.js' in profile
 for game in ('acc','ace'):
  messages=(ROOT/language/game/'messages.html').read_text()
  assert 'id="messages-app"' in messages and BASE+'assets/messages.min.js' in messages
 admin=(ROOT/language/'acc/admin.html').read_text()
 assert 'id="admin-app"' in admin and BASE+'assets/admin.min.js' in admin
 for section in ('calendar','archives','event','course'):
  assert BASE+'assets/events.min.js' in (ROOT/language/'acc'/f'{section}.html').read_text()
  html=(ROOT/language/'acc'/f'{section}.html').read_text()
  assert html.index(BASE+'assets/circuit-images.min.js')<html.index(BASE+'assets/events.min.js')
 for section in ('worldgt','worldgt-sprint','worldgt-endurance','daily-race','atx-series'):
  assert BASE+'assets/events.min.js' in (ROOT/language/'acc'/f'{section}.html').read_text()
for language in ('de','es','it'):
 assert not (ROOT/language).exists(), 'Only FR and EN should be published'
print(f'Verified {91+len(race_pages)} pages, Steam onboarding, bilingual entrance, signed-in paddock, SEO files, fixed artwork and FR/EN pages')

for path in race_pages:
 tags=page(str(path.relative_to(ROOT)))
 assert any(t=='script' and a.get('type')=='application/ld+json' for t,a in tags)
 assert any('data-prerendered' in a for t,a in tags)
 assert any(t=='link' and a.get('rel')=='canonical' and '/races/' in a.get('href','') for t,a in tags)
 assert path.stem+'.html' in (ROOT/'sitemap.xml').read_text()
assert not any(t in ['header','footer'] for t,a in page('index.html'))
assert all('share-atxracing-v2.jpg' in (ROOT/p).read_text() for p in ['index.html','fr/acc/courses.html','en/acc/courses.html'])
