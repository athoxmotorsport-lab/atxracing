"""Small, labelled SVG signals for competition cards and format pages."""
from html import escape

PATHS = {
 'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 'crew': '<circle cx="9" cy="7" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4M16 4a3 3 0 0 1 0 6M18 13a5 5 0 0 1 3 4v4"/>',
 'pit': '<path d="M4 21V4h10v17M2 21h14M7 7h4v5H7zM14 12h3a2 2 0 0 1 2 2v3a2 2 0 0 0 3 0V8l-3-3"/>',
 'swap': '<path d="M3 7h16l-4-4M21 17H5l4 4M19 7l-4 4M5 17l4-4"/>',
 'tyre': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m6 5 2 3m8 8 2 3M5 18l3-2m8-8 3-2"/>',
 'calendar': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-14 4h3m4 0h3m-10 4h3"/>',
 'ticket': '<path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4zM15 6v3m0 2v2m0 2v3"/>',
 'flag': '<path d="M4 22V3h16v12H4M8 3v12m4-12v12m4-12v12M4 7h16M4 11h16"/>',
 'track': '<path d="M5 5h10a5 5 0 0 1 5 5v6a4 4 0 0 1-4 4h-3a3 3 0 0 1-3-3v-2a2 2 0 0 0-2-2H5a4 4 0 0 1 0-8Z"/>',
 'arrow': '<path d="M5 19 19 5M5 5h14v14"/>',
}

def icon(name):
 return '<svg class="format-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+PATHS[name]+'</svg>'

def data(lang, key):
 en=lang=='en'
 w=lambda fr,eng: eng if en else fr
 common=[('tyre',w('Pneus & carburant','Tyres & fuel'),w('Facultatifs','Optional'))]
 items={
 'worldgt-sprint': [('clock',w('Course','Race'),'60 min'),('crew',w('Équipage','Crew'),w('2 pilotes','2 drivers')),('swap',w('Changement pilote','Driver change'),w('Obligatoire','Mandatory'))]+common,
 'worldgt-endurance': [('clock',w('Durée','Duration'),w('Selon l’épreuve','Event dependent')),('crew',w('Équipage','Crew'),w('1 à 6 pilotes','1–6 drivers')),('swap',w('Relais','Stints'),'45 min max'),('track',w('Épreuves','Events'),'Monza · Silverstone')],
 'daily-race': [('clock',w('Course','Race'),'60 / 90 min'),('crew',w('Équipage','Crew'),w('Solo','Solo')),('pit',w('Arrêts obligatoires','Mandatory stops'),w('1 / 2 arrêts','1 / 2 stops'))]+common,
 'atx-series': [('calendar',w('Rendez-vous','Rendezvous'),w('Toutes les 90 min','Every 90 min')),('clock',w('Course','Race'),'45 min'),('ticket',w('Inscription','Registration'),w('Sur le site','On the website')),('track',w('Circuit','Track'),w('Change à chaque course','Changes each race'))],
 }
 return items[key]

def signals(lang,key):
 return '<dl class="format-signals">'+''.join('<div class="format-signal"><dt>'+icon(kind)+'<span>'+escape(label)+'</span></dt><dd>'+escape(value)+'</dd></div>' for kind,label,value in data(lang,key))+'</dl>'

def card(lang,key,name,index):
 code='WGT' if key.startswith('worldgt') else 'DR' if key=='daily-race' else 'ATXS'
 headline={'worldgt-sprint':'60','worldgt-endurance':'45','daily-race':'60 / 90','atx-series':'90'}[key]
 caption={'worldgt-sprint':('minutes de course','minutes of racing'),'worldgt-endurance':('minutes par relais · max','minutes per stint · max'),'daily-race':('minutes de course','minutes of racing'),'atx-series':('minutes entre rendez-vous','minutes between rendezvous')}[key][lang=='en']
 return f'<a class="format-card format-poster" data-format="{key}" href="/{lang}/acc/{key}.html"><span class="format-card-top"><span class="meta">0{index} / {code}</span>{icon("flag")}</span><h3>{escape(name)}</h3><div class="format-duration"><strong>{headline}</strong><span>{caption}</span></div>{signals(lang,key)}<span class="format-card-bottom">{escape("View format" if lang=="en" else "Découvrir le format")} {icon("arrow")}</span></a>'

def detail(lang,key):
 en=lang=='en'
 w=lambda fr,eng: eng if en else fr
 if key=='worldgt':
  return '<div class="format-grid">'+card(lang,'worldgt-sprint','World GT Sprint',1)+card(lang,'worldgt-endurance','World GT Endurance',2)+'</div>'
 if key not in ('worldgt-sprint','worldgt-endurance','daily-race','atx-series'):return ''
 out=signals(lang,key)
 if key=='daily-race':
  out+='<div class="format-variants">'+''.join(f'<article>{icon("clock")}<strong>{minutes} min</strong><span>{icon("pit")}{stops} {w("arrêt obligatoire" if stops==1 else "arrêts obligatoires","mandatory stop" if stops==1 else "mandatory stops")}</span></article>' for minutes,stops in [(60,1),(90,2)])+'</div><p class="format-footnote">'+w('Stands ouverts pendant toute la course.','Pits open throughout the race.')+'</p>'
 if key=='atx-series':
  out+='<ol class="format-session-strip">'+''.join(f'<li>{icon(kind)}<span>{label}</span><strong>{minutes}<small> min</small></strong></li>' for kind,label,minutes in [('clock',w('Essais libres','Practice'),2),('clock',w('Qualifications','Qualifying'),15),('flag',w('Course','Race'),45)])+'</ol><p class="format-footnote">'+w('Jours et horaires annoncés au calendrier · inscription sur le site obligatoire · classement ATXS.','Days and times published in the calendar · website registration required · ATXS standings.')+'</p>'
 if key=='worldgt-endurance':out+='<p class="format-footnote">'+w('La durée totale est précisée dans le briefing de chaque épreuve.','The total duration is specified in each event briefing.')+'</p>'
 return out
