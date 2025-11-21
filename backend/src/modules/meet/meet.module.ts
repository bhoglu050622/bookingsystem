import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MeetService } from './meet.service';
import { MeetController } from './meet.controller';
import { MeetQueueService } from './meet.queue.service';
import { MeetProcessor } from './meet.processor';
import { GoogleOAuthModule } from '../google-oauth/google-oauth.module';

@Module({
  imports: [ConfigModule, forwardRef(() => GoogleOAuthModule)],
  controllers: [MeetController],
  providers: [MeetService, MeetQueueService, MeetProcessor],
  exports: [MeetService, MeetQueueService],
})
export class MeetModule {}
