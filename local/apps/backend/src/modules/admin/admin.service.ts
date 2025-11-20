import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { AvailabilityService } from '../availability/availability.service';
import { UpdateInstructorAdminDto } from './dto/update-instructor-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  async getOverview() {
    const [users, instructors, bookings, revenue, upcoming] = await Promise.all(
      [
        this.prisma.user.count(),
        this.prisma.instructorProfile.count(),
        this.prisma.booking.count(),
        this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { status: { equals: 'SUCCEEDED' } },
        }),
        this.prisma.booking.count({
          where: {
            status: { in: ['CONFIRMED', 'PAID', 'PAYMENT_INITIATED'] },
            scheduledStart: { gte: new Date() },
          },
        }),
      ],
    );

    return {
      users,
      instructors,
      bookings,
      revenue: revenue._sum.amount ?? 0,
      upcoming,
    };
  }

  async listInstructors() {
    return this.prisma.instructorProfile.findMany({
      include: {
        user: true,
      },
      orderBy: {
        displayName: 'asc',
      },
    });
  }

  async updateInstructor(id: string, dto: UpdateInstructorAdminDto) {
    const data: Prisma.InstructorProfileUpdateInput = {};
    if (dto.active !== undefined) {
      data.active = dto.active;
    }
    if (dto.pricingAmount !== undefined) {
      data.pricingAmount = dto.pricingAmount;
    }
    if (dto.pricingCurrency) {
      data.pricingCurrency = dto.pricingCurrency;
    }
    if (dto.meetingDuration !== undefined) {
      data.meetingDuration = dto.meetingDuration;
    }

    return this.prisma.instructorProfile.update({
      where: { id },
      data,
      include: {
        user: true,
      },
    });
  }

  async listBookings(limit = 50) {
    return this.prisma.booking.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: true,
        instructor: true,
        slot: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async refundBooking(bookingId: string, reason?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        slot: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    const refunded = await this.paymentsService.manualRefund(bookingId, reason);

    if (booking.slotId) {
      await this.availabilityService.releaseSlotAfterRefund(booking.slotId);
    }

    return refunded;
  }
}
