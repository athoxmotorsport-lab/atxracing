from pathlib import Path
from html import escape
from os import environ
import re
import shutil
R=Path(__file__).parent/'dist'
BASE=environ.get('ATX_BASE_PATH','/atxracing/').rstrip('/')+'/'
CSS=(Path(__file__).parent/'src/site.css').read_text()
CSS=re.sub(r'/\*.*?\*/','',CSS,flags=re.S)
CSS=re.sub(r'\s+',' ',CSS)
CSS=re.sub(r'\s*([{}:;,>])\s*',r'\1',CSS).strip()
(R/'assets/site.min.css').write_text(CSS)
(R/'assets/site.min.js').write_text((Path(__file__).parent/'src/site.js').read_text())
def write(path,html):
 path.parent.mkdir(parents=True,exist_ok=True)
 path.write_text(html.replace('href="/','href="'+BASE).replace('src="/','src="'+BASE))
T={
'fr':dict(select='Choisissez votre ligue',acc='Compétitions GT3 sur Assetto Corsa Competizione',ace='La nouvelle scène Assetto Corsa EVO',enter='Découvrir la ligue',courses='Courses',ranking='Classements',records='Meilleurs temps',profile='Profil pilote',welcome='Deux jeux. Une communauté.',choose='Choisir une ligue',acc_intro='Retrouvez les courses programmées, les résultats et les pilotes de la ligue ACC.',ace_intro='L’espace ACE se prépare. Les courses et classements apparaîtront dès que les données ACE seront publiées.',events_desc='Les prochaines courses de la ligue.',ranking_desc='Points et performances des pilotes, par catégorie.',records_desc='Les meilleurs tours valides, classés par circuit et par voiture.',profile_desc='Le profil public complet des pilotes : statistiques et résultats.',soon='Les données ACE seront affichées après la mise en place du collecteur et de la base de données dédiés.',back='Toutes les ligues',category='Catégorie',circuit='Circuit',legacy='Site ACC actuel'),
'en':dict(select='Choose your league',acc='GT3 racing on Assetto Corsa Competizione',ace='The new Assetto Corsa EVO racing scene',enter='Explore the league',courses='Races',ranking='Standings',records='Best laps',profile='Driver profile',welcome='Two games. One community.',choose='Choose a league',acc_intro='Explore scheduled races, results and drivers in the ACC league.',ace_intro='The ACE space is being prepared. Races and standings will appear when ACE data is published.',events_desc='Upcoming league races.',ranking_desc='Driver points and performance by category.',records_desc='Fastest valid laps by track and car.',profile_desc='Public driver profiles with statistics and results.',soon='ACE data will appear after the dedicated collector and database are ready.',back='All leagues',category='Category',circuit='Track',legacy='Current ACC site'),
'de':dict(select='Wähle deine Liga',acc='GT3-Rennen in Assetto Corsa Competizione',ace='Die neue Rennszene für Assetto Corsa EVO',enter='Liga entdecken',courses='Rennen',ranking='Wertungen',records='Bestzeiten',profile='Fahrerprofil',welcome='Zwei Spiele. Eine Community.',choose='Liga wählen',acc_intro='Entdecke geplante Rennen, Ergebnisse und Fahrer der ACC-Liga.',ace_intro='Der ACE-Bereich wird vorbereitet. Rennen und Wertungen erscheinen, sobald ACE-Daten vorliegen.',events_desc='Die nächsten Rennen der Liga.',ranking_desc='Fahrerpunkte und Leistung nach Kategorie.',records_desc='Schnellste gültige Runden nach Strecke und Fahrzeug.',profile_desc='Öffentliche Fahrerprofile mit Statistiken und Ergebnissen.',soon='ACE-Daten erscheinen, sobald Collector und Datenbank eingerichtet sind.',back='Alle Ligen',category='Kategorie',circuit='Strecke',legacy='Bisherige ACC-Seite'),
'it':dict(select='Scegli la tua lega',acc='Gare GT3 su Assetto Corsa Competizione',ace='La nuova scena di Assetto Corsa EVO',enter='Scopri la lega',courses='Gare',ranking='Classifiche',records='Giri migliori',profile='Profilo pilota',welcome='Due giochi. Una comunità.',choose='Scegli una lega',acc_intro='Scopri le gare in programma, i risultati e i piloti della lega ACC.',ace_intro='Lo spazio ACE è in preparazione. Gare e classifiche appariranno quando i dati ACE saranno pubblicati.',events_desc='Le prossime gare della lega.',ranking_desc='Punti e prestazioni dei piloti per categoria.',records_desc='I migliori giri validi per circuito e auto.',profile_desc='Profili pubblici dei piloti con statistiche e risultati.',soon='I dati ACE appariranno quando collector e database dedicati saranno pronti.',back='Tutte le leghe',category='Categoria',circuit='Circuito',legacy='Sito ACC attuale'),
'es':dict(select='Elige tu liga',acc='Carreras GT3 en Assetto Corsa Competizione',ace='La nueva escena de Assetto Corsa EVO',enter='Explorar la liga',courses='Carreras',ranking='Clasificaciones',records='Mejores vueltas',profile='Perfil de piloto',welcome='Dos juegos. Una comunidad.',choose='Elegir liga',acc_intro='Consulta las próximas carreras, los resultados y los pilotos de la liga ACC.',ace_intro='El espacio ACE está en preparación. Las carreras y clasificaciones aparecerán cuando se publiquen datos de ACE.',events_desc='Las próximas carreras de la liga.',ranking_desc='Puntos y rendimiento de pilotos por categoría.',records_desc='Las vueltas válidas más rápidas por circuito y coche.',profile_desc='Perfiles públicos de pilotos con estadísticas y resultados.',soon='Los datos de ACE aparecerán cuando el collector y la base de datos estén listos.',back='Todas las ligas',category='Categoría',circuit='Circuito',legacy='Sitio ACC actual')}
language_names={'fr':'Français','en':'English','de':'Deutsch','it':'Italiano','es':'Español'}
def selector(game):
 image='Competizione' if game=='acc' else 'EVO'
 choices=''.join(f'<a href="/{lang}/{game}/" hreflang="{lang}" lang="{lang}" aria-label="{escape(name)}"><img src="/assets/flag-{lang}.svg" alt=""><span class="sr-only">{escape(name)}</span></a>' for lang,name in language_names.items())
 out=f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#08090c"><title>{game.upper()} · ATXRACING</title><link rel="stylesheet" href="/assets/site.min.css"></head><body data-page="selector"><main class="selection"><img class="selection-image" src="/assets/{game}-banner.webp" alt="Assetto Corsa {image}"><nav class="flag-choices" aria-label="Choisir une langue / Choose a language">{choices}</nav></main></body></html>'
 write(R/game/'index.html',out)
def page(lang,game,section):
 t=T[lang]; title=t.get(section,t['choose']); root='/' if not game else f'/{lang}/{game}/'
 nav='<nav class="primary-nav" aria-label="Navigation">'+''.join(f'<a href="{root}{sec}.html" '+('aria-current="page"' if section==sec else '')+f'>{t[sec]}</a>' for sec in ['courses','ranking','records','profile'] if game)+'</nav>'
 switch=f'<nav class="game-switch" aria-label="Jeu / Game"><a href="/{lang}/acc/" '+('aria-current="true"' if game=='acc' else '')+f'>ACC</a><a href="/{lang}/ace/" '+('aria-current="true"' if game=='ace' else '')+'>ACE</a></nav>' if game else ''
 head=f'<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#08090c"><meta name="atx-base" content="{BASE}"><meta name="description" content="ATXRACING · ACC & ACE"><title>{escape(title)} · ATXRACING</title><link rel="stylesheet" href="/assets/site.min.css"></head><body data-game="{game}" data-page="{section}"><header class="topbar"><div class="wrap top-inner"><a class="brand" href="/" aria-label="ATXRACING"><img src="/assets/logo.webp" alt="ATXRACING"></a>{switch}{nav}</div></header>'
 footer='<footer class="footer"><div class="wrap"><span>© 2026 ATXRACING</span><span><a href="https://discord.com/invite/dgyJJYTSsD">Discord</a> · <a href="https://www.thesimgrid.com/communities/atxracing">SimGrid</a></span></div></footer>'
 if section=='home':
  # The supplied banner itself is the league chooser; keep its ACC and ACE artwork intact.
  body=f'<main class="gateway"><div class="gateway-art"><img src="/assets/banner.webp" alt="ATXRACING · ACC à gauche, ACE à droite" fetchpriority="high"><a class="gateway-link gateway-acc" href="/acc/" aria-label="{escape(t["enter"])} ACC"><span class="sr-only">ACC — {escape(t["acc"])}</span></a><a class="gateway-link gateway-ace" href="/ace/" aria-label="{escape(t["enter"])} ACE"><span class="sr-only">ACE — {escape(t["ace"])}</span></a></div></main>'
 else:
  banner=f'<div class="league-image"><img src="/assets/{game}-banner.webp" alt="Assetto Corsa {"Competizione" if game=="acc" else "EVO"}"></div>'
  languages='<div class="wrap languages" aria-label="Language">'+''.join(f'<a href="/{l}/{game}/{"" if section=="league" else section+".html"}" hreflang="{l}" '+('aria-current="true"' if l==lang else '')+f' lang="{l}" title="{escape(language_names[l])}"><img src="/assets/flag-{l}.svg" alt=""><span class="sr-only">{escape(language_names[l])}</span></a>' for l in T)+'</div>'
  sub='<nav class="subnav" aria-label="League">'+''.join(f'<a href="/{lang}/{game}/{s}.html" '+('aria-current="page"' if s==section else '')+f'>{escape(t[s])}</a>' for s in ['courses','ranking','records','profile'])+'</nav>'
  main=f'<main class="wrap content">{sub}'
  if section=='league':
   main+=f'<section class="league-overview"><div class="overview-copy"><span class="eyebrow">{game.upper()} · ATXRACING</span><h1>{escape(t[game+"_intro"])}</h1><p>{escape(t["events_desc"])} {escape(t["ranking_desc"])}</p><a class="action" href="/{lang}/{game}/courses.html">{escape(t["courses"])} <span aria-hidden="true">↗</span></a></div><div class="overview-art"><img src="/assets/{game}-banner.webp" alt=""></div></section><div class="section-intro"><span class="eyebrow">{game.upper()}</span><h2>{escape(t["choose"])}</h2></div><div class="grid">'+''.join(f'<a class="panel" href="/{lang}/{game}/{s}.html"><span class="meta">0{i}</span><h3>{escape(t[s])} <span aria-hidden="true">↗</span></h3><p>{escape(t["events_desc" if s=="courses" else s+"_desc"])}</p></a>' for i,s in enumerate(['courses','ranking','records','profile'],1))+'</div>'
  else:
   main+=f'<span class="eyebrow">{game.upper()} · ATXRACING</span><h2>{escape(t[section])}</h2><p class="intro">{escape(t["events_desc" if section=="courses" else section+"_desc"])}</p>'
   if game=='ace': main+=f'<p class="empty">{escape(t["soon"])}</p>'
   else:
    if section=='ranking':main+=f'<div class="controls"><label>{escape(t["category"])} <select id="category"><option value="DR">Daily Race</option><option value="WGT">World GT</option><option value="BA">Ballade ATX</option></select></label></div>'
    if section=='records':main+=f'<div class="controls"><label>{escape(t["circuit"])} <select id="circuit"></select></label></div>'
    main+='<div id="results" aria-live="polite"><p class="loading">…</p></div>'
    if section=='profile':main+=f'<p><a class="pill" href="https://athoxmotorsport-lab.github.io/atx-racing/profil-pilote.html">{escape(t["legacy"])} →</a></p>'
  main+=f'<p style="margin-top:36px"><a href="/{lang}/">← {escape(t["back"])}</a></p></main>'
  body=languages+main if section=='league' else banner+languages+main
 out=(head if section!='home' else head.split('<header class="topbar">')[0])+body+(footer if section!='home' else '')+('<script src="/assets/site.min.js" defer></script>' if game and section not in ('league','home') else '')+'</body></html>'
 path=R/lang/(game or '')/('index.html' if section in ('home','league') else section+'.html');write(path,out)
for l in T:
 page(l,'','home')
 for g in ('acc','ace'):
  for s in ('league','courses','ranking','records','profile'):page(l,g,s)
(R/'index.html').write_text((R/'fr/index.html').read_text())
for g in ('acc','ace'):selector(g)

# GitHub Pages for this repository is configured to publish main / (root).
# Mirror only generated public files there; sources and docs remain in place.
for generated in R.rglob('*'):
 if generated.is_file():
  target=Path(__file__).parent/generated.relative_to(R)
  target.parent.mkdir(parents=True,exist_ok=True)
  shutil.copy2(generated,target)
