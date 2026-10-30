CREATE OR REPLACE FUNCTION public.notify_on_incident()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  bus_label text;
  bus_route uuid;
BEGIN
  SELECT bus_number, route_id INTO bus_label, bus_route FROM public.buses WHERE id = NEW.bus_id;
  INSERT INTO public.notifications (user_id, title, body, kind)
  SELECT ur.user_id,
         initcap(NEW.type::text) || ' reported' || COALESCE(' on Bus ' || bus_label, ''),
         left(COALESCE(NEW.description, 'Severity: ' || NEW.severity::text), 1000),
         'incident'
  FROM public.user_roles ur WHERE ur.role = 'admin';

  IF bus_route IS NOT NULL AND NEW.type IN ('breakdown', 'delay', 'accident') THEN
    INSERT INTO public.notifications (user_id, title, body, kind)
    SELECT s.profile_id,
           'Bus ' || bus_label || ' is delayed',
           CASE NEW.type WHEN 'breakdown' THEN 'Your bus has reported a breakdown. The transport office has been alerted.'
                         WHEN 'accident' THEN 'Your bus has reported an incident. The transport office has been alerted.'
                         ELSE 'Your bus is running late.' END,
           'delay'
    FROM public.students s WHERE s.default_route_id = bus_route;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_incident_notify AFTER INSERT ON public.incidents
FOR EACH ROW EXECUTE FUNCTION public.notify_on_incident();