# Debugging Meet Link Creation

## Issue
Booking is created but Meet link is mock (`cNa-NNaN-NaN`) instead of real Google Meet link.

## Possible Causes

1. **Google Calendar API Authentication Failed**
   - Service account credentials not valid
   - Service account doesn't have calendar access
   - Calendar API not enabled

2. **Calendar Access Issue**
   - Service account not shared with calendar
   - Calendar ID mismatch

3. **API Error Being Silently Caught**
   - Check backend console logs for: "Google Calendar API failed, using mock meet link"

## Steps to Debug

1. **Check Backend Logs**
   Look for this warning in backend console:
   ```
   Google Calendar API failed, using mock meet link: [error details]
   ```

2. **Verify Service Account Access**
   - Go to Google Calendar
   - Share calendar `amanbhogal.work@gmail.com` with:
     `booking-system-meet@just-booking-478007-p7.iam.gserviceaccount.com`
   - Permission: "Make changes to events"

3. **Test Calendar API Directly**
   ```bash
   # Check if service account can access calendar
   # This requires testing with the service account credentials
   ```

4. **Check Environment Variables**
   ```bash
   cd apps/backend
   cat .env | grep GOOGLE
   ```

## Quick Fix

The meet service catches errors and falls back to mock links. Check the backend console output when creating a booking to see the actual error.

