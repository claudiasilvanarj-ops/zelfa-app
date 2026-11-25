ALTER TABLE public.appointments ADD COLUMN household_task boolean NOT NULL DEFAULT false, ADD COLUMN duration_minutes integer NOT NULL DEFAULT 30, ADD COLUMN task_kind text;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_duration_positive CHECK (duration_minutes > 0 AND duration_minutes <= 720);
CREATE TABLE public.household_preferences (user_id uuid PRIMARY KEY DEFAULT auth.uid(), daily_minutes integer NOT NULL DEFAULT 120 CHECK (daily_minutes BETWEEN 15 AND 720), start_hour integer NOT NULL DEFAULT 9 CHECK (start_hour BETWEEN 0 AND 22), end_hour integer NOT NULL DEFAULT 18 CHECK (end_hour BETWEEN 1 AND 23), blocked_dates text[] NOT NULL DEFAULT '{}', CHECK (end_hour > start_hour));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_preferences TO authenticated;
GRANT ALL ON public.household_preferences TO service_role;
ALTER TABLE public.household_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY household_preferences_owner ON public.household_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX appointments_household_pending ON public.appointments(user_id, starts_at) WHERE household_task AND NOT done;