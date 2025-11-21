import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Inject, forwardRef } from '@nestjs/common';
import { Job, Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { MeetProcessor } from './meet.processor';

const MEET_QUEUE_NAME = 'meet-create';
const CREATE_JOB = 'create-meet';

type MeetJobName = typeof CREATE_JOB;
type MeetJobData = { bookingId: string };

@Injectable()
export class MeetQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MeetQueueService.name);
  private connection!: Redis;
  private queue!: Queue<MeetJobData, void, MeetJobName>;
  // QueueScheduler removed in newer BullMQ versions - queue handles scheduling automatically
  private worker!: Worker<MeetJobData, void, MeetJobName>;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => MeetProcessor))
    private readonly meetProcessor: MeetProcessor,
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

    const queue: Queue<MeetJobData, void, MeetJobName> = new Queue<
      MeetJobData,
      void,
      MeetJobName
    >(MEET_QUEUE_NAME, {
      connection: this.connection,
    });
    this.queue = queue;

    // QueueScheduler removed in newer BullMQ versions - queue handles scheduling automatically

    const worker: Worker<MeetJobData, void, MeetJobName> = new Worker<
      MeetJobData,
      void,
      MeetJobName
    >(
      MEET_QUEUE_NAME,
      async (job: Job<MeetJobData, void, MeetJobName>) => {
        if (job.name === CREATE_JOB && job.data?.bookingId) {
          await this.meetProcessor.handleCreateMeet(job.data.bookingId);
        }
      },
      {
        connection: this.connection,
        concurrency: 2,
      },
    );
    this.worker = worker;

    this.worker.on('failed', (job, err) => {
      const jobId = job?.id ?? 'unknown';
      const bookingId = job?.data?.bookingId ?? 'n/a';
      const trace = err instanceof Error ? err.stack : String(err);
      this.logger.error(`Job ${jobId} failed for booking ${bookingId}`, trace);
    });
  }
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

  async enqueueCreateMeet(bookingId: string) {
    try {
      await this.queue.add(
        CREATE_JOB,
        { bookingId },
        {
          jobId: `meet-${bookingId}`,
          attempts: 5,
          removeOnComplete: true,
          removeOnFail: false,
          backoff: {
            type: 'exponential',
            delay: 5_000,
          },
        },
      );
    } catch (error) {
      if ((error as Error).message?.includes('Job ID meet-')) {
        this.logger.debug(`Meet job already enqueued for booking ${bookingId}`);
        return;
      }
      throw error;
    }
  }

  async getQueueMetrics() {
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

    return {
      waiting,
      active,
      failed,
    };
  }

  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  async onModuleDestroy() {
    if (this.worker) {
      const worker = this.worker;
      await worker.close();
    }
    // QueueScheduler removed in newer BullMQ versions - queue handles scheduling automatically
    if (this.queue) {
      const queue = this.queue;
      await queue.close();
    }
    if (this.connection) {
      const connection = this.connection;
      await connection.quit();
    }
  }
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
}
