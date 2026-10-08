BEGIN;
ALTER TABLE public.atx_acc_cars ADD COLUMN IF NOT EXISTS artwork_file text;
ALTER TABLE public.atx_acc_cars ADD CONSTRAINT atx_acc_cars_artwork_file_check
 CHECK (artwork_file IS NULL OR artwork_file ~ '^[a-z0-9-]+\.webp$');
-- ACC model IDs cross-checked against ACCWeb public/src/data/cars.js.
-- Newest GT3 evolution of each supported modern marque; older models stay untouched.
INSERT INTO public.atx_acc_cars(car_model_id,name,artwork_file) VALUES
 (20,'Aston Martin V8 Vantage GT3','aston-martin-v8-vantage-gt3.webp'),
 (21,'Honda NSX GT3 Evo','honda-nsx-gt3-evo.webp'),
 (25,'Mercedes-AMG GT3 Evo (2020)','mercedes-amg-gt3.webp'),
 (30,'BMW M4 GT3','bmw-m4-gt3.webp'),
 (31,'Audi R8 LMS GT3 Evo 2','audi-r8-lms-gt3-evo-2.webp'),
 (32,'Ferrari 296 GT3','ferrari-296-gt3.webp'),
 (33,'Lamborghini Huracán GT3 Evo2','lamborghini-huracan-gt3-evo2.webp'),
 (34,'Porsche 992 GT3 R','porsche-992-gt3-r.webp'),
 (35,'McLaren 720S GT3 Evo','mclaren-720s-gt3-evo.webp'),
 (36,'Ford Mustang GT3','ford-mustang-gt3.webp')
ON CONFLICT(car_model_id) DO UPDATE SET name=EXCLUDED.name,artwork_file=EXCLUDED.artwork_file;
COMMIT;
