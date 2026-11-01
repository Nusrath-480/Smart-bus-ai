-- Internal settings are for transport-office administrators only.
DROP POLICY "Signed-in read settings" ON public.system_settings;

-- RLS helpers must not expose other users' role or assignment information.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT _user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE OR REPLACE FUNCTION public.driver_assigned_to_bus(_user_id uuid, _bus_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT _user_id = auth.uid() AND public.has_role(_user_id, 'driver') AND EXISTS (
 SELECT 1 FROM public.bus_assignments a JOIN public.drivers d ON d.id = a.driver_id
 WHERE d.profile_id = _user_id AND a.bus_id = _bus_id AND a.is_active AND d.is_active
 AND a.start_date <= CURRENT_DATE AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE))
$$;
ALTER FUNCTION public.admin_exists() SET search_path = '';
ALTER FUNCTION public.claim_first_admin() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.notify_on_incident() SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role), public.driver_assigned_to_bus(uuid, uuid), public.admin_exists(), public.claim_first_admin(), public.handle_new_user(), public.notify_on_incident() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user(), public.notify_on_incident() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role), public.driver_assigned_to_bus(uuid, uuid), public.admin_exists(), public.claim_first_admin() TO authenticated, service_role;

ALTER POLICY "Driver inserts trip" ON public.trips WITH CHECK (
 public.driver_assigned_to_bus(auth.uid(), bus_id) AND status = 'in_progress' AND started_at IS NOT NULL AND ended_at IS NULL
 AND EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = driver_id AND d.profile_id = auth.uid()));
ALTER POLICY "Driver updates trip" ON public.trips USING (
 public.driver_assigned_to_bus(auth.uid(), bus_id) AND status = 'in_progress'
 AND EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = driver_id AND d.profile_id = auth.uid()))
 WITH CHECK (public.driver_assigned_to_bus(auth.uid(), bus_id)
 AND EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = driver_id AND d.profile_id = auth.uid()));

ALTER POLICY "Driver inserts location" ON public.bus_locations WITH CHECK (
 NOT is_demo AND public.driver_assigned_to_bus(auth.uid(), bus_id)
 AND EXISTS (SELECT 1 FROM public.trips t JOIN public.drivers d ON d.id=t.driver_id
 WHERE t.id=trip_id AND t.bus_id=bus_locations.bus_id AND t.status='in_progress' AND d.profile_id=auth.uid()));
ALTER POLICY "Driver inserts occupancy" ON public.occupancy_observations WITH CHECK (
 NOT is_demo AND source='driver' AND public.driver_assigned_to_bus(auth.uid(), bus_id)
 AND EXISTS (SELECT 1 FROM public.trips t JOIN public.drivers d ON d.id=t.driver_id
 WHERE t.id=trip_id AND t.bus_id=occupancy_observations.bus_id AND t.status='in_progress' AND d.profile_id=auth.uid()));

-- Only start/end state is mutable by a driver; administrators retain management access.
CREATE FUNCTION public.guard_driver_trip_update() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN
  IF NEW.bus_id IS DISTINCT FROM OLD.bus_id OR NEW.driver_id IS DISTINCT FROM OLD.driver_id
   OR NEW.route_id IS DISTINCT FROM OLD.route_id OR NEW.schedule_id IS DISTINCT FROM OLD.schedule_id
   OR NEW.direction IS DISTINCT FROM OLD.direction OR NEW.started_at IS DISTINCT FROM OLD.started_at
   OR NEW.created_at IS DISTINCT FROM OLD.created_at OR NEW.id IS DISTINCT FROM OLD.id THEN
   RAISE EXCEPTION 'Drivers cannot change trip ownership or history' USING ERRCODE='42501';
  END IF;
  IF NEW.status <> 'completed' OR NEW.ended_at IS NULL OR NEW.ended_at < OLD.started_at THEN
   RAISE EXCEPTION 'Drivers may only complete their active trip' USING ERRCODE='42501';
  END IF;
 END IF;
 RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.guard_driver_trip_update() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_driver_trip_update BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.guard_driver_trip_update();

-- Revoking driver access ends assignments in the same transaction.
CREATE FUNCTION public.revoke_driver_assignments() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF OLD.role='driver' THEN
  UPDATE public.bus_assignments SET is_active=false, end_date=CURRENT_DATE WHERE driver_id IN
   (SELECT id FROM public.drivers WHERE profile_id=OLD.user_id) AND is_active;
  UPDATE public.drivers SET is_active=false WHERE profile_id=OLD.user_id;
 END IF;
 RETURN OLD;
END; $$;
REVOKE EXECUTE ON FUNCTION public.revoke_driver_assignments() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER revoke_driver_assignments AFTER DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.revoke_driver_assignments();