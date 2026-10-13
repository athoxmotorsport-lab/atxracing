BEGIN;
-- ACC model 12 is the 2018 GT-R; model 6 is the older 2015 car.
-- Reuse the existing white artwork from the general ACC catalogue.
INSERT INTO public.atx_acc_cars(car_model_id,name,active,artwork_file)
VALUES (12,'Nissan GT-R Nismo GT3 (2018)',true,'nissan-gt-r-nismo-gt3-2018.webp')
ON CONFLICT(car_model_id) DO UPDATE
SET name=EXCLUDED.name,active=true,artwork_file=EXCLUDED.artwork_file;
COMMIT;
