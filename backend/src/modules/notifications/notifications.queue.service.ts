import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { NotificationsProcessor } from './notifications.processor';

const NOTIFICATION_QUEUE = 'notifications-send';
const SEND_JOB = 'send-notification';

type NotificationJobData = { notificationId: string };

@Injectable()
export class NotificationsQueueService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationsQueueService.name);

  private connection!: Redis;

  private queue!: Queue<NotificationJobData>;

  // QueueScheduler removed in newer BullMQ versions - queue handles scheduling automatically

  private worker!: Worker<NotificationJobData>;

  constructor(
    private readonly configService: ConfigService,
    private readonly processor: NotificationsProcessor,
  ) {}

  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  async onModuleInit() {
    const redisUrl = this.configService.get<string>(
      'REDIS_URL',
      'redis://localhost:6379',
    );

    this.connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.queue = new Queue<NotificationJobData>(NOTIFICATION_QUEUE, {
      connection: this.connection,
    });

    // QueueScheduler removed in newer BullMQ versions - queue handles scheduling automatically

    this.worker = new Worker<NotificationJobData>(
      NOTIFICATION_QUEUE,
      async (job: Job<NotificationJobData>) => {
        if (job.name === SEND_JOB) {
          await this.processor.handleSend(job.data.notificationId);
        }
      },
      {
        connection: this.connection,
        concurrency: 5,
      },
    );

    this.worker.on('failed', (job, err) => {
      const jobId = job?.id ?? 'unknown';
      const notificationId = job?.data?.notificationId ?? 'n/a';
      const trace = err instanceof Error ? err.stack : String(err);
      this.logger.error(
        `Notification job ${jobId} failed for notification ${notificationId}`,
        trace,
      );
    });
  }
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

  async enqueueSend(notificationId: string, scheduledAt?: Date) {
    const delay = scheduledAt
      ? Math.max(scheduledAt.getTime() - Date.now(), 0)
      : 0;
    await this.queue.add(
      SEND_JOB,
      { notificationId },
      {
        jobId: `notification:${notificationId}`,
        delay,
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10_000,
        },
      },
    );
  }

  async getMetrics() {
    if (!this.queue) {
      return {
        waiting: 0,
        active: 0,
        failed: 0,
      };
    }

    const [waiting, active, failed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getFailedCount(),
    ]);

    return { waiting, active, failed };
  }

  /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
    // QueueScheduler removed in newer BullMQ versions - queue handles scheduling automatically
    if (this.queue) {
      await this.queue.close();
    }
    if (this.connection) {
      await this.connection.quit();
    }
  }
  /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
}
