"""Static bilingual EVO catalogue; independent from ACC racing data and registrations."""
import json
from pathlib import Path
from html import escape

CATALOGUE=Path(__file__).parent/'data/evo-catalogue.json'
def render(lang,view):
 data=json.loads(CATALOGUE.read_text())
 fr=lang=='fr'
 source='<a href="'+escape(data['source_url'])+'" target="_blank" rel="noopener noreferrer">'+('Catalogue officiel' if fr else 'Official catalogue')+' ↗</a>'
 note=('Le catalogue officiel peut évoluer. Le contenu de la version du jeu utilisée sera vérifié avant l’ouverture des inscriptions.' if fr else 'The official catalogue may change. Content in the game version used will be checked before registration opens.')
 intro=f'<section class="evo-catalogue"><div class="section-intro"><span class="eyebrow">ASSETTO CORSA EVO / {len(data[view])}</span><h2>{("Voitures" if fr else "Cars") if view=="cars" else "Circuits"}</h2></div><p class="profile-note">{note} {source}</p>'
 intro+=f'<a class="pill" href="/{lang}/ace/{"circuits" if view=="cars" else "courses"}.html">{("Voir les circuits" if fr else "View circuits") if view=="cars" else ("Voir les voitures" if fr else "View cars")} ↗</a>'
 if view=='cars':
  intro+='<p class="profile-note">'+('Voitures blanches sans livrée · illustrations des modèles.' if fr else 'White cars without liveries · model illustrations.')+'</p>'
  for category,title in [('road','Routières' if fr else 'Road cars'),('racing','Course' if fr else 'Race cars')]:
   intro+=f'<h3>{title}</h3><div class="evo-car-grid">'
   for car in data['cars']:
    if car['category']!=category:continue
    thumbnail=car['image'].replace('evo/cars/','evo/cars/thumbs/').replace('gt3/','gt3/thumbs/')
    intro+=f'<article class="evo-car-card"><img src="/assets/{escape(thumbnail)}" alt="{escape(car["name"])}" width="360" height="200" loading="lazy" decoding="async"><h4>{escape(car["name"])}</h4></article>'
   intro+='</div>'
 else:
  intro+='<div class="evo-circuit-grid">'
  for track in data['circuits']:
   colors=track['colors'];gradient=f'linear-gradient(135deg,{colors[0]} 0 33%,{colors[1]} 33% 66%,{colors[2]} 66% 100%)'
   intro+=f'<article class="evo-circuit-card"><img class="circuit-country-frame" style="--country-frame:{gradient}" src="/assets/{escape(track["image"])}" alt="{escape(track["name"])}" width="640" height="360" loading="lazy" decoding="async"><div><span class="meta">{escape(track["country"])}</span><h3>{escape(track["name"])}</h3>'
   if track['layouts']:intro+='<p>'+escape(' · '.join(track['layouts']))+'</p>'
   if track['artwork_kind']=='generated-location-illustration':intro+='<small>'+('Illustration du lieu' if fr else 'Location illustration')+'</small>'
   intro+='</div></article>'
  intro+='</div>'
 return intro+'</section>'
