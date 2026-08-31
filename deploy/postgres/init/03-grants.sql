GRANT CONNECT ON DATABASE nexus TO nexus_migrator;
GRANT CONNECT ON DATABASE nexus TO nexus_app;

GRANT USAGE, CREATE ON SCHEMA public TO nexus_migrator;
GRANT USAGE ON SCHEMA public TO nexus_app;

ALTER DEFAULT PRIVILEGES FOR ROLE nexus_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nexus_app;
ALTER DEFAULT PRIVILEGES FOR ROLE nexus_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO nexus_app;

-- Extensions may create schemas; allow migrator to use cron when present.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    GRANT USAGE ON SCHEMA cron TO nexus_migrator;
  END IF;
END $$;
