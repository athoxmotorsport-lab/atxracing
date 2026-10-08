"""Refresh only published event metadata; no driver results, identities or credentials."""
import json,urllib.request,re
from pathlib import Path
root=Path(__file__).resolve().parent.parent
with urllib.request.urlopen('https://twjpjzalyvbsdpbzhqln.supabase.co/functions/v1/public-event',timeout=30) as response:
 data=json.load(response)
fields=['slug','title_fr','title_en','description_fr','description_en','circuit_name','starts_at','duration_minutes','image_url','simgrid_url','competition_code','format_code','site_registration_enabled','mandatory_stop_count','car_class','result_publication_state','event_schedule','status']
by_slug={e['slug']:{key:e.get(key) for key in fields} for e in data.get('events',[])+data.get('archives',[]) if e.get('slug') and e.get('status') not in ['draft','cancelled'] and (e.get('competition_code') in ['DR','WGT','ATXS'] or e.get('event_type') in ['daily_race','sprint','endurance','championship']) and not re.search(r'open[ _-]*lobby|hotlap|entra[iî]nement|practice|discord',str(e.get('title_fr',''))+' '+str(e.get('title_en','')),re.I)}
if not by_slug:raise RuntimeError('No public events returned; preserving the previous snapshot')
(root/'data/public-events.json').write_text(json.dumps(sorted(by_slug.values(),key=lambda e:e['slug']),ensure_ascii=False,indent=2)+'\n')
print(f'Refreshed {len(by_slug)} public event pages')
