update public.gt3_car_catalog as catalog
set image_url = 'https://athoxmotorsport-lab.github.io/atxracing/assets/gt3/' || artwork.file_name,
    source_url = 'https://athoxmotorsport-lab.github.io/atxracing/',
    credit = 'Création originale ATXRACING assistée par IA'
from (values
 ('Porsche 992 GT3 R', 'porsche-992-gt3-r.webp'),
 ('Aston Martin V8 Vantage GT3', 'aston-martin-v8-vantage-gt3.webp'),
 ('Audi R8 LMS GT3', 'audi-r8-lms-gt3.webp'),
 ('Audi R8 LMS GT3 Evo 2', 'audi-r8-lms-gt3-evo-2.webp'),
 ('BMW M4 GT3', 'bmw-m4-gt3.webp'),
 ('Ferrari 296 GT3', 'ferrari-296-gt3.webp'),
 ('Ferrari 488 GT3', 'ferrari-488-gt3.webp'),
 ('Ford Mustang GT3', 'ford-mustang-gt3.webp'),
 ('Honda NSX GT3 Evo', 'honda-nsx-gt3-evo.webp'),
 ('Lamborghini Huracán GT3 Evo2', 'lamborghini-huracan-gt3-evo2.webp'),
 ('Lexus RC F GT3', 'lexus-rc-f-gt3.webp'),
 ('McLaren 720S GT3', 'mclaren-720s-gt3.webp'),
 ('McLaren 720S GT3 Evo', 'mclaren-720s-gt3-evo.webp'),
 ('Mercedes-AMG GT3', 'mercedes-amg-gt3.webp'),
 ('Nissan GT-R Nismo GT3 (2018)', 'nissan-gt-r-nismo-gt3-2018.webp'),
 ('Porsche 911 GT3 R (2018)', 'porsche-911-gt3-r-2018.webp'),
 ('Porsche 911 GT3 R', 'porsche-911-gt3-r.webp')
) as artwork(model_name, file_name)
where catalog.model_name = artwork.model_name;
