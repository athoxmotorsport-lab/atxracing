update public.gt3_car_catalog as catalog
set image_url = photos.image_url
from (values
 ('Porsche 992 GT3 R', 'https://athoxmotorsport-lab.github.io/atxracing/assets/gt3/01.jpg'),
 ('Aston Martin V8 Vantage GT3', 'https://athoxmotorsport-lab.github.io/atxracing/assets/gt3/02.jpg'),
 ('Audi R8 LMS GT3', 'https://athoxmotorsport-lab.github.io/atxracing/assets/gt3/03.jpg'),
 ('Audi R8 LMS GT3 Evo 2', 'https://athoxmotorsport-lab.github.io/atxracing/assets/gt3/04.jpg'),
 ('BMW M4 GT3', 'https://athoxmotorsport-lab.github.io/atxracing/assets/gt3/05.jpg'),
 ('Ferrari 296 GT3', 'https://athoxmotorsport-lab.github.io/atxracing/assets/gt3/06.jpg'),
 ('Ferrari 488 GT3', 'https://athoxmotorsport-lab.github.io/atxracing/assets/gt3/07.jpg'),
 ('Ford Mustang GT3', 'https://athoxmotorsport-lab.github.io/atxracing/assets/gt3/08.jpg'),
 ('Honda NSX GT3 Evo', 'https://athoxmotorsport-lab.github.io/atxracing/assets/gt3/09.jpg'),
 ('Lamborghini Huracán GT3 Evo2', 'https://athoxmotorsport-lab.github.io/atxracing/assets/gt3/10.jpg'),
 ('Lexus RC F GT3', 'https://athoxmotorsport-lab.github.io/atxracing/assets/gt3/11.jpg'),
 ('McLaren 720S GT3', 'https://athoxmotorsport-lab.github.io/atxracing/assets/gt3/12.jpg'),
 ('McLaren 720S GT3 Evo', 'https://athoxmotorsport-lab.github.io/atxracing/assets/gt3/13.jpg'),
 ('Mercedes-AMG GT3', 'https://athoxmotorsport-lab.github.io/atxracing/assets/gt3/14.jpg'),
 ('Nissan GT-R Nismo GT3 (2018)', 'https://athoxmotorsport-lab.github.io/atxracing/assets/gt3/15.jpg'),
 ('Porsche 911 GT3 R (2018)', 'https://athoxmotorsport-lab.github.io/atxracing/assets/gt3/16.jpg'),
 ('Porsche 911 GT3 R', 'https://athoxmotorsport-lab.github.io/atxracing/assets/gt3/17.jpg')
) as photos(model_name,image_url)
where catalog.model_name = photos.model_name;
