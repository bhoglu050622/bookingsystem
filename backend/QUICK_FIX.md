# Quick Fix: Grant Database Permissions

## Step 1: Connect to PostgreSQL as Superuser

Try one of these commands (depending on your PostgreSQL setup):

```bash
# Option 1: If you have a 'postgres' superuser
psql -U postgres -d booking

# Option 2: If your macOS user has PostgreSQL access
psql -d booking

# Option 3: If you installed PostgreSQL via Homebrew
psql postgres
# Then: \c booking
```

## Step 2: Run These SQL Commands

Once connected, copy and paste these commands:

```sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO booking;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO booking;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO booking;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO booking;
\q
```

## Step 3: Seed the Database

After granting permissions, run:

```bash
cd apps/backend
npm run seed:scraped
```

This will create instructors and availability slots!

## Step 4: Verify

Refresh your frontend page - you should now see availability slots! 🎉

## Troubleshooting

If you can't find a superuser:
1. Check your PostgreSQL installation method
2. On macOS with Homebrew: `psql postgres` usually works
3. You might need to create a superuser first

If you're stuck, you can temporarily use the mock API by setting `NEXT_PUBLIC_USE_MOCK_API=true` in `apps/frontend/.env.local`

