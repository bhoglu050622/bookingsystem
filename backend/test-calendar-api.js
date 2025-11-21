// Quick test script to verify Google Calendar API access
const { google } = require('googleapis');
const fs = require('fs');

// Load service account credentials
const serviceAccountEmail = 'booking-system-meet@just-booking-478007-p7.iam.gserviceaccount.com';
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDPXC0nMw3OO58C
7TkAd5d1Mr3Aw9qKizC0oCERwDN6X7Ufd9mCDD524jc4roKDPnau+puEi72gq/al
9PmYmiuFPRDimQnxNrHHhfBkX035SNlrMc5UT0+03U2rlSsFfSDgWidDaeHwbcLO
GdayhnVUmD9XYfXepTmggfXNBIoxTNq57KJ/cJGItLlaqT48wSbH+SfHm4EDnKce
tJ3rFS6PqNrXKnx9mUA7SNSPhBS3tL68qWjCazQ9ryIhoEwR8vdjf0lXmqHxYcrQ
/0sgF0QJs/9zGjr16DC370vMI5BwRKhmp3ad0giaivG5PMLCO7FIKNUnhNc07pqI
03dkuoIVAgMBAAECggEAFODoV/nTQkhtCI+nrWUdPirzgbEGtGvy5cD4y2+Bj2kL
FOXNpANFF9XLrxydHgdgTlqD5arnV0HxVgDuT7/4MVR2eoZjwqKZ8GfLTmPtNzQv
VhR//Ku2sBSXUTc2C3mvoX9aVDaZTgrTMkrWPAf/UNr6h7sglUAoJwHm5LN4EaIH
uAfcsX7kymLPxlthhtYWb8n0yaAZcstXQbzRnJ1qUcsuCJf8Vzeuj1kCprZF9Mkg
BIb2rwyHn7fawML7GOMCmTgp6Tj7c2bQSJxCBod3he2YgyqqR67qFt/0u5XyJdSW
bV9zzSMPcxj3DBKVQ0rUJvSdaZXVJ/5hxKhoKJZfYQKBgQDuiaXUG2VthspIZBMR
BXwSbVRjV+p/0iTRncJVMDWi6g7tsmBW05A4MHdbVIbdi4VEc1stc/uI88dV8DBT
NIRX8IAyVxa09mTPoTvxM0RyLNwZepXc10tv2CdldO1XjdNM6JFqrelL8rikA4Dn
SXUrYUDzr0No91q+535uwjHa9QKBgQDeij1U3E4q7mhTVicSVQL7Mz3Ut6k0Nox7
FCRsTsnmelDGYujlF2NxT9yASs+RACtLoRIhMlwNKNBgShUq7PcnTRpMtW5qrnRR
XQkXEd0RwzHxwRxPrJrhc28I/i31n07oLN0ATggecUdaU5se2q5u8Y3t70UT5KhN
dC/ndJvWoQKBgHJadq8aeyNorOzLXQCZ+oLy+rOtX/PrEE+VK6afN/dj8cgt7VVy
kv787RtRiF4JFthb3OgLZBihlXwza1dYI+Hsn+iCK5aRUH7hMtVM2JFLxDBKvjFi
3P0/SJOw3F9O1G9YRu43dVI9iBrIuzEl3A/xzauE5/IYMt62J7x9SF1JAoGAI1JJ
vchh18qTYHbSKMS5fml5rOOhxZnK3lYqGc6/mQdc/sAAOyxlKj0EwJAfNeKS/KQK
Hp7BoY0S1dWsWm3WJLTGMdqyNdiOucNMiA7byc/zg22lMrgwtQv/WawOW2f3vD4y
rbO08jAEpT+T5WfMO+u3HUbW7ftjAzgnylLl0UECgYEA3SzcXIWcxgUi8TsqTTj4
Xkip/dDA0BdThP8ssPfx0L+zup1Q5MA+KFpLE2n8B0Sz8VOphG6HG10LSm9DDqfO
Prdkuf3ntHRulc6e8yOd8A8RFCiojYztvKbsIEp2YuEA3XQT1CsA1eti3LJg1UfR
CVDnDojrQHwN6G44Qm8WX/Y=
-----END PRIVATE KEY-----`;

const calendarId = 'amanbhogal.work@gmail.com';

async function testCalendarAccess() {
  try {
    // Create JWT auth without subject (for shared calendar)
    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // Test: List calendars
    console.log('Testing calendar access...');
    const calendars = await calendar.calendarList.list();
    console.log('✅ Successfully accessed calendars:', calendars.data.items?.length || 0);

    // Test: Get specific calendar
    console.log(`\nTesting access to calendar: ${calendarId}`);
    const calendarInfo = await calendar.calendars.get({ calendarId });
    console.log('✅ Calendar found:', calendarInfo.data.summary);

    // Test: Create a test event
    console.log('\nTesting event creation...');
    const testEvent = {
      summary: 'Test Event from Service Account',
      start: {
        dateTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
        timeZone: 'Asia/Kolkata',
      },
      conferenceData: {
        createRequest: {
          requestId: `test-${Date.now()}`,
          conferenceSolutionKey: { type: 'eventHangout' },
        },
      },
    };

    const event = await calendar.events.insert({
      calendarId,
      requestBody: testEvent,
      conferenceDataVersion: 1,
    });

    console.log('✅ Event created successfully!');
    console.log('Event ID:', event.data.id);
    console.log('Meet Link:', event.data.conferenceData?.entryPoints?.[0]?.uri || event.data.hangoutLink);

    // Clean up: Delete test event
    await calendar.events.delete({ calendarId, eventId: event.data.id });
    console.log('\n✅ Test event deleted');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error.response?.data || error);
  }
}

testCalendarAccess();

