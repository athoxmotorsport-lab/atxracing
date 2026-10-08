"""Generate crawlable race pages from a reviewed public metadata snapshot."""
import json,re
from html import escape
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo

def render_events(output,events,base,site_url):
 urls=[]
 valid_slugs={event.get('slug','') for event in events}
 for old in output.glob('*/acc/races/*.html'):
  if old.stem not in valid_slugs and 'data-event-slug="'+old.stem+'"' in old.read_text():
   mirror=output.parent/old.relative_to(output)
   if mirror.exists() and 'data-event-slug="'+old.stem+'"' in mirror.read_text():mirror.unlink()
   old.unlink()
 for event in events:
  slug=event.get('slug','')
  if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',slug):raise ValueError('Invalid public event slug')
  for lang in ('fr','en'):
   template=(output/lang/'acc/course.html').read_text()
   title=event.get('title_'+lang) or event['title_fr'];description=event.get('description_'+lang) or event.get('description_fr') or title
   url=site_url+lang+'/acc/races/'+slug+'.html';route=base+lang+'/acc/races/'+slug+'.html'
   template=re.sub(r'<title>.*?</title>',lambda _: '<title>'+escape(title)+' · ATXRACING</title>',template)
   for key in ('canonical','og:url'):
    pattern=r'(<link rel="canonical" href=")[^"]+' if key=='canonical' else r'(<meta property="og:url" content=")[^"]+'
    template=re.sub(pattern,lambda m:m[1]+escape(url,quote=True),template)
   for key in ('description','og:description','og:title'):
    attr='name' if key=='description' else 'property';value=title if key=='og:title' else description[:300]
    template=re.sub(r'(<meta '+attr+'="'+key+r'" content=")[^"]+',lambda m:m[1]+escape(value,quote=True),template)
   template=template.replace('data-page="course"','data-page="course" data-event-slug="'+slug+'"')
   for language in ('fr','en'):template=template.replace(base+language+'/acc/course.html',base+language+'/acc/races/'+slug+'.html')
   stamp=datetime.fromisoformat(event['starts_at'].replace('Z','+00:00')).astimezone(ZoneInfo('Europe/Brussels')).strftime('%d/%m/%Y · %H:%M')
   content='<article class="official-race"><span class="eyebrow">'+escape(event.get('competition_code') or 'Daily Race')+'</span><h2>'+escape(title)+'</h2><p>'+escape(event.get('circuit_name') or '')+' · '+stamp+' · '+str(event.get('duration_minutes') or '')+' min</p><p>'+escape(description)+'</p>'
   image=event.get('image_url') or ''
   if re.fullmatch(r'/assets/(events|circuits)/[a-zA-Z0-9-]+\.(jpg|jpeg|webp|png)',image):image=base+image.removeprefix('/')
   if image.startswith('https://') or image.startswith(base+'assets/'):content+='<img class="race-poster" src="'+escape(image,quote=True)+'" alt="'+escape(event.get('circuit_name') or title,quote=True)+'" loading="lazy">'
   content+='<div class="race-quick-facts">'
   for label,value in [('Circuit',event.get('circuit_name')),('Course' if lang=='fr' else 'Race',str(event.get('duration_minutes') or '—')+' min'),('Voitures' if lang=='fr' else 'Cars',event.get('car_class') or 'GT3')]:content+='<div class="race-quick-fact"><small>'+label+'</small><strong>'+escape(str(value or '—'))+'</strong></div>'
   content+='</div><p><a class="pill" href="'+base+lang+'/acc/rules.html">'+('Règlement et briefing' if lang=='fr' else 'Rules and briefing')+'</a></p></article>'
   template=template.replace('<div id="results" aria-live="polite"><p class="loading">…</p></div>','<div id="results" data-prerendered aria-live="polite">'+content+'</div>')
   structured={'@context':'https://schema.org','@type':'SportsEvent','name':title,'description':description,'startDate':event['starts_at'],'url':url,'eventAttendanceMode':'https://schema.org/OnlineEventAttendanceMode','location':{'@type':'VirtualLocation','url':url},'organizer':{'@type':'Organization','name':'ATX Racing','url':site_url},'sport':'Sim racing'}
   template=template.replace('</head>','<script type="application/ld+json">'+json.dumps(structured,ensure_ascii=False).replace('<','\\u003c')+'</script></head>')
   target=output/lang/'acc/races'/f'{slug}.html';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(template);urls.append(url)
 return urls
