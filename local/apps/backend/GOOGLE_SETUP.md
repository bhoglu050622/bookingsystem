# Google Calendar API Setup

## Current Configuration

The backend uses **Google Service Account** authentication (not OAuth) for creating calendar events. This is the recommended approach for server-to-server API access.

## Option 1: Use Service Account (Recommended)

1. **Get Service Account Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select project: `just-booking-478007-p7`
   - Navigate to "IAM & Admin" > "Service Accounts"
   - Create or select a service account
   - Create a JSON key and download it

2. **Configure Environment Variables:**

   Add to `apps/backend/.env`:
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@just-booking-478007-p7.iam.gserviceaccount.com
   GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_CALENDAR_ID=primary
   GOOGLE_CALENDAR_SCOPES=https://www.googleapis.com/auth/calendar
   ```

3. **Extract from JSON file:**

   If you have a service account JSON file, extract:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_SERVICE_ACCOUNT_KEY` (keep the `\n` characters)

## Option 2: Use OAuth Credentials (Requires Code Changes)

The OAuth credentials you provided require implementing an OAuth flow. Currently, the backend only supports Service Account authentication.

To use OAuth, you would need to:
1. Implement OAuth 2.0 authorization flow
2. Store refresh tokens in the database
3. Use refresh tokens to get access tokens
4. Update `meet.service.ts` to use OAuth client instead of JWT

## Quick Setup with Service Account

If you have the service account JSON file (`just-booking-478007-p7-99382e3e3be3.json`), I can help extract the credentials and configure them.

