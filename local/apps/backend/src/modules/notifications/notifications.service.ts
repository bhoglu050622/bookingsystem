import { Injectable, NotFoundException } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsQueueService } from './notifications.queue.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: NotificationsQueueService,
    private readonly configService: ConfigService,
  ) {}

  async healthCheck() {
    const [totalQueued, queueMetrics] = await Promise.all([
      this.prisma.notification.count({
        where: {
          status: NotificationStatus.QUEUED,
        },
      }),
      this.queue.getMetrics(),
    ]);

    return {
      status: 'ok',
      totalQueued,
      queue: queueMetrics,
    };
  }

  async create(dto: CreateNotificationDto) {
    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : undefined;

    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        bookingId: dto.bookingId,
        type: dto.type,
        channel: dto.channel,
        scheduledAt,
        payload: (dto.payload ?? null) as Prisma.InputJsonValue,
        template: dto.template,
        templateData: (dto.templateData ?? null) as Prisma.InputJsonValue,
        status: NotificationStatus.QUEUED,
      },
    });

    await this.queue.enqueueSend(notification.id, scheduledAt);

    return notification;
  }

  async getNotification(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    return notification;
  }

  async queueBookingConfirmation(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        instructor: true,
        slot: true,
      },
    });

    if (!booking || !booking.user || !booking.slot || !booking.instructor) {
      throw new NotFoundException('Booking data incomplete for notification');
    }

    const startTime = booking.scheduledStart ?? booking.slot.startTime;
    const endTime = booking.scheduledEnd ?? booking.slot.endTime;
    const timezone = booking.timezone ?? booking.slot.timezone ?? 'UTC';

    const formattedStart = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
    }).format(startTime);

    const durationMinutes = Math.round(
      (endTime.getTime() - startTime.getTime()) / 1000 / 60,
    );

    const calendarLink = this.buildGoogleCalendarLink(
      booking.instructor.displayName,
      startTime,
      endTime,
      booking.meetLink ?? '',
    );

    const templateData = {
      userName:
        [booking.user.firstName, booking.user.lastName]
          .filter(Boolean)
          .join(' ') || booking.user.email,
      instructorName: booking.instructor.displayName,
      startTime: formattedStart,
      duration: durationMinutes,
      meetLink:
        booking.meetLink ??
        this.configService.get<string>('DEFAULT_MEET_URL', ''),
      calendarLink,
    } satisfies Record<string, unknown>;

    await this.create({
      userId: booking.userId,
      bookingId: booking.id,
      type: NotificationType.BOOKING_CONFIRMATION,
      channel: NotificationChannel.EMAIL,
      template: 'booking-confirmation',
      templateData,
      payload: {
        subject: `Session with ${booking.instructor.displayName} confirmed`,
      },
    });

    if (booking.user.phoneNumber) {
      await this.create({
        userId: booking.userId,
        bookingId: booking.id,
        type: NotificationType.BOOKING_CONFIRMATION,
        channel: NotificationChannel.SMS,
        template: 'booking-confirmation',
        templateData,
      });
    }
  }

  private buildGoogleCalendarLink(
    instructorName: string,
    start: Date,
    end: Date,
    meetLink: string,
  ) {
    const formatDate = (date: Date) =>
      date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const startParam = formatDate(start);
    const endParam = formatDate(end);

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Session with ${instructorName}`,
      dates: `${startParam}/${endParam}`,
      details: meetLink ? `Join here: ${meetLink}` : 'Booking confirmed',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }
}
