create table if not exists public.gt3_car_catalog (
 model_name text primary key,
 image_url text not null,
 source_url text not null,
 credit text not null,
 created_at timestamptz not null default now(),
 constraint gt3_image_https check (image_url ~ '^https://'),
 constraint gt3_source_https check (source_url ~ '^https://')
);
alter table public.gt3_car_catalog enable row level security;
revoke all on public.gt3_car_catalog from anon, authenticated;
insert into public.gt3_car_catalog (model_name,image_url,source_url,credit) values
 ('Porsche 992 GT3 R','https://upload.wikimedia.org/wikipedia/commons/1/10/AO_Racing_Porsche_992_GT3_R_No._77.jpg','https://commons.wikimedia.org/wiki/File:AO_Racing_Porsche_992_GT3_R_No._77.jpg','TaurusEmerald · CC BY-SA 4.0'),
 ('Aston Martin V8 Vantage GT3','https://upload.wikimedia.org/wikipedia/commons/1/15/2018_Aston_Martin_Vantage_GT3_FOS19.jpg','https://commons.wikimedia.org/wiki/File:2018_Aston_Martin_Vantage_GT3_FOS19.jpg','MrWalkr · CC BY-SA 4.0'),
 ('Audi R8 LMS GT3','https://upload.wikimedia.org/wikipedia/commons/7/72/2010_Audi_R8_LMS_GT3.jpg','https://commons.wikimedia.org/wiki/File:2010_Audi_R8_LMS_GT3.jpg','Calreyn88 · CC BY-SA 4.0'),
 ('Audi R8 LMS GT3 Evo 2','https://upload.wikimedia.org/wikipedia/commons/a/a6/Audi_R8_LMS_GT3_Evo_II_%282022%29_%2852565766187%29.jpg','https://commons.wikimedia.org/wiki/File:Audi_R8_LMS_GT3_Evo_II_(2022)_(52565766187).jpg','Charles · CC BY 2.0'),
 ('BMW M4 GT3','https://upload.wikimedia.org/wikipedia/commons/d/d3/2022_BMW_M4_GT3.jpg','https://commons.wikimedia.org/wiki/File:2022_BMW_M4_GT3.jpg','MrWalkr · CC BY-SA 4.0'),
 ('Ferrari 296 GT3','https://upload.wikimedia.org/wikipedia/commons/3/38/2023_Ferrari_296_GT3_Daytona_%28cropped%29.jpg','https://commons.wikimedia.org/wiki/File:2023_Ferrari_296_GT3_Daytona_(cropped).jpg','350z33 · CC BY-SA 4.0'),
 ('Ferrari 488 GT3','https://upload.wikimedia.org/wikipedia/commons/4/45/Ferrari_488_GT3.jpg','https://commons.wikimedia.org/wiki/File:Ferrari_488_GT3.jpg','Calreyn88 · CC BY-SA 4.0'),
 ('Ford Mustang GT3','https://upload.wikimedia.org/wikipedia/commons/1/11/2023_Ford_Mustang_GT3.jpg','https://commons.wikimedia.org/wiki/File:2023_Ford_Mustang_GT3.jpg','Calreyn88 · CC0'),
 ('Honda NSX GT3 Evo','https://upload.wikimedia.org/wikipedia/commons/6/6c/Honda_NSX_GT3_At_Bathurst_Esses_%2849485211948%29.jpg','https://commons.wikimedia.org/wiki/File:Honda_NSX_GT3_At_Bathurst_Esses_(49485211948).jpg','Ted Barrett · CC BY 2.0'),
 ('Lamborghini Huracán GT3 Evo2','https://upload.wikimedia.org/wikipedia/commons/2/2e/2023_Lamborghini_Huracan_GT3_EVO_II.jpg','https://commons.wikimedia.org/wiki/File:2023_Lamborghini_Huracan_GT3_EVO_II.jpg','Calreyn88 · CC BY-SA 4.0'),
 ('Lexus RC F GT3','https://upload.wikimedia.org/wikipedia/commons/8/82/Lexus_RC_F_GT3.jpg','https://commons.wikimedia.org/wiki/File:Lexus_RC_F_GT3.jpg','Tokumeigakarinoaoshima · CC BY-SA 4.0'),
 ('McLaren 720S GT3','https://upload.wikimedia.org/wikipedia/commons/7/76/2019_McLaren_720S_GT3_FOS19.jpg','https://commons.wikimedia.org/wiki/File:2019_McLaren_720S_GT3_FOS19.jpg','MrWalkr · CC BY-SA 4.0'),
 ('McLaren 720S GT3 Evo','https://upload.wikimedia.org/wikipedia/commons/2/21/2024_6_Hours_of_Spa-Francorchamps_United_Autosports_McLaren_720S_GT3_Evo_No.59_%28DSC05648%29.jpg','https://commons.wikimedia.org/wiki/File:2024_6_Hours_of_Spa-Francorchamps_United_Autosports_McLaren_720S_GT3_Evo_No.59_(DSC05648).jpg','MarcelX42 · CC BY-SA 4.0'),
 ('Mercedes-AMG GT3','https://upload.wikimedia.org/wikipedia/commons/2/2b/2022_Mercedes-AMG_GT3_DK_Engineering.jpg','https://commons.wikimedia.org/wiki/File:2022_Mercedes-AMG_GT3_DK_Engineering.jpg','MrWalkr · CC BY-SA 4.0'),
 ('Nissan GT-R Nismo GT3 (2018)','https://upload.wikimedia.org/wikipedia/commons/c/c7/Blancpain_GT_Series%2C_Endurance%2C_Silverstone%2C_2018_%2841509918365%29.jpg','https://commons.wikimedia.org/wiki/File:Blancpain_GT_Series,_Endurance,_Silverstone,_2018_(41509918365).jpg','Thomas Harrison-Lord · CC BY 2.0'),
 ('Porsche 911 GT3 R (2018)','https://upload.wikimedia.org/wikipedia/commons/4/4e/-4_Porsche_911_GT3_R_-_Falken_Motorsports_%2826267918217%29.jpg','https://commons.wikimedia.org/wiki/File:-4_Porsche_911_GT3_R_-_Falken_Motorsports_(26267918217).jpg','Florian Volk · CC BY 2.0'),
 ('Porsche 911 GT3 R','https://upload.wikimedia.org/wikipedia/commons/4/4e/-4_Porsche_911_GT3_R_-_Falken_Motorsports_%2826267918217%29.jpg','https://commons.wikimedia.org/wiki/File:-4_Porsche_911_GT3_R_-_Falken_Motorsports_(26267918217).jpg','Florian Volk · CC BY 2.0')
on conflict (model_name) do update set image_url=excluded.image_url, source_url=excluded.source_url, credit=excluded.credit;
