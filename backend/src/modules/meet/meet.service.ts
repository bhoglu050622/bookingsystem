import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Booking, MeetCredentialType } from '@prisma/client';
import { google } from 'googleapis';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MeetQueueService } from './meet.queue.service';
import { GoogleOAuthService } from '../google-oauth/google-oauth.service';

type BookingWithMeetContext = Booking & {
  slot: {
    startTime: Date;
    endTime: Date;
    timezone: string | null;
  };
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  instructor: {
    displayName: string;
    meetCredential: {
      calendarId: string | null;
      clientEmail: string | null;
      privateKey: string | null;
      scopes: string | null;
      type: MeetCredentialType;
    } | null;
  };
};

@Injectable()
export class MeetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => MeetQueueService))
    private readonly meetQueueService: MeetQueueService,
    @Inject(forwardRef(() => GoogleOAuthService))
    private readonly googleOAuthService: GoogleOAuthService,
  ) {}

  async healthCheck() {
    const [meetings, metrics] = await Promise.all([
      this.prisma.booking.count({
        where: {
          meetLink: {
            not: null,
          },
        },
      }),
      this.meetQueueService.getQueueMetrics(),
    ]);
    return {
      status: 'ok',
      meetingsWithLinks: meetings,
      queue: metrics,
    };
  }

  async createMeetForBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        instructor: {
          include: {
            meetCredential: true,
          },
        },
        slot: true,
        user: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found for Meet creation');
    }

    if (!booking.slot) {
      throw new NotFoundException('Slot not found for booking');
    }

    // Priority: 1. OAuth tokens (for real Meet links), 2. Service account, 3. Mock
    const hasOAuth = await this.googleOAuthService.hasOAuthTokens(booking.userId);
    
    if (hasOAuth) {
      // Use OAuth tokens - this can create real Meet links for regular Google accounts
      try {
        const oauthClient = await this.googleOAuthService.getAuthClient(booking.userId);
        if (!oauthClient) {
          throw new Error('Failed to get OAuth client');
        }
        
        const calendar = google.calendar({ version: 'v3', auth: oauthClient });
        const calendarId = this.getFallbackCalendarId();
        
        const requestBody = this.buildCalendarEventPayload(
          booking as BookingWithMeetContext,
        );

        const response = await calendar.events.insert({
          calendarId,
          requestBody,
          conferenceDataVersion: 1,
          supportsAttachments: false,
        });

        const event = response.data;
        const meetLink =
          event.conferenceData?.entryPoints?.find(
            (entry) => entry.entryPointType === 'video' && entry.uri,
          )?.uri ??
          event.conferenceData?.entryPoints?.find((entry) => entry.uri)?.uri ??
          event.hangoutLink ??
          null;

        const existingMetadata = (booking.metadata ?? {}) as Record<string, unknown>;
        const metadata = {
          ...existingMetadata,
          meet: {
            provider: 'google-oauth',
            eventId: event.id,
            calendarId,
            createdAt: new Date().toISOString(),
          },
        };

        await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            meetEventId: event.id ?? null,
            meetLink,
            metadata,
          },
        });

        return {
          bookingId: booking.id,
          eventId: event.id,
          meetLink,
        };
      } catch (oauthError: any) {
        console.error('OAuth calendar creation failed, falling back to service account:', oauthError.message);
        // Fall through to service account or mock
      }
    }

    // Fallback to service account or mock
    const googleEmail = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const googleKey = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_KEY');
    const credential = booking.instructor?.meetCredential;

    const hasGoogleConfig = 
      (credential?.clientEmail && credential?.privateKey) ||
      (googleEmail && googleKey);

    if (!hasGoogleConfig) {
      // Generate mock meet link for demo
      if (!booking.slot) {
        throw new NotFoundException('Slot not found for booking');
      }
      return this.createMockMeetLink(booking as BookingWithMeetContext);
    }

    try {
      // Build auth with calendar owner email as subject for impersonation
      const calendarId = credential?.calendarId ?? this.getFallbackCalendarId();
      const auth = this.buildGoogleAuth(credential ?? undefined, calendarId);
      const calendar = google.calendar({ version: 'v3', auth });

            if (!booking.slot) {
              throw new NotFoundException('Slot not found for booking');
            }
            const requestBody = this.buildCalendarEventPayload(
              booking as BookingWithMeetContext,
            );

      // Try creating event with Meet link
      // For regular Google accounts, service accounts may not be able to create Meet links
      // So we'll try with conferenceData first, and if that fails, create without it
      let response;
      try {
        response = await calendar.events.insert({
        calendarId: credential?.calendarId ?? this.getFallbackCalendarId(),
        requestBody,
        conferenceDataVersion: 1,
          supportsAttachments: false,
        });
      } catch (conferenceError: any) {
        // If conference creation fails, try creating event without conference data
        // Then add Meet link via PATCH
        if (conferenceError.message?.includes('conference') || conferenceError.code === 400) {
          console.warn('Failed to create event with conference, trying without conference data:', conferenceError.message);
          const eventWithoutConference: any = { ...requestBody };
          delete eventWithoutConference.conferenceData;
          
          response = await calendar.events.insert({
            calendarId: credential?.calendarId ?? this.getFallbackCalendarId(),
            requestBody: eventWithoutConference,
        supportsAttachments: false,
      });
          
          // Try to add Meet link via PATCH
          try {
            const updatedEvent = await calendar.events.patch({
              calendarId: credential?.calendarId ?? this.getFallbackCalendarId(),
              eventId: response.data.id!,
              requestBody: {
                conferenceData: {
                  createRequest: {
                    requestId: `meet-${booking.id}-${Date.now()}`,
                    conferenceSolutionKey: {
                      type: 'hangoutsMeet',
                    },
                  },
                },
              },
              conferenceDataVersion: 1,
            });
            response.data = updatedEvent.data;
          } catch (patchError) {
            console.warn('Could not add Meet link via PATCH, event created without Meet link:', patchError);
          }
        } else {
          throw conferenceError;
        }
      }

      const event = response.data;
      // Extract meet link: prefer video entry point, then any entry point, then hangoutLink (legacy)
      const meetLink =
        event.conferenceData?.entryPoints?.find(
          (entry) => entry.entryPointType === 'video' && entry.uri,
        )?.uri ??
        event.conferenceData?.entryPoints?.find((entry) => entry.uri)?.uri ??
        event.hangoutLink ??
        null;

      const existingMetadata = (booking.metadata ?? {}) as Record<
        string,
        unknown
      >;
      const metadata = {
        ...existingMetadata,
        meet: {
          provider: 'google',
          eventId: event.id,
          calendarId: credential?.calendarId ?? this.getFallbackCalendarId(),
          createdAt: new Date().toISOString(),
        },
      };

      await this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          meetEventId: event.id ?? null,
          meetLink,
          metadata,
        },
      });

      return {
        bookingId: booking.id,
        eventId: event.id,
        meetLink,
      };
           } catch (error: any) {
             // If Google API fails, fall back to mock link
             const errorMessage = error instanceof Error ? error.message : String(error);
             const errorCode = error?.code || error?.response?.status;
             
             console.error('Google Calendar API failed, using mock meet link:', errorMessage);
             console.error('Error details:', {
               message: errorMessage,
               code: errorCode,
               bookingId: booking.id,
               calendarId: credential?.calendarId ?? this.getFallbackCalendarId(),
               serviceAccountEmail: this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
             });
             
             // For regular Google accounts (not Workspace), service accounts cannot create Meet links
             // This requires OAuth user authentication or Workspace domain-wide delegation
             if (errorMessage?.includes('conference') || errorCode === 400) {
               console.warn('⚠️  Service accounts cannot create Google Meet links for regular Google accounts.');
               console.warn('   To create real Meet links, you need either:');
               console.warn('   1. Google Workspace with domain-wide delegation, OR');
               console.warn('   2. OAuth user authentication (user must authorize the app)');
             }
             
             if (!booking.slot) {
               throw new NotFoundException('Slot not found for booking');
             }
             return this.createMockMeetLink(booking as BookingWithMeetContext);
           }
  }

  private async createMockMeetLink(booking: BookingWithMeetContext) {
    // Generate a unique Google Meet link with proper format: xxx-yyyy-zzz
    // Format: xxx-yyyy-zzz (3-4-3 characters)
    const generateUniqueMeetCode = (bookingId: string) => {
      // Use booking ID (UUID) to create a deterministic but unique code
      // Remove hyphens and convert to base36 for shorter representation
      const idWithoutHyphens = bookingId.replace(/-/g, '');
      
      // Create a hash-like string from the booking ID
      let hash = '';
      for (let i = 0; i < idWithoutHyphens.length; i++) {
        const char = idWithoutHyphens[i];
        // Convert hex to a number, then to base36 character
        const num = parseInt(char, 16);
        hash += num.toString(36);
      }
      
      // Take first 10 characters and format as xxx-yyyy-zzz
      const code = hash.substring(0, 10).padEnd(10, '0');
      return `${code.substring(0, 3)}-${code.substring(3, 7)}-${code.substring(7, 10)}`;
    };
    
    const mockEventId = `mock-event-${booking.id}`;
    const mockMeetLink = `https://meet.google.com/${generateUniqueMeetCode(booking.id)}`;

    const existingMetadata = (booking.metadata ?? {}) as Record<
      string,
      unknown
    >;
    const metadata = {
      ...existingMetadata,
      meet: {
        provider: 'mock',
        eventId: mockEventId,
        createdAt: new Date().toISOString(),
        note: 'Mock meet link generated for demo (Google Calendar API not configured)',
      },
    };

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        meetEventId: mockEventId,
        meetLink: mockMeetLink,
        metadata,
      },
    });

    return {
      bookingId: booking.id,
      eventId: mockEventId,
      meetLink: mockMeetLink,
    };
  }

  async enqueueMeetCreation(bookingId: string) {
    await this.meetQueueService.enqueueCreateMeet(bookingId);
  }

  private buildCalendarEventPayload(booking: BookingWithMeetContext) {
    const summary = `Session with ${booking.instructor.displayName}`;
    const attendeeName = [booking.user.firstName, booking.user.lastName]
      .filter(Boolean)
      .join(' ');

    return {
      summary,
      description: booking.notes ?? undefined,
      start: {
        dateTime: booking.slot.startTime.toISOString(),
        timeZone: booking.timezone ?? booking.slot.timezone ?? 'UTC',
      },
      end: {
        dateTime: booking.slot.endTime.toISOString(),
        timeZone: booking.timezone ?? booking.slot.timezone ?? 'UTC',
      },
      attendees: [
        {
          email: booking.user.email,
          displayName: attendeeName || booking.user.email,
        },
      ],
      conferenceData: {
        createRequest: {
          requestId: `meet-${booking.id}-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'eventHangout', // Use 'eventHangout' for Google Meet
          },
        },
      },
      reminders: {
        useDefault: true,
      },
    };
  }

  private buildGoogleAuth(credential?: {
    type: MeetCredentialType;
    clientEmail: string | null;
    privateKey: string | null;
    scopes: string | null;
  }, calendarOwnerEmail?: string) {
    if (credential && credential.type === MeetCredentialType.OAUTH) {
      throw new InternalServerErrorException(
        'OAuth Meet credentials are not yet supported',
      );
    }

    const clientEmail =
      credential?.clientEmail ??
      this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const privateKey =
      credential?.privateKey ??
      this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_KEY');
    const scopesRaw =
      credential?.scopes ??
      this.configService.get<string>('GOOGLE_CALENDAR_SCOPES');

    if (!clientEmail || !privateKey) {
      throw new InternalServerErrorException(
        'Google service account credentials are not configured',
      );
    }

    const scopes = scopesRaw
      ? scopesRaw.split(',').map((scope) => scope.trim())
      : ['https://www.googleapis.com/auth/calendar'];

    const key = privateKey.replace(/\\n/g, '\n');

    // For service accounts accessing a user's calendar:
    // - If calendar is shared with service account, we can access it directly (no subject needed)
    // - If we want to impersonate the user (for Workspace accounts with domain-wide delegation), use subject
    // For regular Google accounts, try without subject first (calendar sharing is sufficient)
    // If calendarOwnerEmail is provided and is an email (not 'primary'), use it for impersonation
    const subject = calendarOwnerEmail && calendarOwnerEmail !== 'primary' && calendarOwnerEmail.includes('@')
      ? calendarOwnerEmail
      : undefined; // Don't use subject for regular shared calendars

    const jwtConfig: any = {
      email: clientEmail,
      key,
      scopes,
    };
    
    // Only set subject if we have a valid email (for Workspace domain-wide delegation)
    if (subject) {
      jwtConfig.subject = subject;
    }

    return new google.auth.JWT(jwtConfig);
  }

  private getFallbackCalendarId() {
    return this.configService.get<string>('GOOGLE_CALENDAR_ID', 'primary');
  }
}
