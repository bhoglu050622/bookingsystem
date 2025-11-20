# Grant Database Permissions

## Quick Fix

You need to run these SQL commands as a database superuser. Here are your options:

### Option A: Using psql command line

1. Connect to PostgreSQL as a superuser (usually `postgres` user):
   ```bash
   psql -U postgres -d booking
   ```
   
   Or if your superuser has a different name:
   ```bash
   psql -U your_superuser_name -d booking
   ```

2. Once connected, run these commands:
   ```sql
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO booking;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO booking;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO booking;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO booking;
   ```

3. Exit psql:
   ```sql
   \q
   ```

### Option B: Using pgAdmin or another GUI tool

1. Connect to your PostgreSQL database
2. Open a SQL query window
3. Select the `booking` database
4. Run the SQL commands from Option A above

### Option C: If you're the database owner

If you created the database yourself, you might already have permissions. Try running the seed script directly:

```bash
cd apps/backend
npm run seed:scraped
```

## After Granting Permissions

Once permissions are fixed, run the seed script:

```bash
cd apps/backend
npm run seed:scraped
```

This will create:
- Instructor records with IDs matching your hardcoded ones (`scraped-0`, `scraped-1`, etc.)
- Availability slots for the next 30 days (6 slots per day)

## Verify It Worked

After seeding, test the API:
```bash
curl 'http://localhost:3001/api/availability/instructor/scraped-0?targetDate=2025-11-14'
```

You should see slots in the response!

