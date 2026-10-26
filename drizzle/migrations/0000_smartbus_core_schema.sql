
-- ===== Enums =====
CREATE TYPE public.app_role AS ENUM ('admin', 'driver', 'student');
CREATE TYPE public.bus_status AS ENUM ('active', 'maintenance', 'inactive');
CREATE TYPE public.trip_direction AS ENUM ('to_college', 'from_college');
CREATE TYPE public.trip_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.incident_type AS ENUM ('breakdown', 'emergency', 'accident', 'delay', 'other');
CREATE TYPE public.incident_status AS ENUM ('open', 'acknowledged', 'resolved');
CREATE TYPE public.severity_level AS ENUM ('low', 'medium', 'high', 'critical');

-- ===== Helpers =====
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ===== profiles =====
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '' CHECK (char_length(full_name) <= 120),
  email text,
  phone text CHECK (phone IS NULL OR char_length(phone) <= 20),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== user_roles =====
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete roles" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND NOT (user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Read own profile or admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ===== routes & stops =====
CREATE TABLE public.routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (char_length(code) BETWEEN 1 AND 20),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_routes_updated BEFORE UPDATE ON public.routes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.route_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  sequence int NOT NULL CHECK (sequence >= 1),
  latitude double precision CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision CHECK (longitude BETWEEN -180 AND 180),
  scheduled_offset_minutes int CHECK (scheduled_offset_minutes >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (route_id, sequence)
);
CREATE INDEX idx_route_stops_route ON public.route_stops(route_id);
CREATE TRIGGER trg_stops_updated BEFORE UPDATE ON public.route_stops FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== buses =====
CREATE TABLE public.buses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_number text NOT NULL UNIQUE CHECK (char_length(bus_number) BETWEEN 1 AND 20),
  registration_number text UNIQUE CHECK (registration_number IS NULL OR char_length(registration_number) <= 30),
  capacity int NOT NULL CHECK (capacity BETWEEN 1 AND 200),
  status public.bus_status NOT NULL DEFAULT 'active',
  route_id uuid REFERENCES public.routes(id) ON DELETE SET NULL,
  is_demo boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_buses_route ON public.buses(route_id);
CREATE TRIGGER trg_buses_updated BEFORE UPDATE ON public.buses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== drivers & students =====
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_number text CHECK (license_number IS NULL OR char_length(license_number) <= 40),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_drivers_updated BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  roll_number text UNIQUE CHECK (roll_number IS NULL OR char_length(roll_number) <= 30),
  department text CHECK (department IS NULL OR char_length(department) <= 80),
  year_of_study smallint CHECK (year_of_study IS NULL OR year_of_study BETWEEN 1 AND 6),
  default_route_id uuid REFERENCES public.routes(id) ON DELETE SET NULL,
  default_stop_id uuid REFERENCES public.route_stops(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== assignments, schedules, trips =====
CREATE TABLE public.bus_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  route_id uuid REFERENCES public.routes(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  start_date date NOT NULL DEFAULT current_date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_assign_bus ON public.bus_assignments(bus_id);
CREATE INDEX idx_assign_driver ON public.bus_assignments(driver_id);
CREATE UNIQUE INDEX uq_active_assignment_bus ON public.bus_assignments(bus_id) WHERE is_active;
CREATE TRIGGER trg_assign_updated BEFORE UPDATE ON public.bus_assignments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  bus_id uuid REFERENCES public.buses(id) ON DELETE SET NULL,
  direction public.trip_direction NOT NULL DEFAULT 'to_college',
  departure_time time NOT NULL,
  days_of_week smallint[] NOT NULL DEFAULT '{1,2,3,4,5,6}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_schedules_route ON public.schedules(route_id);
CREATE TRIGGER trg_schedules_updated BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES public.schedules(id) ON DELETE SET NULL,
  bus_id uuid NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  route_id uuid REFERENCES public.routes(id) ON DELETE SET NULL,
  direction public.trip_direction NOT NULL DEFAULT 'to_college',
  status public.trip_status NOT NULL DEFAULT 'scheduled',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_trips_bus ON public.trips(bus_id, created_at DESC);
CREATE TRIGGER trg_trips_updated BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== telemetry & predictions =====
CREATE TABLE public.bus_locations (
  id bigserial PRIMARY KEY,
  bus_id uuid NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  speed_kmh real CHECK (speed_kmh IS NULL OR speed_kmh >= 0),
  heading real,
  is_demo boolean NOT NULL DEFAULT false,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_locations_bus_time ON public.bus_locations(bus_id, recorded_at DESC);

CREATE TABLE public.occupancy_observations (
  id bigserial PRIMARY KEY,
  bus_id uuid NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  stop_id uuid REFERENCES public.route_stops(id) ON DELETE SET NULL,
  passenger_count int NOT NULL CHECK (passenger_count >= 0),
  source text NOT NULL DEFAULT 'driver',
  is_demo boolean NOT NULL DEFAULT false,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_occ_obs_bus_time ON public.occupancy_observations(bus_id, recorded_at DESC);

CREATE TABLE public.occupancy_predictions (
  id bigserial PRIMARY KEY,
  bus_id uuid NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  stop_id uuid REFERENCES public.route_stops(id) ON DELETE SET NULL,
  predicted_count int NOT NULL CHECK (predicted_count >= 0),
  confidence real CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  model_version text,
  is_demo boolean NOT NULL DEFAULT false,
  predicted_for timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_occ_pred_bus ON public.occupancy_predictions(bus_id, predicted_for DESC);

CREATE TABLE public.eta_predictions (
  id bigserial PRIMARY KEY,
  bus_id uuid NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  stop_id uuid NOT NULL REFERENCES public.route_stops(id) ON DELETE CASCADE,
  predicted_arrival timestamptz NOT NULL,
  confidence real CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  model_version text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_eta_bus_stop ON public.eta_predictions(bus_id, stop_id, created_at DESC);

CREATE TABLE public.alternative_recommendations (
  id bigserial PRIMARY KEY,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  original_bus_id uuid REFERENCES public.buses(id) ON DELETE CASCADE,
  recommended_bus_id uuid NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  stop_id uuid REFERENCES public.route_stops(id) ON DELETE SET NULL,
  reason text,
  score real,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.route_deviation_events (
  id bigserial PRIMARY KEY,
  bus_id uuid NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  latitude double precision,
  longitude double precision,
  distance_from_route_m real,
  kind text NOT NULL DEFAULT 'deviation',
  is_demo boolean NOT NULL DEFAULT false,
  detected_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

-- ===== notifications, incidents, settings, audit =====
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(title) <= 160),
  body text CHECK (body IS NULL OR char_length(body) <= 1000),
  kind text NOT NULL DEFAULT 'info',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);

CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid REFERENCES public.buses(id) ON DELETE SET NULL,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  reported_by uuid NOT NULL,
  type public.incident_type NOT NULL,
  severity public.severity_level NOT NULL DEFAULT 'medium',
  description text CHECK (description IS NULL OR char_length(description) <= 2000),
  latitude double precision,
  longitude double precision,
  status public.incident_status NOT NULL DEFAULT 'open',
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_incidents_status ON public.incidents(status, created_at DESC);
CREATE TRIGGER trg_incidents_updated BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.audit_logs (
  id bigserial PRIMARY KEY,
  actor_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_time ON public.audit_logs(created_at DESC);

-- ===== Driver helper =====
CREATE OR REPLACE FUNCTION public.driver_assigned_to_bus(_user_id uuid, _bus_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bus_assignments a JOIN public.drivers d ON d.id = a.driver_id
    WHERE d.profile_id = _user_id AND a.bus_id = _bus_id AND a.is_active AND d.is_active
  )
$$;

-- ===== Grants =====
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.routes, public.route_stops, public.buses, public.drivers, public.students,
  public.bus_assignments, public.schedules, public.trips, public.bus_locations,
  public.occupancy_observations, public.occupancy_predictions, public.eta_predictions,
  public.alternative_recommendations, public.route_deviation_events, public.notifications,
  public.incidents, public.system_settings, public.audit_logs
TO authenticated;
GRANT ALL ON
  public.routes, public.route_stops, public.buses, public.drivers, public.students,
  public.bus_assignments, public.schedules, public.trips, public.bus_locations,
  public.occupancy_observations, public.occupancy_predictions, public.eta_predictions,
  public.alternative_recommendations, public.route_deviation_events, public.notifications,
  public.incidents, public.system_settings, public.audit_logs
TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- ===== RLS =====
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eta_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternative_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_deviation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin full access everywhere
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['routes','route_stops','buses','drivers','students','bus_assignments','schedules','trips','bus_locations','occupancy_observations','occupancy_predictions','eta_predictions','alternative_recommendations','route_deviation_events','notifications','incidents','system_settings','audit_logs']
  LOOP
    EXECUTE format('CREATE POLICY "Admins manage %1$s" ON public.%1$I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))', t);
  END LOOP;
END $$;

-- Operational (non-private) data readable by signed-in users
CREATE POLICY "Signed-in read routes" ON public.routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in read stops" ON public.route_stops FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in read buses" ON public.buses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in read schedules" ON public.schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in read trips" ON public.trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in read locations" ON public.bus_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in read occupancy" ON public.occupancy_observations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in read occ preds" ON public.occupancy_predictions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in read eta" ON public.eta_predictions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in read settings" ON public.system_settings FOR SELECT TO authenticated USING (true);

-- Drivers / students: own rows
CREATE POLICY "Driver reads own row" ON public.drivers FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Driver reads own assignments" ON public.bus_assignments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = driver_id AND d.profile_id = auth.uid()));
CREATE POLICY "Student reads own row" ON public.students FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Student updates own row" ON public.students FOR UPDATE TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- Drivers write telemetry for assigned buses
CREATE POLICY "Driver inserts location" ON public.bus_locations FOR INSERT TO authenticated
  WITH CHECK (public.driver_assigned_to_bus(auth.uid(), bus_id));
CREATE POLICY "Driver inserts occupancy" ON public.occupancy_observations FOR INSERT TO authenticated
  WITH CHECK (public.driver_assigned_to_bus(auth.uid(), bus_id));
CREATE POLICY "Driver inserts trip" ON public.trips FOR INSERT TO authenticated
  WITH CHECK (public.driver_assigned_to_bus(auth.uid(), bus_id));
CREATE POLICY "Driver updates trip" ON public.trips FOR UPDATE TO authenticated
  USING (public.driver_assigned_to_bus(auth.uid(), bus_id));

-- Recommendations: student's own
CREATE POLICY "Student reads own recs" ON public.alternative_recommendations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.profile_id = auth.uid()));

-- Notifications: own
CREATE POLICY "Read own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Incidents: reporters see their own; drivers report for assigned buses
CREATE POLICY "Read own incidents" ON public.incidents FOR SELECT TO authenticated USING (reported_by = auth.uid());
CREATE POLICY "Report incident" ON public.incidents FOR INSERT TO authenticated
  WITH CHECK (reported_by = auth.uid() AND (bus_id IS NULL OR public.driver_assigned_to_bus(auth.uid(), bus_id) OR public.has_role(auth.uid(), 'student')));

-- ===== Signup: profile + student role =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student') ON CONFLICT DO NOTHING;
  INSERT INTO public.students (profile_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== One-time first-admin claim (only works while no admin exists) =====
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;

CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  PERFORM pg_advisory_xact_lock(424242);
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin');
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id) VALUES (auth.uid(), 'claim_first_admin', 'user_roles', auth.uid()::text);
  RETURN true;
END; $$;
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

-- ===== Realtime =====
ALTER PUBLICATION supabase_realtime ADD TABLE public.bus_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

INSERT INTO public.system_settings (key, value) VALUES
  ('overcrowding_threshold', '{"percent": 90}'::jsonb),
  ('demo_mode', '{"enabled": true}'::jsonb);
