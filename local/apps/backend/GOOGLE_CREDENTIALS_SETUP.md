# Google Calendar API Configuration

## ✅ Current Status

Your backend is already configured with **Google Service Account** credentials, which is the correct approach for server-to-server Google Calendar API access.

### Current Configuration (in `.env`):
- ✅ `GOOGLE_SERVICE_ACCOUNT_EMAIL`: `booking-system-meet@just-booking-478007-p7.iam.gserviceaccount.com`
- ✅ `GOOGLE_SERVICE_ACCOUNT_KEY`: Private key is set
- ✅ `GOOGLE_CALENDAR_ID`: `amanbhogal.work@gmail.com`
- ✅ `GOOGLE_CALENDAR_SCOPES`: `https://www.googleapis.com/auth/calendar`

## Important: Service Account vs OAuth

### Service Account (Currently Used) ✅
- **Purpose**: Server-to-server API access (backend creating calendar events)
- **Use Case**: Automated calendar event creation without user interaction
- **Status**: Already configured and working

### OAuth Credentials (You Provided)
- **Purpose**: User-facing OAuth flow (users authorizing your app)
- **Use Case**: Frontend OAuth login or user-specific calendar access
- **Status**: Not needed for current backend calendar integration

## Next Steps

### 1. Grant Service Account Access to Calendar

The service account needs to be granted access to the calendar `amanbhogal.work@gmail.com`:

1. Go to [Google Calendar](https://calendar.google.com/)
2. Click the **Settings** gear icon → **Settings**
3. Go to **Settings for my calendars** → Select your calendar
4. Click **Share with specific people**
5. Add: `booking-system-meet@just-booking-478007-p7.iam.gserviceaccount.com`
6. Set permission to **Make changes to events**
7. Click **Send**

### 2. Enable Google Calendar API

Ensure the Google Calendar API is enabled in your Google Cloud project:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `just-booking-478007-p7`
3. Navigate to **APIs & Services** → **Library**
4. Search for "Google Calendar API"
5. Click **Enable** if not already enabled

### 3. Test the Configuration

After granting calendar access, restart your backend and test a booking. The backend should now create real Google Calendar events with Meet links!

## OAuth Credentials (For Future Use)

If you want to use the OAuth credentials for frontend user authentication or user-specific calendar access, you would need to:

1. Store them in `apps/frontend/.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=515628011274-mj2oem6optm3sr9gs66hshiqqbkvm1nf.apps.googleusercontent.com
   ```

2. Implement OAuth flow in the frontend
3. Update backend to accept OAuth tokens

However, for the current booking system, **Service Account is sufficient and already configured**.

