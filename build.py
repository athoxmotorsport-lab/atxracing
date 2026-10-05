from pathlib import Path
from html import escape
from os import environ
import re
import shutil
from content import COPY, RANKING_UI, EXTRA, RULES, PENALTIES, FORMATS, PRIVACY
R=Path(__file__).parent/'dist'
BASE=environ.get('ATX_BASE_PATH','/atxracing/').rstrip('/')+'/'
for image in ('site-background.jpg','landing-banner.jpg','driver-levels-cutout.png'):
 shutil.copy2(Path(__file__).parent/'media'/image,R/'assets'/image)
CSS=(Path(__file__).parent/'src/site.css').read_text()
CSS=re.sub(r'/\*.*?\*/','',CSS,flags=re.S)
CSS=re.sub(r'\s+',' ',CSS)
CSS=re.sub(r'\s*([{}:;,>])\s*',r'\1',CSS).strip()
(R/'assets/site.min.css').write_text(CSS)
(R/'assets/site.min.js').write_text((Path(__file__).parent/'src/site.js').read_text())
(R/'assets/ranking.min.js').write_text((Path(__file__).parent/'src/ranking.js').read_text())
(R/'assets/circuit-images.min.js').write_text((Path(__file__).parent/'src/circuit-images.js').read_text())
(R/'assets/account.min.js').write_text((Path(__file__).parent/'src/account.js').read_text())
(R/'assets/insignia.min.js').write_text((Path(__file__).parent/'src/insignia.js').read_text())
(R/'assets/entry.min.js').write_text((Path(__file__).parent/'src/entry.js').read_text())
(R/'assets/gate.min.js').write_text((Path(__file__).parent/'src/gate.js').read_text())
(R/'assets/events.min.js').write_text((Path(__file__).parent/'src/events.js').read_text())
(R/'assets/admin.min.js').write_text((Path(__file__).parent/'src/admin.js').read_text())
def write(path,html):
 path.parent.mkdir(parents=True,exist_ok=True)
 path.write_text(html.replace('href="/','href="'+BASE).replace('src="/','src="'+BASE))
T={
'fr':dict(select='Choisissez votre ligue',acc='Compétitions GT3 sur Assetto Corsa Competizione',ace='La nouvelle scène Assetto Corsa EVO',enter='Découvrir la ligue',courses='Courses',ranking='Classements',records='Meilleurs temps',profile='Profil pilote',welcome='Deux jeux. Une communauté.',choose='Choisir une ligue',acc_intro='Retrouvez les courses programmées, les résultats et les pilotes de la ligue ACC.',ace_intro='L’espace ACE se prépare. Les courses et classements apparaîtront dès que les données ACE seront publiées.',events_desc='Les prochaines courses de la ligue.',ranking_desc='Points et performances des pilotes, par catégorie.',records_desc='Les meilleurs tours valides, classés par circuit et par voiture.',profile_desc='Le profil public complet des pilotes : statistiques et résultats.',soon='Les données ACE seront affichées après la mise en place du collecteur et de la base de données dédiés.',back='Toutes les ligues',category='Catégorie',circuit='Circuit',legacy='Site ACC actuel'),
'en':dict(select='Choose your league',acc='GT3 racing on Assetto Corsa Competizione',ace='The new Assetto Corsa EVO racing scene',enter='Explore the league',courses='Races',ranking='Standings',records='Best laps',profile='Driver profile',welcome='Two games. One community.',choose='Choose a league',acc_intro='Explore scheduled races, results and drivers in the ACC league.',ace_intro='The ACE space is being prepared. Races and standings will appear when ACE data is published.',events_desc='Upcoming league races.',ranking_desc='Driver points and performance by category.',records_desc='Fastest valid laps by track and car.',profile_desc='Public driver profiles with statistics and results.',soon='ACE data will appear after the dedicated collector and database are ready.',back='All leagues',category='Category',circuit='Track',legacy='Current ACC site'),
'de':dict(select='Wähle deine Liga',acc='GT3-Rennen in Assetto Corsa Competizione',ace='Die neue Rennszene für Assetto Corsa EVO',enter='Liga entdecken',courses='Rennen',ranking='Wertungen',records='Bestzeiten',profile='Fahrerprofil',welcome='Zwei Spiele. Eine Community.',choose='Liga wählen',acc_intro='Entdecke geplante Rennen, Ergebnisse und Fahrer der ACC-Liga.',ace_intro='Der ACE-Bereich wird vorbereitet. Rennen und Wertungen erscheinen, sobald ACE-Daten vorliegen.',events_desc='Die nächsten Rennen der Liga.',ranking_desc='Fahrerpunkte und Leistung nach Kategorie.',records_desc='Schnellste gültige Runden nach Strecke und Fahrzeug.',profile_desc='Öffentliche Fahrerprofile mit Statistiken und Ergebnissen.',soon='ACE-Daten erscheinen, sobald Collector und Datenbank eingerichtet sind.',back='Alle Ligen',category='Kategorie',circuit='Strecke',legacy='Bisherige ACC-Seite'),
'it':dict(select='Scegli la tua lega',acc='Gare GT3 su Assetto Corsa Competizione',ace='La nuova scena di Assetto Corsa EVO',enter='Scopri la lega',courses='Gare',ranking='Classifiche',records='Giri migliori',profile='Profilo pilota',welcome='Due giochi. Una comunità.',choose='Scegli una lega',acc_intro='Scopri le gare in programma, i risultati e i piloti della lega ACC.',ace_intro='Lo spazio ACE è in preparazione. Gare e classifiche appariranno quando i dati ACE saranno pubblicati.',events_desc='Le prossime gare della lega.',ranking_desc='Punti e prestazioni dei piloti per categoria.',records_desc='I migliori giri validi per circuito e auto.',profile_desc='Profili pubblici dei piloti con statistiche e risultati.',soon='I dati ACE appariranno quando collector e database dedicati saranno pronti.',back='Tutte le leghe',category='Categoria',circuit='Circuito',legacy='Sito ACC attuale'),
'es':dict(select='Elige tu liga',acc='Carreras GT3 en Assetto Corsa Competizione',ace='La nueva escena de Assetto Corsa EVO',enter='Explorar la liga',courses='Carreras',ranking='Clasificaciones',records='Mejores vueltas',profile='Perfil de piloto',welcome='Dos juegos. Una comunidad.',choose='Elegir liga',acc_intro='Consulta las próximas carreras, los resultados y los pilotos de la liga ACC.',ace_intro='El espacio ACE está en preparación. Las carreras y clasificaciones aparecerán cuando se publiquen datos de ACE.',events_desc='Las próximas carreras de la liga.',ranking_desc='Puntos y rendimiento de pilotos por categoría.',records_desc='Las vueltas válidas más rápidas por circuito y coche.',profile_desc='Perfiles públicos de pilotos con estadísticas y resultados.',soon='Los datos de ACE aparecerán cuando el collector y la base de datos estén listos.',back='Todas las ligas',category='Categoría',circuit='Circuito',legacy='Sitio ACC actual')}
T={lang:T[lang] for lang in ('fr','en')}
language_names={'fr':'Français','en':'English'}

DOCK_ICONS={
 'home':'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
 'courses':'<path d="M5 21V4m0 1c5-3 9 3 14 0v10c-5 3-9-3-14 0"/>',
 'calendar':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 4h3m2 0h3m-8 4h3"/>',
 'ranking':'<path d="M4 21h16M6 21v-7h4v7m0 0V9h4v12m0 0v-5h4v5M8 4l1 2 2 .3-1.5 1.5.4 2.2L8 9l-1.9 1 .4-2.2L5 6.3 7 6z"/>',
 'records':'<circle cx="12" cy="13" r="8"/><path d="M12 13l3-3m-3-9v4m-3-4h6M18 5l2 2"/>',
 'archives':'<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v11h14V9m-9 5h4"/>',
 'rules':'<path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM15 3v5h5M9 13h6m-6 4h6"/>',
 'profile':'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
}

def dock(lang,game,section,t):
 items=[('home','Accueil' if lang=='fr' else 'Home',f'/{lang}/')]+[(s,t[s],f'/{lang}/{game or "acc"}/{s}.html') for s in ('courses','calendar','ranking','records','archives','rules','profile')]
 links=[]
 for name,label,url in items:
  icon=f'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{DOCK_ICONS[name]}</svg>'
  current=' aria-current="page"' if section==name else ''
  links.append(f'<a href="{url}" aria-label="{escape(label)}" title="{escape(label)}"{current}>{icon}<span>{escape(label)}</span></a>')
 return '<nav class="side-dock" aria-label="Navigation">'+''.join(links)+'</nav>'
def selector(game):
 out=f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url={BASE}fr/{game}/"><title>{game.upper()} · ATXRACING</title><link rel="canonical" href="/fr/{game}/"></head><body><main><p><a href="/fr/{game}/">{game.upper()} →</a></p></main></body></html>'
 write(R/game/'index.html',out)
def page(lang,game,section):
 t={**T[lang], **EXTRA[lang], **{key:value[0] for key,value in FORMATS[lang].items()},'privacy':PRIVACY[lang]['title']}; v={**COPY[lang], **RANKING_UI[lang], **EXTRA[lang], **{key+'_lead':value[1] for key,value in FORMATS[lang].items()},'privacy_lead':PRIVACY[lang]['lead']}; t['course']=t['courses'];v['course_lead']=v['courses_lead'];t['about']='À propos' if lang=='fr' else 'About';t['admin']='Administration des courses' if lang=='fr' else 'Race administration';v['admin_lead']='Importez une page SimGrid, préparez chaque manche, vérifiez puis publiez.' if lang=='fr' else 'Import a SimGrid page, prepare each round, review and publish.';title=t.get(section,t['choose']); root='/' if not game else f'/{lang}/{game}/'
 root=f'/{lang}/{game or "acc"}/'
 nav=dock(lang,game,section,t)
 switch=f'<nav class="game-switch" aria-label="Jeu / Game"><a href="/{lang}/acc/" '+('aria-current="true"' if game=='acc' else '')+f'>ACC</a><a href="/{lang}/ace/" '+('aria-current="true"' if game=='ace' else '')+'>ACE</a></nav>'
 languages='<nav class="header-languages" aria-label="Langue / Language">'+''.join(f'<a href="/{l}/{game+"/" if game else ""}{"" if section in ("league","home") else section+".html"}" hreflang="{l}" '+('aria-current="page"' if l==lang else '')+f' lang="{l}" aria-label="{escape(language_names[l])}" title="{escape(language_names[l])}"><img src="/assets/flag-{l}.svg" alt=""></a>' for l in T)+'</nav>'
 steam=f'<a class="steam-connect" data-steam-link href="/{lang}/{game or "acc"}/profile.html" aria-label="Steam"><span class="steam-mark" aria-hidden="true">●</span><span data-steam-label>{"Connexion Steam" if lang=="fr" else "Sign in with Steam"}</span></a>'
 head=f'<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#050505"><meta name="atx-base" content="{BASE}"><meta name="description" content="ATXRACING · ACC & ACE"><title>{escape(title)} · ATXRACING</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600;700&amp;family=Inter:wght@400;500;600;700;800&amp;family=Rajdhani:wght@600;700&amp;display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/site.min.css"></head><body class="site-locked" data-game="{game}" data-page="{section}"><header class="topbar"><div class="wrap top-inner"><a class="brand" href="/" aria-label="ATXRACING"><img src="/assets/logo.webp" alt="ATXRACING"></a>{switch}{languages}{steam}</div></header>{nav}'
 footer=f'<footer class="footer"><div class="wrap"><span>© 2026 ATXRACING</span><span><a href="https://discord.com/invite/dgyJJYTSsD">Discord</a> · <a href="https://www.thesimgrid.com/communities/atxracing">SimGrid</a> · <a href="/{lang}/{game or "acc"}/privacy.html">{escape(t["privacy"])}</a></span>{languages.replace("header-languages","footer-languages")}</div></footer>'
 if section=='home':
  home_copy={
   'fr':('ESPACE PILOTE','MON','PADDOCK.','Bienvenue','Choisissez votre univers de course. Votre profil et votre identité Steam vous suivent dans les deux jeux.','Créer ou compléter mon profil','COMPÉTITION','Entrer dans la ligue ACC','EN PRÉPARATION','Découvrir ACE'),
   'en':('DRIVER SPACE','MY','PADDOCK.','Welcome','Choose your racing world. Your profile and Steam identity stay with you across both games.','Create or complete my profile','COMPETITION','Enter the ACC league','COMING SOON','Explore ACE')
  }[lang]
  eyebrow,first,last,welcome,lead,profile_action,acc_state,acc_action,ace_state,ace_action=home_copy
  guest_name='pilote' if lang=='fr' else 'driver'
  body=f'''<main class="wrap content paddock-home"><section class="paddock-intro"><a class="eyebrow" href="/{lang}/about.html">ATXRACING / {eyebrow} ↗</a><h1>{first} <em>{last}</em></h1><p class="paddock-welcome">{welcome}, <strong data-driver-name>{guest_name}</strong>.</p><p class="paddock-lead">{lead}</p><a class="paddock-profile-link" href="/{lang}/acc/profile.html">{profile_action} <span aria-hidden="true">↗</span></a></section><section class="paddock-games" aria-label="ACC / ACE"><a class="paddock-game" href="/{lang}/acc/"><img src="/assets/acc-banner.webp" alt="" width="683" height="683" fetchpriority="high"><span class="paddock-game-copy"><span class="paddock-game-state">{acc_state}</span><strong>ACC</strong><span class="paddock-game-action">{acc_action} <span aria-hidden="true">↗</span></span></span></a><a class="paddock-game" href="/{lang}/ace/"><img src="/assets/ace-banner.webp" alt="" width="683" height="683"><span class="paddock-game-copy"><span class="paddock-game-state">{ace_state}</span><strong>ACE</strong><span class="paddock-game-action">{ace_action} <span aria-hidden="true">↗</span></span></span></a></section></main>'''
 elif section=='about':
  body=f'<main class="wrap content about-content"><section class="about-empty"><span class="eyebrow">ATXRACING</span><h1>{escape(t["about"])}</h1></section></main>'
 else:
  main='<main class="wrap content">'
  if section=='league':
   main+=f'<section class="league-overview"><div class="overview-copy"><span class="eyebrow">{escape(v["stage"])} / {game.upper()}</span><h1>{escape(v["league_"+game])}</h1><p>{escape(v["lead_"+game])}</p><a class="action" href="/{lang}/{game}/courses.html">{escape(v["discover"])} <span aria-hidden="true">↗</span></a></div><div class="overview-art"><img src="/assets/{game}-banner.webp" alt=""></div></section><div class="section-intro"><span class="eyebrow">{game.upper()} / 01—04</span><h2>{escape(v["section"])}</h2></div><div class="grid feature-grid">'+''.join(f'<a class="panel feature-panel" href="/{lang}/{game}/{s}.html"><span class="meta">0{i} / {game.upper()}</span><h3>{escape(t[s])} <span aria-hidden="true">↗</span></h3><p>{escape(v["courses_lead" if s=="courses" else s+"_lead"])}</p></a>' for i,s in enumerate(['courses','ranking','records','profile'],1))+'</div>'
  else:
   main+=f'<section class="page-masthead"><div class="masthead-copy"><span class="eyebrow">{game.upper()} / {escape(v["stage"])}</span><h1>{escape(t[section])}</h1><p>{escape(v[section+"_lead"])}</p></div><div class="masthead-art"><img src="/assets/{game}-banner.webp" alt=""></div></section>'
   if section=='admin':
    main+='<section id="admin-app" class="admin-app" aria-live="polite"></section>'
   if section=='profile':
    intro='Votre identité. Votre rythme. Votre prochaine course.' if lang=='fr' else 'Your identity. Your pace. Your next race.'
    level_wait='Niveau en attente de résultats' if lang=='fr' else 'Level awaiting results'
    level_label='Progression du pilote' if lang=='fr' else 'Driver progression'
    main+=f'<figure class="driver-levels" data-driver-levels><div class="driver-levels-art"><img class="driver-levels-base" src="/assets/driver-levels-cutout.png" alt="" width="1774" height="887"><div class="driver-levels-reveal" aria-hidden="true"><img src="/assets/driver-levels-cutout.png" alt="" width="1774" height="887"></div></div><figcaption><div class="driver-levels-caption"><span data-level-status>{level_wait}</span><span class="driver-levels-current" data-level-current>—</span></div><span class="driver-levels-track" role="progressbar" aria-label="{level_label}" aria-valuemin="0" aria-valuemax="5" aria-valuenow="0" aria-valuetext="{level_wait}"><span class="driver-levels-fill"></span></span><span class="driver-levels-steps" aria-hidden="true"><span>ROOKIE</span><span>CHALLENGER</span><span>PRO</span><span>ELITE</span><span>ALIEN</span></span></figcaption></figure><section id="account-app" class="account-app" aria-live="polite"><p>{intro}</p></section><noscript><p>{"Activez JavaScript pour vous connecter et modifier votre profil." if lang=="fr" else "Enable JavaScript to sign in and edit your profile."}</p></noscript>'
   if section=='privacy':main+='<div class="privacy-sections">'+''.join(f'<article><span class="meta">{str(i).zfill(2)}</span><h2>{escape(heading)}</h2><p>{escape(copy)}</p></article>' for i,(heading,copy) in enumerate(PRIVACY[lang]['parts'],1))+'</div><p><a class="pill" href="mailto:athoxmotorsport@gmail.com">athoxmotorsport@gmail.com</a></p>'
   elif game=='ace' and section!='profile': main+=f'<section class="status-panel"><span class="eyebrow">ACE / {escape(v["published"])}</span><h2>{escape(v["league_ace"])}</h2><p>{escape(v["ace_pending"])}</p><a class="pill" href="/{lang}/acc/">{escape(v["back_acc"])} ↗</a></section>'
   else:
    if section=='courses':
     main+=f'<div class="section-intro"><span class="eyebrow">01 / {escape(v["formats"])}</span><h2>{escape(v["formats"])}</h2></div><div class="format-grid">'+''.join(f'<a class="format-card" href="/{lang}/{game}/{"daily-race" if name=="Daily Race" else "ballade" if name=="Ballade ATX" else "worldgt"}.html"><span class="meta">0{i} / ACC</span><h3>{escape(name)} ↗</h3><p>{escape(description)}</p></a>' for i,(name,description) in enumerate(v['formats_items'],1))+'</div>'
     main+=f'<div class="section-intro"><span class="eyebrow">02 / {escape(v["schedule"])}</span><h2>{escape(v["next"])}</h2></div>'
    if section=='ranking':
     main+=f'<div class="section-intro"><span class="eyebrow">01 / {escape(v["source"])}</span><h2>{escape(v["standings"])}</h2></div>'
     main+='<div id="ranking-app" aria-live="polite"><nav class="ranking-views" aria-label="'+escape(v['standings'])+'">'+''.join(f'<button type="button" data-view="{key}">{escape(label)}</button>' for key,label in [('points',v['points_view']),('circuit',v['circuit_view']),('driver',v['driver_view']),('team',v['team_view'])])+'</nav><div id="ranking-content"><p class="loading">…</p></div></div>'
    if section=='records': main+=f'<div class="section-intro"><span class="eyebrow">01 / {escape(v["source"])}</span><h2>{escape(v["fastest"])}</h2></div><div id="circuit-grid" class="record-circuits" aria-label="{escape(v["track"])}"></div><div id="record-spotlight" class="record-spotlight" aria-live="polite"></div>'
    if section in ('worldgt','daily-race','ballade'):
     desc=FORMATS[lang][section][2]
     main+=f'<section class="format-detail"><span class="eyebrow">{game.upper()} / {escape(t[section])}</span><h2>{escape(t[section])}</h2><p>{escape(desc)}</p><div class="format-actions"><a class="action" href="/{lang}/{game}/calendar.html?type={"WGT" if section=="worldgt" else "DR" if section=="daily-race" else "BA"}">{escape(v["calendar"])} ↗</a><a class="pill" href="/{lang}/{game}/ranking.html?type={"WGT" if section=="worldgt" else "DR" if section=="daily-race" else "BA"}#points">{escape(v["standings"])} ↗</a></div></section>'
    if section in ('worldgt','daily-race','ballade'):main+=f'<div class="section-intro"><span class="eyebrow">{escape(v["calendar"])}</span><h2>{escape(v["next"])}</h2></div><div id="results" aria-live="polite"></div>'
    if section=='calendar':main+='<nav class="event-categories" aria-label="'+escape(v['calendar'])+'">'+''.join(f'<button type="button" data-category="{code}">{escape(label)}</button>' for code,label in [('ALL',v['calendar']),('WGT','WorldGT'),('DR','Daily Race'),('BA','Ballade ATX')])+'</nav>'
    if section=='rules':main+='<div class="rules-collection">'+''.join(f'<article class="rule-card"><span class="meta">{str(i).zfill(2)} / ACC</span><h2>{escape(name)}</h2><p>{escape(description)}</p></article>' for i,(name,description) in enumerate(RULES[lang],1))+'</div>'
    if section=='rules':
     penalties=PENALTIES[lang]
     main+=f'<section class="penalty-section"><h2>{escape(penalties["title"])}</h2><div class="ranking-table-wrap"><table class="ranking-table"><thead><tr>'+''.join(f'<th>{escape(h)}</th>' for h in penalties['headers'])+'</tr></thead><tbody>'+''.join('<tr>'+''.join(f'<td>{escape(cell)}</td>' for cell in row)+'</tr>' for row in penalties['rows'])+'</tbody></table></div></section>'
    if section=='profile' and game=='acc':main+=f'<div id="public-directory"><div class="section-intro"><span class="eyebrow">01 / {escape(v["profile_public"])}</span><h2>{escape(v["drivers"])}</h2></div><div id="driver-directory" class="driver-directory"><label for="driver-search">{escape(v["search"])}</label><input id="driver-search" type="search" placeholder="{escape(v["search_hint"])}" autocomplete="off"></div></div>'
    if section not in ('ranking','rules','privacy','worldgt','daily-race','ballade','admin'):main+='<div id="results" aria-live="polite"><p class="loading">…</p></div>'
  main+=f'<p class="return-link"><a href="/{lang}/">← {escape(t["back"])}</a></p></main>'
  body=main
 out=head+body+footer+'<script src="/assets/gate.min.js" defer></script>'+('<script src="/assets/insignia.min.js" defer></script>' if section=='profile' and game=='acc' else '')+('<script src="/assets/circuit-images.min.js" defer></script>' if section=='records' and game=='acc' else '')+('<script src="/assets/site.min.js" defer></script>' if game=='acc' and section in ('courses','records','profile') else '')+('<script src="/assets/ranking.min.js" defer></script>' if section=='ranking' and game=='acc' else '')+('<script src="/assets/events.min.js" defer></script>' if game=='acc' and section in ('calendar','archives','event','course','worldgt','daily-race','ballade') else '')+('<script src="/assets/admin.min.js" defer></script>' if section=='admin' else '')+('<script src="/assets/account.min.js" defer></script>' if game else '')+'</body></html>'
 path=R/lang/(game or '')/('index.html' if section in ('home','league') else section+'.html');write(path,out)
for l in T:
 page(l,'','home')
 page(l,'','about')
 for g in ('acc','ace'):
  for s in ('league','courses','worldgt','daily-race','ballade','calendar','ranking','records','archives','event','course','rules','privacy','profile')+(('admin',) if g=='acc' else ()):page(l,g,s)
entry=f'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#090b10"><meta name="atx-base" content="{BASE}"><meta name="description" content="Rejoignez le paddock ATXRACING avec Steam / Join the ATXRACING paddock with Steam"><title>Bienvenue / Welcome · ATXRACING</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;family=Rajdhani:wght@600;700&amp;display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/site.min.css"></head>
<body data-page="entry"><main class="entry"><div class="entry-content">
<section class="entry-french" lang="fr" aria-label="Bienvenue"><p class="entry-kicker">UN COMPTE. VOTRE PLACE SUR LA GRILLE.</p><h1>LE PADDOCK<br>VOUS <em>ATTEND.</em></h1><p class="entry-lead">Connectez-vous avec Steam pour accéder aux courses et créer votre profil pilote.</p></section>
<a class="entry-connect" href="https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/auth-steam?return_path={BASE}fr/acc/profile.html" aria-label="Se connecter avec Steam / Sign in with Steam"><span class="entry-steam-icon" aria-hidden="true">●</span><span>Se connecter avec Steam<small lang="en">Sign in with Steam</small></span><span aria-hidden="true">↗</span></a>
<section class="entry-english" lang="en" aria-label="Welcome"><p class="entry-english-lead">Sign in with Steam to access races and create your driver profile.</p><h2>THE PADDOCK <em>AWAITS YOU.</em></h2><p class="entry-english-kicker">ONE ACCOUNT. YOUR PLACE ON THE GRID.</p></section>
<p class="entry-status" role="status" data-entry-status></p></div><p class="entry-games">COMPETIZIONE <span aria-hidden="true">│</span> ASSETTO CORSA EVO</p></main><script src="/assets/entry.min.js" defer></script></body></html>'''
write(R/'index.html',entry)
for g in ('acc','ace'):selector(g)

# GitHub Pages for this repository is configured to publish main / (root).
# Mirror only generated public files there; sources and docs remain in place.
for generated in R.rglob('*'):
 if generated.is_file():
  target=Path(__file__).parent/generated.relative_to(R)
  target.parent.mkdir(parents=True,exist_ok=True)
  shutil.copy2(generated,target)
