/* Shared light vehicle miniatures for static and asynchronously rendered content. */
(() => {
 const catalog={"Bentley Continental GT3 (2018)": "bentley-continental-gt3-2018.webp", "Aston Martin V8 Vantage GT3": "aston-martin-v8-vantage-gt3.webp", "Aston Martin V12 Vantage GT3": "aston-martin-v12-vantage-gt3.webp", "Aston Martin Vantage V12 GT3": "aston-martin-v12-vantage-gt3.webp", "Audi R8 LMS GT3": "audi-r8-lms-gt3.webp", "Audi R8 LMS GT3 Evo 2": "audi-r8-lms-gt3-evo-2.webp", "BMW M4 GT3": "bmw-m4-gt3.webp", "Ferrari 296 GT3": "ferrari-296-gt3.webp", "Ferrari 488 GT3": "ferrari-488-gt3.webp", "Ford Mustang GT3": "ford-mustang-gt3.webp", "Honda NSX GT3 Evo": "honda-nsx-gt3-evo.webp", "Lamborghini Huracán GT3 Evo2": "lamborghini-huracan-gt3-evo2.webp", "Lexus RC F GT3": "lexus-rc-f-gt3.webp", "McLaren 720S GT3": "mclaren-720s-gt3.webp", "McLaren 720S GT3 Evo": "mclaren-720s-gt3-evo.webp", "Mercedes-AMG GT3": "mercedes-amg-gt3.webp", "Mercedes-AMG GT3 Evo (2020)": "mercedes-amg-gt3.webp", "Nissan GT-R Nismo GT3 (2018)": "nissan-gt-r-nismo-gt3-2018.webp", "Porsche 911 GT3 R (2018)": "porsche-911-gt3-r-2018.webp", "Porsche 911 GT3 R": "porsche-911-gt3-r.webp", "Porsche 992 GT3 R": "porsche-992-gt3-r.webp", "BMW M6 GT3": "bmw-m6-gt3.webp", "Ferrari 488 GT3 Evo": "ferrari-488-gt3-evo.webp", "Modèle ACC 24": "ferrari-488-gt3-evo.webp", "Modèle ACC 25": "mercedes-amg-gt3.webp", "Porsche 911 II GT3 Cup": "porsche-911-ii-gt3-cup.webp"};
 const base=document.querySelector('meta[name="atx-base"]')?.content||'/atxracing/';
 const canonical={'Modèle ACC 24':'Ferrari 488 GT3 Evo','Modèle ACC 25':'Mercedes-AMG GT3 Evo (2020)'};
 const quote=name=>[...name].map(c=>'.*+?^$()[]{}|'.includes(c)||c.charCodeAt(0)===92?String.fromCharCode(92)+c:c).join('');
 const escaped=Object.keys(catalog).sort((a,b)=>b.length-a.length).map(quote);
 const pattern=new RegExp('('+escaped.join('|')+')(?![a-z0-9])','gi');
 const lookup=new Map(Object.entries(catalog).map(([name,file])=>[name.toLowerCase(),file]));
 function visual(model){
  const file=lookup.get(String(model).toLowerCase());if(!file)return null;
  const wrap=document.createElement('span');wrap.className='car-model-visual';
  const image=document.createElement('img');image.src=base+'assets/gt3/thumbs/'+file;image.alt='';image.width=120;image.height=67;image.loading='lazy';image.decoding='async';image.onerror=()=>image.remove();
  const label=document.createElement('span');label.textContent=canonical[model]||model;wrap.append(image,label);return wrap;
 }
 window.ATX_CAR_IMAGES={create:visual,file:model=>lookup.get(String(model).toLowerCase())||null};
 const excluded='script,style,textarea,select,option,svg,code,pre,[contenteditable],.car-model-visual,.driver-favourite-car,.registration-car-option,.race-participant-car,.evo-car-card';
 function enhanceText(text){
  const parent=text.parentElement;if(!parent||parent.closest(excluded))return;
  if(parent.closest('label')?.querySelector('img[src*="/gt3/"]'))return;
  if(parent.querySelector(':scope > img[src*="/gt3/"]'))return;
  pattern.lastIndex=0;const matches=[...text.data.matchAll(pattern)];if(!matches.length)return;
  const fragment=document.createDocumentFragment();let cursor=0;
  for(const match of matches){fragment.append(text.data.slice(cursor,match.index),visual(match[0]));cursor=match.index+match[0].length;}
  fragment.append(text.data.slice(cursor));text.replaceWith(fragment);
 }
 const previews=new WeakMap();
 function selectPreview(select){
  if(select.multiple)return;
  pattern.lastIndex=0;const match=select.selectedOptions[0]?.textContent.match(pattern)?.[0];
  const previous=previews.get(select);previous?.remove();previews.delete(select);
  if(!match)return;const preview=visual(match);preview.classList.add('car-select-preview');select.insertAdjacentElement('afterend',preview);previews.set(select,preview);
 }
 function enhance(root){
  if(root.nodeType===Node.TEXT_NODE){enhanceText(root);return;}
  if(root.nodeType!==Node.ELEMENT_NODE)return;
  if(root.matches('select')){selectPreview(root);return;}
  if(root.closest(excluded))return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const texts=[];while(walker.nextNode())texts.push(walker.currentNode);texts.forEach(enhanceText);
  if(root.matches('select'))selectPreview(root);root.querySelectorAll('select').forEach(selectPreview);
 }
 enhance(document.body);
 document.addEventListener('change',event=>{if(event.target.matches('select'))selectPreview(event.target);});
 const observer=new MutationObserver(records=>{for(const record of records){if(record.type==='characterData')enhanceText(record.target);else for(const added of record.addedNodes)enhance(added);}});
 observer.observe(document.body,{childList:true,subtree:true,characterData:true});
})();
