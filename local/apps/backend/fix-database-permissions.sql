-- Fix Database Permissions Script
-- Run this as a PostgreSQL superuser (usually 'postgres' user)

-- Connect to the booking database
\c booking

-- Grant all privileges on all tables to the booking user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO booking;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO booking;

-- Grant privileges on future tables (so new tables get permissions automatically)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO booking;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO booking;

-- Verify permissions (optional - shows current grants)
SELECT 
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'booking'
ORDER BY table_name;

