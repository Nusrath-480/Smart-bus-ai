CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  selected_role text;
BEGIN
  selected_role := NEW.raw_user_meta_data->>'account_type';

  IF selected_role IS NULL
     OR selected_role NOT IN ('student', 'parent') THEN
    selected_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    ),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;

  IF selected_role = 'parent' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.students (
      profile_id,
      roll_number,
      department,
      year_of_study,
      default_route_id,
      default_stop_id
    )
    VALUES (
      NEW.id,
      NULLIF(NEW.raw_user_meta_data->>'roll_number', ''),
      NULLIF(NEW.raw_user_meta_data->>'department', ''),
      NULLIF(NEW.raw_user_meta_data->>'year_of_study', '')::smallint,
      NULLIF(NEW.raw_user_meta_data->>'default_route_id', '')::uuid,
      NULLIF(NEW.raw_user_meta_data->>'default_stop_id', '')::uuid
    )
    ON CONFLICT (profile_id) DO UPDATE SET
      roll_number = EXCLUDED.roll_number,
      department = EXCLUDED.department,
      year_of_study = EXCLUDED.year_of_study,
      default_route_id = EXCLUDED.default_route_id,
      default_stop_id = EXCLUDED.default_stop_id;
  END IF;

  RETURN NEW;
END;
$$;