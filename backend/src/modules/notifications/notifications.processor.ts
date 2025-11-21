import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Booking,
  InstructorProfile,
  Notification,
  NotificationChannel,
  NotificationStatus,
  User,
  Prisma,
} from '@prisma/client';
import sgMail from '@sendgrid/mail';
import { Twilio } from 'twilio';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationTemplateService } from './notification-template.service';

type NotificationWithRelations = Notification & {
  user: User;
  booking: (Booking & { instructor: InstructorProfile | null }) | null;
};

@Injectable()
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  private readonly sendGridConfigured: boolean;

  private readonly twilioConfigured: boolean;

  private readonly sendGridFromEmail?: string;

  private readonly twilioFromNumber?: string;

  private readonly twilioClient?: Twilio;

  constructor(
    private readonly prisma: PrismaService,
    private readonly templateService: NotificationTemplateService,
    configService: ConfigService,
  ) {
    const sendGridKey = configService.get<string>('SENDGRID_API_KEY');
    this.sendGridFromEmail = configService.get<string>('SENDGRID_FROM_EMAIL');

    if (sendGridKey && this.sendGridFromEmail) {
      sgMail.setApiKey(sendGridKey);
      this.sendGridConfigured = true;
    } else {
      this.sendGridConfigured = false;
    }

    const twilioAccountSid = configService.get<string>('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioFromNumber = configService.get<string>('TWILIO_FROM_NUMBER');

    if (twilioAccountSid && twilioAuthToken && this.twilioFromNumber) {
      this.twilioClient = new Twilio(twilioAccountSid, twilioAuthToken);
      this.twilioConfigured = true;
    } else {
      this.twilioConfigured = false;
    }
  }

  async handleSend(notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        user: true,
        booking: {
          include: {
            instructor: true,
          },
        },
      },
    });

    if (!notification) {
      this.logger.warn(`Notification ${notificationId} not found`);
      return;
    }

    try {
      if (notification.channel === NotificationChannel.EMAIL) {
        await this.sendEmail(notification);
      } else if (notification.channel === NotificationChannel.SMS) {
        await this.sendSms(notification);
      } else {
        throw new Error(`Unsupported channel ${String(notification.channel)}`);
      }

      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
          error: null,
        },
      });
    } catch (error) {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.FAILED,
          error: (error as Error).message,
        },
      });
      this.logger.error(
        `Notification ${notificationId} failed`,
        error as Error,
      );
      throw error;
    }
  }

  private async sendEmail(notification: NotificationWithRelations) {
    if (!this.sendGridConfigured || !this.sendGridFromEmail) {
      throw new Error('SendGrid is not configured');
    }

    const toEmail = notification.user.email;
    if (!toEmail) {
      throw new Error('User email missing for notification');
    }

    const templateName = notification.template ?? 'booking-confirmation';
    const html = await this.templateService.render(
      NotificationChannel.EMAIL,
      templateName,
      this.asRecord(notification.templateData) ?? {},
    );
    const subject = this.asRecord(notification.payload)?.subject as
      | string
      | undefined;

    const resolvedSubject = subject ?? 'Booking Confirmation';

    await sgMail.send({
      to: toEmail,
      from: this.sendGridFromEmail,
      subject: resolvedSubject,
      html,
    });

    this.logger.log(`Notification ${notification.id} email sent to ${toEmail}`);
  }

  private async sendSms(notification: NotificationWithRelations) {
    if (
      !this.twilioConfigured ||
      !this.twilioClient ||
      !this.twilioFromNumber
    ) {
      throw new Error('Twilio is not configured');
    }

    const phoneNumber = notification.user.phoneNumber;
    if (!phoneNumber) {
      throw new Error('User phone number missing for SMS notification');
    }

    const templateName = notification.template ?? 'booking-confirmation';
    const body = await this.templateService.render(
      NotificationChannel.SMS,
      templateName,
      this.asRecord(notification.templateData) ?? {},
    );

    await this.twilioClient.messages.create({
      to: phoneNumber,
      from: this.twilioFromNumber,
      body,
    });

    this.logger.log(
      `Notification ${notification.id} SMS sent to ${phoneNumber}`,
    );
  }

  private asRecord(value: Prisma.JsonValue | null | undefined) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return undefined;
  }
}
