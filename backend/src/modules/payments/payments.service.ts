import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookingStatus,
  NotificationChannel,
  NotificationType,
  TransactionStatus,
  Prisma,
} from '@prisma/client';
import Razorpay from 'razorpay';
import { createHmac } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { MeetQueueService } from '../meet/meet.queue.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateRazorpayOrderDto } from './dto/create-razorpay-order.dto';
import { VerifyRazorpayDto } from './dto/verify-razorpay.dto';

@Injectable()
export class PaymentsService {
  private readonly keyId: string;
  private readonly keySecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly availabilityService: AvailabilityService,
    private readonly meetQueueService: MeetQueueService,
    private readonly notificationsService: NotificationsService,
    configService: ConfigService,
  ) {
    this.keyId = configService.get<string>('RAZORPAY_KEY_ID', '');
    this.keySecret = configService.get<string>('RAZORPAY_KEY_SECRET', '');
  }

  async healthCheck() {
    const totalTransactions = await this.prisma.transaction.count();
    return { status: 'ok', totalTransactions };
  }

  async createRazorpayOrder(dto: CreateRazorpayOrderDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        transactions: true,
        slot: true,
        instructor: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new ConflictException('Cannot create order for cancelled booking');
    }

    const successfulTransaction = booking.transactions.find(
      (transaction) => transaction.status === TransactionStatus.SUCCEEDED,
    );

    if (successfulTransaction) {
      throw new ConflictException('Booking already paid');
    }

    const existingPending = booking.transactions.find(
      (transaction) =>
        transaction.provider === 'RAZORPAY' &&
        transaction.status === TransactionStatus.PENDING &&
        transaction.orderId,
    );

    if (existingPending && existingPending.rawPayload) {
      return {
        bookingId: booking.id,
        order: existingPending.rawPayload,
      };
    }

    const client = this.getClient();

    const amount = booking.priceAmount;
    if (!amount || amount <= 0) {
      throw new InternalServerErrorException('Invalid booking amount');
    }

    try {
      const order = await client.orders.create({
        amount,
        currency: booking.priceCurrency,
        receipt: `booking_${booking.id}`,
        notes: {
          bookingId: booking.id,
          slotId: booking.slotId,
        },
      });

      await this.prisma.$transaction([
        this.prisma.transaction.create({
          data: {
            bookingId: booking.id,
            userId: booking.userId,
            provider: 'RAZORPAY',
            orderId: order.id,
            amount,
            currency: booking.priceCurrency,
            status: TransactionStatus.PENDING,
            rawPayload: order as unknown as Prisma.InputJsonValue,
          },
        }),
        this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.PAYMENT_INITIATED,
          },
        }),
      ]);

      return {
        bookingId: booking.id,
        order,
      };
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        'Failed to create Razorpay order',
        { cause: error as Error },
      );
    }
  }

  async verifyRazorpayOrder(dto: VerifyRazorpayDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        transactions: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const transaction = booking.transactions.find(
      (item) => item.orderId === dto.razorpayOrderId,
    );

    if (!transaction) {
      throw new NotFoundException('Transaction not found for booking');
    }

    const signaturePayload = `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`;
    const expectedSignature = createHmac('sha256', this.requireKeySecret())
      .update(signaturePayload)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      throw new UnauthorizedException('Signature mismatch');
    }

    await this.prisma.$transaction([
      this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          paymentId: dto.razorpayPaymentId,
          signature: dto.razorpaySignature,
          status: TransactionStatus.SUCCEEDED,
        },
      }),
      this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CONFIRMED,
        },
      }),
    ]);

    if (booking.slotId) {
      await this.availabilityService.markSlotAsBooked(booking.slotId);
    }

    await this.notificationsService.queueBookingConfirmation(booking.id);
    await this.meetQueueService.enqueueCreateMeet(booking.id);

    return {
      bookingId: booking.id,
      status: BookingStatus.CONFIRMED,
    };
  }

  async manualRefund(bookingId: string, reason?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
        user: true,
        instructor: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found for refund');
    }

    const succeededTransaction = booking.transactions.find(
      (transaction) => transaction.status === TransactionStatus.SUCCEEDED,
    );

    if (!succeededTransaction) {
      throw new ConflictException('No completed transaction found to refund');
    }

    await this.prisma.$transaction([
      this.prisma.transaction.update({
        where: { id: succeededTransaction.id },
        data: {
          status: TransactionStatus.REFUNDED,
          error: (reason ?? null) as unknown as Prisma.InputJsonValue,
        },
      }),
      this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
        },
      }),
    ]);

    await this.notificationsService.create({
      userId: booking.userId,
      bookingId: booking.id,
      channel: NotificationChannel.EMAIL,
      type: NotificationType.CANCELLATION,
      template: 'booking-confirmation',
      templateData: {
        userName:
          [booking.user.firstName, booking.user.lastName]
            .filter(Boolean)
            .join(' ') || booking.user.email,
        instructorName: booking.instructor?.displayName ?? 'Instructor',
        startTime: booking.scheduledStart.toISOString(),
        duration: booking.instructor?.meetingDuration ?? 30,
        meetLink: booking.meetLink ?? '',
        calendarLink: '',
        refund: true,
      },
      payload: {
        subject: `Booking with ${
          booking.instructor?.displayName ?? 'the instructor'
        } refunded`,
        reason: reason ?? 'Manual refund issued by administrator',
      },
    });

    return this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        instructor: true,
        transactions: true,
      },
    });
  }

  handleWebhook(payload: unknown) {
    // Placeholder for future signature verification & event handling
    return { received: true, payload };
  }

  private getClient() {
    const keyId = this.requireKeyId();
    const keySecret = this.requireKeySecret();
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  private requireKeyId() {
    if (!this.keyId) {
      throw new InternalServerErrorException(
        'RAZORPAY_KEY_ID is not configured',
      );
    }
    return this.keyId;
  }

  private requireKeySecret() {
    if (!this.keySecret) {
      throw new InternalServerErrorException(
        'RAZORPAY_KEY_SECRET is not configured',
      );
    }
    return this.keySecret;
  }
}
