/* Public profile assets and presentation rules. Only verified race photographs belong here. */
const ATX_PROFILE_MEDIA=(()=>{
 const photos={
  'Porsche 992 GT3 R':{image:'/atxracing/assets/gt3/01.jpg',credit:'TaurusEmerald · CC BY-SA 4.0',source:'https://commons.wikimedia.org/wiki/File:AO_Racing_Porsche_992_GT3_R_No._77.jpg'},
  'Aston Martin V8 Vantage GT3':{image:'/atxracing/assets/gt3/02.jpg',credit:'MrWalkr · CC BY-SA 4.0',source:'https://commons.wikimedia.org/wiki/File:2018_Aston_Martin_Vantage_GT3_FOS19.jpg'},
  'Audi R8 LMS GT3':{image:'/atxracing/assets/gt3/03.jpg',credit:'Calreyn88 · CC BY-SA 4.0',source:'https://commons.wikimedia.org/wiki/File:2010_Audi_R8_LMS_GT3.jpg'},
  'Audi R8 LMS GT3 Evo 2':{image:'/atxracing/assets/gt3/04.jpg',credit:'Charles · CC BY 2.0',source:'https://commons.wikimedia.org/wiki/File:Audi_R8_LMS_GT3_Evo_II_(2022)_(52565766187).jpg'},
  'BMW M4 GT3':{image:'/atxracing/assets/gt3/05.jpg',credit:'MrWalkr · CC BY-SA 4.0',source:'https://commons.wikimedia.org/wiki/File:2022_BMW_M4_GT3.jpg'},
  'Ferrari 296 GT3':{image:'/atxracing/assets/gt3/06.jpg',credit:'350z33 · CC BY-SA 4.0',source:'https://commons.wikimedia.org/wiki/File:2023_Ferrari_296_GT3_Daytona_(cropped).jpg'},
  'Ferrari 488 GT3':{image:'/atxracing/assets/gt3/07.jpg',credit:'Calreyn88 · CC BY-SA 4.0',source:'https://commons.wikimedia.org/wiki/File:Ferrari_488_GT3.jpg'},
  'Ford Mustang GT3':{image:'/atxracing/assets/gt3/08.jpg',credit:'Calreyn88 · CC0',source:'https://commons.wikimedia.org/wiki/File:2023_Ford_Mustang_GT3.jpg'},
  'Honda NSX GT3 Evo':{image:'/atxracing/assets/gt3/09.jpg',credit:'Ted Barrett · CC BY 2.0',source:'https://commons.wikimedia.org/wiki/File:Honda_NSX_GT3_At_Bathurst_Esses_(49485211948).jpg'},
  'Lamborghini Huracán GT3 Evo2':{image:'/atxracing/assets/gt3/10.jpg',credit:'Calreyn88 · CC BY-SA 4.0',source:'https://commons.wikimedia.org/wiki/File:2023_Lamborghini_Huracan_GT3_EVO_II.jpg'},
  'Lexus RC F GT3':{image:'/atxracing/assets/gt3/11.jpg',credit:'Tokumeigakarinoaoshima · CC BY-SA 4.0',source:'https://commons.wikimedia.org/wiki/File:Lexus_RC_F_GT3.jpg'},
  'McLaren 720S GT3':{image:'/atxracing/assets/gt3/12.jpg',credit:'MrWalkr · CC BY-SA 4.0',source:'https://commons.wikimedia.org/wiki/File:2019_McLaren_720S_GT3_FOS19.jpg'},
  'McLaren 720S GT3 Evo':{image:'/atxracing/assets/gt3/13.jpg',credit:'MarcelX42 · CC BY-SA 4.0',source:'https://commons.wikimedia.org/wiki/File:2024_6_Hours_of_Spa-Francorchamps_United_Autosports_McLaren_720S_GT3_Evo_No.59_(DSC05648).jpg'},
  'Mercedes-AMG GT3':{image:'/atxracing/assets/gt3/14.jpg',credit:'MrWalkr · CC BY-SA 4.0',source:'https://commons.wikimedia.org/wiki/File:2022_Mercedes-AMG_GT3_DK_Engineering.jpg'},
  'Nissan GT-R Nismo GT3 (2018)':{image:'/atxracing/assets/gt3/15.jpg',credit:'Thomas Harrison-Lord · CC BY 2.0',source:'https://commons.wikimedia.org/wiki/File:Blancpain_GT_Series,_Endurance,_Silverstone,_2018_(41509918365).jpg'},
  'Porsche 911 GT3 R (2018)':{image:'/atxracing/assets/gt3/16.jpg',credit:'Florian Volk · CC BY 2.0',source:'https://commons.wikimedia.org/wiki/File:-4_Porsche_911_GT3_R_-_Falken_Motorsports_(26267918217).jpg'},
  'Porsche 911 GT3 R':{image:'/atxracing/assets/gt3/17.jpg',credit:'Florian Volk · CC BY 2.0',source:'https://commons.wikimedia.org/wiki/File:-4_Porsche_911_GT3_R_-_Falken_Motorsports_(26267918217).jpg'},
 };
 const event=r=>Array.isArray(r?.event)?r.event[0]:r?.event||{};
 const competition=r=>{const e=event(r),title=(e.title_fr||e.title_en||'').toLowerCase();if(/discord|open\s*lobby|hotlaper|entrainement|entraînement/.test(title))return false;return ['DR','WGT','BATX','BA'].includes(String(e.competition_code||'').toUpperCase())||['daily_race','sprint','championship','endurance'].includes(e.event_type)||/\b(daily\s*race|dr|wgt|ball?ade\s*atx)\b/i.test(title)};
 const circuitKey=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
 const circuitPhoto=(key,name)=>{const all=typeof ATX_CIRCUITS==='object'?ATX_CIRCUITS:{};return all[key]?.image||all[circuitKey(name)]?.image||''};
 const sessionName=(code,lang)=>({FP:lang==='fr'?'Essais libres':'Free practice',Q:lang==='fr'?'Qualifications':'Qualifying',R:lang==='fr'?'Course':'Race'})[String(code||'').toUpperCase()]||code||'—';
 return {photos,event,competition,circuitPhoto,sessionName};
})();
