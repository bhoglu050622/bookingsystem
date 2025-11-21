// Mock API client for UI testing without backend
// Enable by setting NEXT_PUBLIC_USE_MOCK_API=true

import type { AvailabilitySlot, DailyAvailability, InstructorProfile, BookingSummary } from "@/lib/types";
import hardcodedMentorsJson from "@/data/hardcoded-mentors.json";

// In-memory storage for mock bookings
const mockBookings: BookingSummary[] = [];

const hardcodedMentorsData: any[] = Array.isArray(hardcodedMentorsJson) 
  ? hardcodedMentorsJson 
  : (hardcodedMentorsJson as any).default || [];

console.log(`[Mock API] Loaded ${hardcodedMentorsData.length} mentors from JSON`);

// Convert hardcoded mentors to InstructorProfile format
const MOCK_INSTRUCTORS: InstructorProfile[] = (hardcodedMentorsData.length > 0 ? hardcodedMentorsData : [
  // Fallback mentors if JSON fails to load
  {
    name: "Anton Francis",
    slug: "anton-francis",
    avatarUrl: "https://www.expertisoracademy.in/assets/sivaraman-DAnNxvky.svg",
  },
  {
    name: "Mano Sundar",
    slug: "mano-sundar",
    title: "Engineer | Smart India Hackathon Expert",
    bio: "Associate Engineer | Smart India Hackathon Expert",
    avatarUrl: "https://www.expertisoracademy.in/assets/manosundar-_zTgK265.svg",
  },
  {
    name: "Elavarasan Sakthivel",
    slug: "elavarasan-sakthivel",
    title: "Mechanical Design Engineer | SolidWorks Expert",
    bio: "Mechanical Engineer | Mechanical Design Engineer | SolidWorks Expert",
    avatarUrl: "https://www.expertisoracademy.in/assets/elavarasan-DKfDEGtP.svg",
  },
])
  .filter((mentor) => {
    // Filter out non-mentor entries (like "Industry Specialized", "Our Mentors", etc.)
    const invalidNames = [
      "Industry Specialized",
      "Our Mentors",
      "Why Creator",
      "Embrace New",
      "Expertisor Academy",
      "Works Course",
    ];
    return mentor.name && !invalidNames.includes(mentor.name);
  })
  .map((mentor, index) => ({
    id: `scraped-${index}`,
    userId: `scraped-user-${index}`,
    slug: mentor.slug || mentor.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    displayName: mentor.name,
    headline: mentor.title || mentor.expertise?.join(", ") || "Expert Mentor",
    bio:
      mentor.bio ||
      `Professional mentor specializing in ${mentor.expertise?.join(", ") || "various domains"}`,
    avatarUrl: mentor.avatarUrl || null,
    pricingAmount: mentor.price ? mentor.price * 100 : 250000, // Convert to paise
    pricingCurrency: mentor.currency || "INR",
    meetingDuration: 30,
    bufferBefore: 0,
    bufferAfter: 0,
    calendarTimezone: "Asia/Kolkata",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

console.log(`[Mock API] Loaded ${MOCK_INSTRUCTORS.length} instructors`);

function generateMockSlots(
  instructorId: string,
  date: Date,
  count: number = 6,
): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  const startHour = 9;
  const duration = 30; // minutes

  for (let i = 0; i < count; i++) {
    const slotDate = new Date(date);
    slotDate.setHours(startHour + i * 2, 0, 0, 0);
    const endDate = new Date(slotDate);
    endDate.setMinutes(endDate.getMinutes() + duration);

    slots.push({
      id: `mock-slot-${instructorId}-${i}`,
      instructorProfileId: instructorId,
      startTimeUtc: slotDate.toISOString(),
      endTimeUtc: endDate.toISOString(),
      startTimeLocal: slotDate.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      endTimeLocal: endDate.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      timezone: "UTC",
      status: i < 2 ? "BOOKED" : i < 4 ? "RESERVED" : "AVAILABLE",
      isLocked: i === 3,
      lockedUntil: i === 3 ? new Date(Date.now() + 5 * 60 * 1000).toISOString() : null,
      hasBooking: i < 2,
    });
  }

  return slots;
}

// Simulate network delay
function delay(ms: number = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockApiFetch<T>(
  path: string,
  options?: { method?: string; body?: string; headers?: Record<string, string> },
): Promise<T> {
  await delay(300); // Simulate network delay

  // GET /instructors/:slug (check this first before the list endpoint)
  const instructorSlugMatch = path.match(/^\/instructors\/([^/?]+)(\?.*)?$/);
  if (instructorSlugMatch && (!options?.method || options.method === "GET")) {
    const slug = instructorSlugMatch[1];
    const instructor = MOCK_INSTRUCTORS.find((inst) => inst.slug === slug);
    if (instructor) {
      console.log(`[Mock API] GET /instructors/${slug} - Found instructor:`, instructor.displayName);
      return instructor as T;
    }
    console.error(`[Mock API] GET /instructors/${slug} - Instructor not found. Available slugs:`, MOCK_INSTRUCTORS.map(i => i.slug));
    throw new Error(`Instructor with slug "${slug}" not found`);
  }

  // GET /instructors (with or without query params)
  const pathWithoutQuery = path.split("?")[0];
  if (pathWithoutQuery === "/instructors" && (!options?.method || options.method === "GET")) {
    console.log(`[Mock API] GET /instructors - Returning ${MOCK_INSTRUCTORS.length} instructors:`, MOCK_INSTRUCTORS.map(i => i.displayName));
    return MOCK_INSTRUCTORS as T;
  }

  // GET /availability/instructor/:id?date=...
  const availabilityMatch = path.match(/^\/availability\/instructor\/([^/?]+)\?date=(.+)$/);
  if (availabilityMatch && (!options?.method || options.method === "GET")) {
    const instructorId = availabilityMatch[1];
    const dateParam = availabilityMatch[2];
    const targetDate = new Date(dateParam);

    const slots = generateMockSlots(instructorId, targetDate);
    const response: DailyAvailability = {
      instructorId,
      date: targetDate.toISOString(),
      timezone: "UTC",
      slots,
    };
    return response as T;
  }

  // POST /availability/lock
  if (path === "/availability/lock" && options?.method === "POST") {
    const body = JSON.parse(options.body || "{}");
    return {
      slotId: body.slotId,
      token: `mock-lock-token-${Date.now()}`,
      lockedUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    } as T;
  }

  // POST /availability/release
  if (path === "/availability/release" && options?.method === "POST") {
    return { released: true } as T;
  }

  // POST /bookings
  if (path === "/bookings" && options?.method === "POST") {
    const body = JSON.parse(options.body || "{}");
    
    // Find instructor from slot ID or use default
    const slotId = body.slotId || "";
    const instructorId = slotId.includes("mock-instructor-2") 
      ? "mock-instructor-2" 
      : slotId.includes("mock-instructor-3")
        ? "mock-instructor-3"
        : "mock-instructor-1";
    
    const instructor = MOCK_INSTRUCTORS.find((inst) => inst.id === instructorId) || MOCK_INSTRUCTORS[0];
    
    // Get slot time from slot ID if possible, otherwise use current time
    const now = new Date();
    const scheduledStart = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    scheduledStart.setHours(9, 0, 0, 0);
    const scheduledEnd = new Date(scheduledStart.getTime() + instructor.meetingDuration * 60 * 1000);
    
    // Generate a unique Google Meet link with proper format: xxx-yyyy-zzz
    const generateUniqueMeetCode = (bookingId: string) => {
      // Create a hash from the booking ID string
      let hash = 0;
      for (let i = 0; i < bookingId.length; i++) {
        const char = bookingId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      // Convert to base36 and ensure positive
      const hashStr = Math.abs(hash).toString(36);
      
      // Pad and format as xxx-yyyy-zzz (10 characters total)
      const code = hashStr.padEnd(10, '0').substring(0, 10);
      return `${code.substring(0, 3)}-${code.substring(3, 7)}-${code.substring(7, 10)}`;
    };
    
    const bookingId = `mock-booking-${Date.now()}`;
    const meetCode = generateUniqueMeetCode(bookingId);
    
    const booking: BookingSummary = {
      id: bookingId,
      userId: body.userId,
      instructorProfileId: instructor.id,
      slotId: body.slotId,
      status: "PENDING",
      scheduledStart: scheduledStart.toISOString(),
      scheduledEnd: scheduledEnd.toISOString(),
      timezone: body.timezone || instructor.calendarTimezone || "UTC",
      priceAmount: instructor.pricingAmount,
      priceCurrency: instructor.pricingCurrency,
      meetLink: `https://meet.google.com/${meetCode}`,
      instructor: {
        id: instructor.id,
        displayName: instructor.displayName,
      },
    };
    // Store booking in memory
    mockBookings.push(booking);
    return booking as T;
  }

  // GET /bookings/user/:userId
  const userBookingsMatch = path.match(/^\/bookings\/user\/([^/]+)$/);
  if (userBookingsMatch && (!options?.method || options.method === "GET")) {
    const userId = userBookingsMatch[1];
    const userBookings = mockBookings.filter((b) => b.userId === userId);
    return userBookings as T;
  }

  // GET /bookings/instructor/:instructorId
  const instructorBookingsMatch = path.match(/^\/bookings\/instructor\/([^/]+)$/);
  if (instructorBookingsMatch && (!options?.method || options.method === "GET")) {
    const instructorId = instructorBookingsMatch[1];
    const instructorBookings = mockBookings.filter((b) => b.instructorProfileId === instructorId);
    return instructorBookings as T;
  }

  // GET /bookings/:id
  const bookingMatch = path.match(/^\/bookings\/([^/]+)$/);
  if (bookingMatch && (!options?.method || options.method === "GET")) {
    const bookingId = bookingMatch[1];
    const booking = mockBookings.find((b) => b.id === bookingId);
    if (booking) {
      return booking as T;
    }
    throw new Error(`Booking with id "${bookingId}" not found`);
  }

  // POST /auth/login
  if (path === "/auth/login" && options?.method === "POST") {
    const body = JSON.parse(options.body || "{}");
    // Mock successful login
    return {
      user: {
        id: "mock-user-1",
        email: body.email || "student@example.com",
        firstName: "Student",
        lastName: "One",
        role: "USER",
      },
      accessToken: `mock-token-${Date.now()}`,
    } as T;
  }

  // POST /auth/register
  if (path === "/auth/register" && options?.method === "POST") {
    const body = JSON.parse(options.body || "{}");
    return {
      user: {
        id: `mock-user-${Date.now()}`,
        email: body.email,
        firstName: body.firstName || "User",
        lastName: body.lastName || "",
        role: "USER",
      },
      accessToken: `mock-token-${Date.now()}`,
    } as T;
  }

  // GET /auth/me or /auth/profile or /users/me
  if ((path === "/auth/me" || path === "/auth/profile" || path === "/users/me") && (!options?.method || options.method === "GET")) {
    // Return mock user if token is provided, otherwise return null
    const headers = options?.headers as Record<string, string> | undefined;
    const authHeader = headers?.["Authorization"] || headers?.["authorization"];
    if (authHeader && authHeader.includes("mock-token")) {
      return {
        id: "mock-user-1",
        email: "student@example.com",
        firstName: "Student",
        lastName: "One",
        role: "USER",
      } as T;
    }
    // Return null to indicate not authenticated
    return null as T;
  }

  throw new Error(`Mock API: Route not found - ${path}`);
}

