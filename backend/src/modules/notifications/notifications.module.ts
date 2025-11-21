import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsQueueService } from './notifications.queue.service';

@Module({
  imports: [ConfigModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationTemplateService,
    NotificationsProcessor,
    NotificationsQueueService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
