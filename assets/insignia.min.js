/* Compact sporting emblems shared by the private and public ACC profiles. */
window.ATXInsignia = (() => {
 const levels = ['ROOKIE', 'CHALLENGER', 'PRO', 'ELITE', 'ALIEN'];
 const icons = {
  safe: '<svg viewBox="0 0 64 72" aria-hidden="true"><path d="M32 4 55 13v23c0 15-9 25-23 32C18 61 9 51 9 36V13Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="m21 36 8 8 16-18" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  fast: '<svg viewBox="0 0 64 72" aria-hidden="true"><path d="M36 4 13 39h19l-4 29 25-40H34Z" fill="currentColor"/></svg>',
  gentleman: '<svg viewBox="0 0 64 72" aria-hidden="true"><path d="M32 8 38 23l16 1-12 11 4 16-14-8-14 8 4-16-12-11 16-1Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M11 52c5 8 11 12 21 16 10-4 16-8 21-16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>'
 };
 const el = (tag, className, value) => { const item = document.createElement(tag); if (className) item.className = className; if (value != null) item.textContent = String(value); return item; };
 const lap = ms => Number(ms) > 0 ? `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}` : '—';
 function create({lang = 'fr', stage = 0, score = null, tier = null, awards = [], results = [], eventBase = ''} = {}) {
  const fr = lang === 'fr';
  const words = fr ? {rank:'Niveau',pending:'En attente de résultats',safe:'Safe',unrated:'Note Safe indisponible',times:'fois',none:'Aucune distinction officielle pour le moment.',valid:'tours valides',penalties:'pénalités',close:'Fermer',rating:'Note publiée'} : {rank:'Level',pending:'Awaiting results',safe:'Safe',unrated:'Safe rating unavailable',times:'times',none:'No official honours yet.',valid:'valid laps',penalties:'penalties',close:'Close',rating:'Published rating'};
  const rail = el('div', 'insignia-rail'); rail.setAttribute('aria-label', fr ? 'Emblèmes du pilote' : 'Driver emblems');
  const panel = el('section', 'insignia-panel'); panel.hidden = true;
  const buttons = {};
  let rankStage = 0, safeScore = null, safeTier = null, current = '';
  const types = [
   ['rank', words.rank], ['safe', 'SAFE'], ['fast', 'FAST DRIVER'], ['gentleman', 'GENTLEMAN DRIVER']
  ];
  for (const [kind, title] of types) {
   const button = el('button', `pilot-insignia pilot-insignia--${kind}`); button.type = 'button'; button.dataset.kind = kind; button.setAttribute('aria-expanded', 'false');
   const frame = el('span', 'insignia-frame'), crest = el('span', 'insignia-crest');
   if (kind === 'rank') crest.append(el('span', 'insignia-portrait'), el('span', 'insignia-question', '?'));
   else { const symbol = el('span', 'insignia-symbol'); symbol.innerHTML = icons[kind]; crest.append(symbol, el('strong', 'insignia-value', '?')); }
   frame.append(crest); button.append(el('span', 'insignia-label', title), frame);
   if (kind === 'safe') { const meter = el('span', 'insignia-mini-track'); meter.append(el('i')); button.append(meter); }
   else if (kind !== 'rank') button.append(el('span', 'insignia-under', '—'));
   button.addEventListener('click', () => { if (current === kind) close(); else open(kind); });
   buttons[kind] = button; rail.append(button);
  }
  function close() { current = ''; panel.hidden = true; for (const button of Object.values(buttons)) button.setAttribute('aria-expanded', 'false'); }
  function open(kind) {
   current = kind; panel.replaceChildren(); for (const [name, button] of Object.entries(buttons)) button.setAttribute('aria-expanded', String(name === kind));
   const heading = el('div', 'insignia-panel-heading'), title = el('h3', '', kind === 'rank' ? words.rank : kind === 'safe' ? 'SAFE' : kind === 'fast' ? 'FAST DRIVER' : 'GENTLEMAN DRIVER');
   const dismiss = el('button', 'insignia-dismiss', '×'); dismiss.type = 'button'; dismiss.setAttribute('aria-label', words.close); dismiss.onclick = () => { close(); buttons[kind].focus(); };
   heading.append(title, dismiss); panel.append(heading);
   if (kind === 'rank') panel.append(el('p', 'insignia-panel-copy', rankStage ? levels[rankStage - 1] : words.pending));
   else if (kind === 'safe') {
    if (safeScore == null) panel.append(el('p', 'insignia-panel-copy', words.unrated));
    else {
     const metal = safeTier ? ({bronze:'BRONZE',silver:fr?'ARGENT':'SILVER',gold:fr?'OR':'GOLD'})[safeTier] : words.pending;
     panel.append(el('p', 'insignia-panel-copy', `${metal} · ${Math.round(safeScore)}/100 · ${words.rating}`));
     const gauge = el('span', 'insignia-gauge'); gauge.setAttribute('role', 'progressbar'); gauge.setAttribute('aria-label', 'Safe'); gauge.setAttribute('aria-valuemin', '0'); gauge.setAttribute('aria-valuemax', '100'); gauge.setAttribute('aria-valuenow', String(safeScore)); gauge.style.setProperty('--safe-progress', safeScore + '%'); gauge.append(el('i')); panel.append(gauge);
     const marks = el('div', 'insignia-gauge-marks'); ['0', 'BRONZE 39', fr ? 'ARGENT 60' : 'SILVER 60', fr ? 'OR 80' : 'GOLD 80', '100'].forEach(mark => marks.append(el('span', '', mark))); panel.append(marks);
    }
   } else {
    const type = kind === 'fast' ? 'fast_driver' : 'gentleman_driver', rows = awards.filter(award => award.award_type === type);
    panel.append(el('p', 'insignia-panel-copy', rows.length ? `${rows.length} ${words.times}` : words.none));
    if (rows.length) {
     const list = el('ul', 'insignia-results');
     for (const row of rows) {
      const item = el('li'), race = row.event_slug ? el('a', '', row.circuit_name || '—') : el('strong', '', row.circuit_name || '—');
      if (row.event_slug) race.href = eventBase + encodeURIComponent(row.event_slug);
      const day = row.starts_at ? new Intl.DateTimeFormat(lang, {dateStyle:'medium', timeZone:'Europe/Brussels'}).format(new Date(row.starts_at)) : '—';
      const result = results.find(entry => entry.event?.slug === row.event_slug || entry.event_id === row.event_id);
      const finish = Number(row.finish_position ?? result?.finish_position) > 0 ? ` · P${row.finish_position ?? result.finish_position}` : '';
      const detail = kind === 'fast' ? lap(row.best_lap_ms) : `${row.clean_laps ?? 0} ${words.valid} · ${row.penalty_count ?? 0} ${words.penalties}`;
      item.append(race, el('span', '', day), el('small', '', detail + finish)); list.append(item);
     }
     panel.append(list);
    }
   }
   panel.hidden = false;
  }
  panel.addEventListener('keydown', event => { if (event.key === 'Escape') { const active = current; close(); buttons[active]?.focus(); } });
  function setRank(value) {
   rankStage = Math.max(0, Math.min(5, Number(value) || 0));
   const button = buttons.rank; button.dataset.stage = String(rankStage); button.style.setProperty('--portrait-position', (rankStage - 1) * 25 + '%');
   button.setAttribute('aria-label', rankStage ? `${words.rank} ${levels[rankStage - 1]}` : `${words.rank} ?`);
   if (current === 'rank') open('rank');
  }
  function setSafety(value, valueTier) {
   const numeric = value == null ? null : Number(value); safeScore = Number.isFinite(numeric) ? Math.max(0, Math.min(100, numeric)) : null;
   safeTier = ['bronze','silver','gold'].includes(valueTier) ? valueTier : null;
   const button = buttons.safe; button.dataset.tier = safeTier || 'pending'; button.style.setProperty('--safe-progress', (safeScore ?? 0) + '%');
   button.querySelector('.insignia-value').textContent = safeScore == null ? '?' : String(Math.round(safeScore));
   button.setAttribute('aria-label', safeScore == null ? 'SAFE ?' : `SAFE ${Math.round(safeScore)}/100`);
   if (current === 'safe') open('safe');
  }
  for (const [kind, type] of [['fast','fast_driver'], ['gentleman','gentleman_driver']]) {
   const count = awards.filter(award => award.award_type === type).length;
   buttons[kind].querySelector('.insignia-value').textContent = count ? String(count) : '?';
   buttons[kind].querySelector('.insignia-under').textContent = count ? words.times : '—';
   buttons[kind].dataset.empty = String(!count);
   buttons[kind].setAttribute('aria-label', `${kind === 'fast' ? 'FAST DRIVER' : 'GENTLEMAN DRIVER'} ${count ? count + ' ' + words.times : '?'}`);
  }
  setRank(stage); setSafety(score, tier);
  return {rail, panel, setRank, setSafety};
 }
 return {create};
})();
