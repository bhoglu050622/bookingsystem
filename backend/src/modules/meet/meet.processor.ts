import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { MeetService } from './meet.service';

@Injectable()
export class MeetProcessor {
  private readonly logger = new Logger(MeetProcessor.name);

  constructor(
    @Inject(forwardRef(() => MeetService))
    private readonly meetService: MeetService,
  ) {}

  async handleCreateMeet(bookingId: string) {
    try {
      await this.meetService.createMeetForBooking(bookingId);
    } catch (error) {
      this.logger.error(
        `Failed to create Meet for booking ${bookingId}`,
        error as Error,
      );
      throw error;
    }
  }
}
