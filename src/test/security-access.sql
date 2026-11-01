-- Read-only integration assertions; every result must be true against the current database.
SELECT 'Anonymous cannot execute privileged helpers' AS rule,
 NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.prosecdef AND has_function_privilege('anon',p.oid,'EXECUTE')) AS passed
UNION ALL
SELECT 'Client roles cannot execute lifecycle triggers',
 NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN ('handle_new_user','notify_on_incident','revoke_driver_assignments')
 AND has_function_privilege('authenticated',p.oid,'EXECUTE'))
UNION ALL
SELECT 'Internal settings have only the administrator policy',
 (SELECT count(*)=1 AND bool_and(policyname='Admins manage system_settings')
 FROM pg_policies WHERE schemaname='public' AND tablename='system_settings')
UNION ALL
SELECT 'All application tables enforce row-level security',
 NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity);