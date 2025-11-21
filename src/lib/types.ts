export type InstructorProfile = {
  id: string;
  userId: string;
  slug: string;
  displayName: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  pricingAmount: number;
  pricingCurrency: string;
  meetingDuration: number;
  calendarTimezone: string;
  rating?: number | null;
  reviewCount?: number | null;
};

export type AvailabilitySlot = {
  id: string;
  instructorProfileId: string;
  startTimeUtc: string;
  endTimeUtc: string;
  startTimeLocal: string;
  endTimeLocal: string;
  timezone: string;
  status: "AVAILABLE" | "RESERVED" | "BOOKED" | "DISABLED";
  isLocked: boolean;
  lockedUntil: string | null;
  hasBooking: boolean;
};

export type DailyAvailability = {
  instructorId: string;
  date: string;
  timezone: string;
  slots: AvailabilitySlot[];
};

export type BookingSummary = {
  id: string;
  userId: string;
  instructorProfileId: string;
  slotId: string | null;
  status:
    | "PENDING"
    | "PAYMENT_INITIATED"
    | "PAID"
    | "CONFIRMED"
    | "CANCELLED";
  scheduledStart: string;
  scheduledEnd: string;
  timezone: string;
  meetEventId?: string | null;
  meetLink?: string | null;
  priceAmount: number;
  priceCurrency: string;
  instructor?: {
    id: string;
    displayName: string;
    user?: {
      id: string;
      email: string;
    };
  };
  user?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  slot?: {
    id: string;
    startTime: string;
    endTime: string;
  };
};

export type ApiResponse<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type AdminOverview = {
  users: number;
  instructors: number;
  bookings: number;
  revenue: number;
  upcoming: number;
};

export type AdminInstructor = InstructorProfile & {
  user: {
    id: string;
    email: string;
  };
  active: boolean;
};

export type AdminTransaction = {
  id: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

export type AdminBooking = BookingSummary & {
  user: {
    id: string;
    email: string;
  };
  instructor: {
    id: string;
    displayName: string;
  };
  transactions: AdminTransaction[];
};

