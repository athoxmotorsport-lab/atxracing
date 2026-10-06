BEGIN;
-- Reclassify existing scores without changing laps, points, SAFE or results.
UPDATE public.driver_ratings
SET performance_class = CASE
  WHEN performance_score < 102 THEN 'alien'::public.performance_class
  WHEN performance_score < 104 THEN 'elite'::public.performance_class
  WHEN performance_score < 106 THEN 'pro'::public.performance_class
  WHEN performance_score < 108 THEN 'challenger'::public.performance_class
  ELSE 'rookie'::public.performance_class
END,
algorithm_version = 'acc-v3-five-levels'
WHERE performance_score IS NOT NULL;
COMMENT ON COLUMN public.driver_ratings.performance_score IS
  'Pace index in percent: Alien <102, Elite <104, Pro <106, Challenger <108, Rookie >=108; lower is faster.';
COMMIT;
