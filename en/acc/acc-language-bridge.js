/* Multi-game routing for the original ACC page. Its race UI stays untouched. */
(() => {
 const current=document.currentScript?.dataset.atxLanguage||document.documentElement.lang;
 const languages=[['fr','Français'],['en','English'],['de','Deutsch'],['it','Italiano'],['es','Español']];
 const tools=document.querySelector('.side-tools');
 if(!tools)return;
 const original=tools.querySelector('.language-options');
 original?.querySelector('[data-language="'+(current==='en'?'en':'fr')+'"]')?.click();
 if(original)original.remove();
 const nav=document.createElement('nav');nav.className='language-options';nav.setAttribute('aria-label','Langue / Language');
 for(const [lang,label] of languages){const link=document.createElement('a');link.className='language-option';link.href=location.pathname.replace(/\/(fr|en|de|it|es)\/acc\//,'/'+lang+'/acc/')+location.search+location.hash;link.lang=lang;link.hreflang=lang;link.title=label;link.setAttribute('aria-label',label);if(lang===current)link.setAttribute('aria-current','page');const img=document.createElement('img');img.src=(location.pathname.includes('/events/')?'../':'')+'assets/ui/flag-'+lang+'.svg';img.alt='';link.append(img);nav.append(link)}
 tools.append(nav);
 const brand=document.querySelector('.side-brand');
 if(brand){const back=document.createElement('a');back.className='atx-league-return';back.href='/atxracing/';back.textContent=({fr:'← Choisir une ligue',en:'← Choose a league',de:'← Liga wählen',it:'← Scegli la lega',es:'← Elegir liga'})[current];brand.append(back)}
 const legacySwitch=document.querySelector('[data-lang-switch]');if(legacySwitch)legacySwitch.hidden=true;
 const translations=window.ATX_ACC_I18N;
 if(translations){
  let pending=false;
  const translate=()=>{pending=false;const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let item;while((item=walker.nextNode())){const parent=item.parentElement;if(!parent||parent.closest('script,style'))continue;const raw=item.nodeValue,key=raw.trim(),replacement=translations[key];if(!replacement||replacement===key)continue;item.nodeValue=raw.replace(key,replacement)}};
  const observer=new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(translate)});
  observer.observe(document.body,{childList:true,characterData:true,subtree:true});translate();
 }
 // The production ACC application contains the official French and English
 // language packs. Select the right production language for these two routes.
})();
