import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingStatus, SlotStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { MeetService } from '../meet/meet.service';

@Injectable()
export class BookingsService {
  private readonly holdExtensionMs: number;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
    private readonly meetService: MeetService,
  ) {
    this.holdExtensionMs = Number(
      configService.get('BOOKING_HOLD_EXTENSION_MS') ?? 10 * 60 * 1000,
    );
  }

  async healthCheck() {
    const totalBookings = await this.prisma.booking.count();
    return { status: 'ok', totalBookings };
  }

  async create(dto: CreateBookingDto) {
    const slot = await this.prisma.availabilitySlot.findUnique({
      where: { id: dto.slotId },
      include: {
        instructor: true,
        locks: true,
        booking: true,
      },
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    if (slot.booking || slot.status === SlotStatus.BOOKED) {
      throw new ConflictException('Slot already booked');
    }

    const lock = slot.locks.find((item) => item.token === dto.lockToken);

    if (!lock) {
      throw new ConflictException('Valid lock token is required');
    }

    if (lock.lockedUntil < new Date()) {
      throw new ConflictException('Lock has expired');
    }

    if (lock.userId && lock.userId !== dto.userId) {
      throw new ConflictException('Lock belongs to another user');
    }

    const instructor = slot.instructor;

    if (!instructor) {
      throw new ConflictException('Instructor profile missing for slot');
    }

    const bookingTimezone =
      dto.timezone ?? slot.timezone ?? instructor.calendarTimezone;

    const booking = await this.prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          userId: dto.userId,
          instructorProfileId: instructor.id,
          slotId: slot.id,
          status: BookingStatus.PENDING,
          scheduledStart: slot.startTime,
          scheduledEnd: slot.endTime,
          timezone: bookingTimezone ?? 'UTC',
          notes: dto.notes,
          priceAmount: instructor.pricingAmount,
          priceCurrency: instructor.pricingCurrency,
        },
        include: {
          instructor: true,
          slot: true,
        },
      });

      const extendedLockUntil = new Date(
        Math.max(lock.lockedUntil.getTime(), Date.now() + this.holdExtensionMs),
      );

      await tx.slotLock.update({
        where: { id: lock.id },
        data: {
          userId: dto.userId,
          lockedUntil: extendedLockUntil,
          reason: lock.reason ?? 'booking-payment',
        },
      });

      await tx.availabilitySlot.update({
        where: { id: slot.id },
        data: {
          status: SlotStatus.RESERVED,
        },
      });

      return newBooking;
    });

    // Generate meet link synchronously so it's included in the booking response
    // This ensures real Google Calendar links are available immediately
    try {
      const meetResult = await this.meetService.createMeetForBooking(booking.id);
      // Refresh booking to include meet link
      const updatedBooking = await this.prisma.booking.findUnique({
        where: { id: booking.id },
        include: {
          instructor: true,
          slot: true,
        },
      });
      return updatedBooking ?? booking;
    } catch (error) {
      // Log error but don't fail booking creation
      // Meet link will be generated later via queue if sync fails
      console.error('Failed to create meet link synchronously, will retry async:', error);
      // Fallback to async generation
      try {
        await this.meetService.enqueueMeetCreation(booking.id);
      } catch (queueError) {
        console.error('Failed to enqueue meet creation:', queueError);
      }
    }

    return booking;
  }

  async getBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        slot: true,
        instructor: {
          include: {
            user: true,
          },
        },
        user: true,
        transactions: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async findByInstructor(instructorId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        instructorProfileId: instructorId,
      },
      include: {
        slot: true,
        user: true,
        transactions: true,
      },
      orderBy: {
        scheduledStart: 'desc',
      },
    });

    return bookings;
  }

  async findByUser(userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        userId: userId,
      },
      include: {
        slot: true,
        instructor: {
          include: {
            user: true,
          },
        },
        transactions: true,
      },
      orderBy: {
        scheduledStart: 'desc',
      },
    });

    return bookings;
  }
}
