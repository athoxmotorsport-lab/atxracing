-- Commit this enum addition before recalculating rows with the new value.
ALTER TYPE public.performance_class ADD VALUE IF NOT EXISTS 'challenger' AFTER 'rookie';
