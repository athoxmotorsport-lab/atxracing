BEGIN;

-- Official ACC carModel IDs:
--   6  = Nissan GT-R Nismo GT3 (2018)
--   12 = Aston Martin V12 Vantage GT3
--   20 = Aston Martin V8 Vantage GT3 (2019)
-- The previous Nissan migration incorrectly used 12. Move any site entries
-- created with that row to the real Nissan ID before removing the bad row.
INSERT INTO public.atx_acc_cars(car_model_id,name,active,artwork_file)
VALUES (6,'Nissan GT-R Nismo GT3 (2018)',true,'nissan-gt-r-nismo-gt3-2018.webp')
ON CONFLICT(car_model_id) DO UPDATE
SET name=EXCLUDED.name,
    active=true,
    artwork_file=EXCLUDED.artwork_file;

UPDATE public.atx_race_entries
SET car_model_id=6
WHERE car_model_id=12
  AND EXISTS (
    SELECT 1
    FROM public.atx_acc_cars
    WHERE car_model_id=12
      AND name='Nissan GT-R Nismo GT3 (2018)'
  );

DELETE FROM public.atx_acc_cars
WHERE car_model_id=12
  AND name='Nissan GT-R Nismo GT3 (2018)';

COMMIT;
