from pathlib import Path
from html import escape
from os import environ
import re
import shutil
from content import COPY, RANKING_UI, EXTRA, RULES, PENALTIES
R=Path(__file__).parent/'dist'
BASE=environ.get('ATX_BASE_PATH','/atxracing/').rstrip('/')+'/'
CSS=(Path(__file__).parent/'src/site.css').read_text()
CSS=re.sub(r'/\*.*?\*/','',CSS,flags=re.S)
CSS=re.sub(r'\s+',' ',CSS)
CSS=re.sub(r'\s*([{}:;,>])\s*',r'\1',CSS).strip()
(R/'assets/site.min.css').write_text(CSS)
(R/'assets/site.min.js').write_text((Path(__file__).parent/'src/site.js').read_text())
(R/'assets/ranking.min.js').write_text((Path(__file__).parent/'src/ranking.js').read_text())
(R/'assets/circuit-images.min.js').write_text((Path(__file__).parent/'src/circuit-images.js').read_text())
(R/'assets/account.min.js').write_text((Path(__file__).parent/'src/account.js').read_text())
(R/'assets/events.min.js').write_text((Path(__file__).parent/'src/events.js').read_text())
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
 t={**T[lang], **EXTRA[lang]}; v={**COPY[lang], **RANKING_UI[lang], **EXTRA[lang]}; title=t.get(section,t['choose']); root='/' if not game else f'/{lang}/{game}/'
 nav='<nav class="primary-nav" aria-label="Navigation">'+''.join(f'<a href="{root}{sec}.html" '+('aria-current="page"' if section==sec else '')+f'>{t[sec]}</a>' for sec in ['courses','calendar','ranking','records','archives','rules','profile'] if game)+'</nav>'
 switch=f'<nav class="game-switch" aria-label="Jeu / Game"><a href="/{lang}/acc/" '+('aria-current="true"' if game=='acc' else '')+f'>ACC</a><a href="/{lang}/ace/" '+('aria-current="true"' if game=='ace' else '')+'>ACE</a></nav>' if game else ''
 languages='<nav class="header-languages" aria-label="Langue / Language">'+''.join(f'<a href="/{l}/{game}/{"" if section=="league" else section+".html"}" hreflang="{l}" '+('aria-current="page"' if l==lang else '')+f' lang="{l}" aria-label="{escape(language_names[l])}" title="{escape(language_names[l])}"><img src="/assets/flag-{l}.svg" alt=""></a>' for l in T)+'</nav>' if game else ''
 steam=f'<a class="steam-connect" data-steam-link href="https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/auth-steam?return_path={BASE}{lang}/{game}/profile.html" aria-label="Steam"><span class="steam-mark" aria-hidden="true">●</span><span data-steam-label>Steam</span></a>' if game else ''
 head=f'<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#050505"><meta name="atx-base" content="{BASE}"><meta name="description" content="ATXRACING · ACC & ACE"><title>{escape(title)} · ATXRACING</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600;700&amp;family=Inter:wght@400;500;600;700;800&amp;family=Rajdhani:wght@600;700&amp;display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/site.min.css"></head><body data-game="{game}" data-page="{section}"><header class="topbar"><div class="wrap top-inner"><a class="brand" href="/" aria-label="ATXRACING"><img src="/assets/logo.webp" alt="ATXRACING"></a>{switch}{nav}{languages}{steam}</div></header>'
 footer='<footer class="footer"><div class="wrap"><span>© 2026 ATXRACING</span><span><a href="https://discord.com/invite/dgyJJYTSsD">Discord</a> · <a href="https://www.thesimgrid.com/communities/atxracing">SimGrid</a></span></div></footer>'
 if section=='home':
  # The supplied banner itself is the league chooser; keep its ACC and ACE artwork intact.
  body=f'<main class="gateway"><div class="gateway-art"><img src="/assets/banner.webp" alt="ATXRACING · ACC à gauche, ACE à droite" fetchpriority="high"><a class="gateway-link gateway-acc" href="/acc/" aria-label="{escape(t["enter"])} ACC"><span class="sr-only">ACC — {escape(t["acc"])}</span></a><a class="gateway-link gateway-ace" href="/ace/" aria-label="{escape(t["enter"])} ACE"><span class="sr-only">ACE — {escape(t["ace"])}</span></a></div></main>'
 else:
  main='<main class="wrap content">'
  if section=='league':
   main+=f'<section class="league-overview"><div class="overview-copy"><span class="eyebrow">{escape(v["stage"])} / {game.upper()}</span><h1>{escape(v["league_"+game])}</h1><p>{escape(v["lead_"+game])}</p><a class="action" href="/{lang}/{game}/courses.html">{escape(v["discover"])} <span aria-hidden="true">↗</span></a></div><div class="overview-art"><img src="/assets/{game}-banner.webp" alt=""></div></section><div class="section-intro"><span class="eyebrow">{game.upper()} / 01—04</span><h2>{escape(v["section"])}</h2></div><div class="grid feature-grid">'+''.join(f'<a class="panel feature-panel" href="/{lang}/{game}/{s}.html"><span class="meta">0{i} / {game.upper()}</span><h3>{escape(t[s])} <span aria-hidden="true">↗</span></h3><p>{escape(v["courses_lead" if s=="courses" else s+"_lead"])}</p></a>' for i,s in enumerate(['courses','ranking','records','profile'],1))+'</div>'
  else:
   main+=f'<section class="page-masthead"><div class="masthead-copy"><span class="eyebrow">{game.upper()} / {escape(v["stage"])}</span><h1>{escape(t[section])}</h1><p>{escape(v[section+"_lead"])}</p></div><div class="masthead-art"><img src="/assets/{game}-banner.webp" alt=""></div></section>'
   if section=='profile':main+='<section id="account-app" class="account-app" aria-live="polite"></section>'
   if game=='ace': main+=f'<section class="status-panel"><span class="eyebrow">ACE / {escape(v["published"])}</span><h2>{escape(v["league_ace"])}</h2><p>{escape(v["ace_pending"])}</p><a class="pill" href="/{lang}/acc/">{escape(v["back_acc"])} ↗</a></section>'
   else:
    if section=='courses':
     main+=f'<div class="section-intro"><span class="eyebrow">01 / {escape(v["formats"])}</span><h2>{escape(v["formats"])}</h2></div><div class="format-grid">'+''.join(f'<a class="format-card" href="/{lang}/{game}/calendar.html?type={"DR" if name=="Daily Race" else "BA" if name=="Ballade ATX" else "WGT"}"><span class="meta">0{i} / ACC</span><h3>{escape(name)} ↗</h3><p>{escape(description)}</p></a>' for i,(name,description) in enumerate(v['formats_items'],1))+'</div>'
     main+=f'<div class="section-intro"><span class="eyebrow">02 / {escape(v["schedule"])}</span><h2>{escape(v["next"])}</h2></div>'
    if section=='ranking':
     main+=f'<div class="section-intro"><span class="eyebrow">01 / {escape(v["source"])}</span><h2>{escape(v["standings"])}</h2></div>'
     main+='<div id="ranking-app" aria-live="polite"><nav class="ranking-views" aria-label="'+escape(v['standings'])+'">'+''.join(f'<button type="button" data-view="{key}">{escape(label)}</button>' for key,label in [('points',v['points_view']),('circuit',v['circuit_view']),('driver',v['driver_view']),('team',v['team_view'])])+'</nav><div id="ranking-content"><p class="loading">…</p></div></div>'
    if section=='records': main+=f'<div class="section-intro"><span class="eyebrow">01 / {escape(v["source"])}</span><h2>{escape(v["fastest"])}</h2></div><div id="circuit-grid" class="record-circuits" aria-label="{escape(v["track"])}"></div><div id="record-spotlight" class="record-spotlight" aria-live="polite"></div>'
    if section=='calendar':main+='<nav class="event-categories" aria-label="'+escape(v['calendar'])+'">'+''.join(f'<button type="button" data-category="{code}">{escape(label)}</button>' for code,label in [('ALL',v['calendar']),('WGT','WorldGT'),('DR','Daily Race'),('BA','Ballade ATX')])+'</nav>'
    if section=='rules':main+='<div class="rules-collection">'+''.join(f'<article class="rule-card"><span class="meta">{str(i).zfill(2)} / ACC</span><h2>{escape(name)}</h2><p>{escape(description)}</p></article>' for i,(name,description) in enumerate(RULES[lang],1))+'</div>'
    if section=='rules':
     penalties=PENALTIES[lang]
     main+=f'<section class="penalty-section"><h2>{escape(penalties["title"])}</h2><div class="ranking-table-wrap"><table class="ranking-table"><thead><tr>'+''.join(f'<th>{escape(h)}</th>' for h in penalties['headers'])+'</tr></thead><tbody>'+''.join('<tr>'+''.join(f'<td>{escape(cell)}</td>' for cell in row)+'</tr>' for row in penalties['rows'])+'</tbody></table></div></section>'
    if section=='profile':main+=f'<div id="public-directory"><div class="section-intro"><span class="eyebrow">01 / {escape(v["profile_public"])}</span><h2>{escape(v["drivers"])}</h2></div><div id="driver-directory" class="driver-directory"><label for="driver-search">{escape(v["search"])}</label><input id="driver-search" type="search" placeholder="{escape(v["search_hint"])}" autocomplete="off"></div></div>'
    if section not in ('ranking','rules'):main+='<div id="results" aria-live="polite"><p class="loading">…</p></div>'
  main+=f'<p class="return-link"><a href="/{lang}/">← {escape(t["back"])}</a></p></main>'
  body=main
 out=(head if section!='home' else head.split('<header class="topbar">')[0])+body+(footer if section!='home' else '')+('<script src="/assets/circuit-images.min.js" defer></script>' if section=='records' and game=='acc' else '')+('<script src="/assets/site.min.js" defer></script>' if game=='acc' and section in ('courses','records','profile') else '')+('<script src="/assets/ranking.min.js" defer></script>' if section=='ranking' and game=='acc' else '')+('<script src="/assets/events.min.js" defer></script>' if game=='acc' and section in ('calendar','archives','event') else '')+('<script src="/assets/account.min.js" defer></script>' if game else '')+'</body></html>'
 path=R/lang/(game or '')/('index.html' if section in ('home','league') else section+'.html');write(path,out)
for l in T:
 page(l,'','home')
 for g in ('acc','ace'):
  for s in ('league','courses','calendar','ranking','records','archives','event','rules','profile'):page(l,g,s)
(R/'index.html').write_text((R/'fr/index.html').read_text())
for g in ('acc','ace'):selector(g)

# GitHub Pages for this repository is configured to publish main / (root).
# Mirror only generated public files there; sources and docs remain in place.
for generated in R.rglob('*'):
 if generated.is_file():
  target=Path(__file__).parent/generated.relative_to(R)
  target.parent.mkdir(parents=True,exist_ok=True)
  shutil.copy2(generated,target)
