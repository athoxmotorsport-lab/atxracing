BEGIN;

-- ACC carModel 12 is the legacy Aston Martin V12. Keep it out of the modern
-- registration picker while making its canonical name and artwork available
-- to imported results, participant cards and historical driver profiles.
INSERT INTO public.atx_acc_cars(car_model_id,name,active,artwork_file)
VALUES (12,'Aston Martin V12 Vantage GT3',false,'aston-martin-v12-vantage-gt3.webp')
ON CONFLICT(car_model_id) DO UPDATE
SET name=EXCLUDED.name,
    active=false,
    artwork_file=EXCLUDED.artwork_file;

INSERT INTO public.gt3_car_catalog(model_name,image_url,source_url,credit)
VALUES (
  'Aston Martin V12 Vantage GT3',
  'https://athoxmotorsport-lab.github.io/atxracing/assets/gt3/aston-martin-v12-vantage-gt3.webp',
  'https://athoxmotorsport-lab.github.io/atxracing/',
  'Création originale ATXRACING assistée par IA'
)
ON CONFLICT(model_name) DO UPDATE
SET image_url=EXCLUDED.image_url,
    source_url=EXCLUDED.source_url,
    credit=EXCLUDED.credit;

COMMIT;
