import {
  IsEnum,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { NotificationChannel, NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsObject()
  templateData?: Record<string, unknown>;
}
