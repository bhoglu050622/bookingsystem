import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MeetModule } from '../meet/meet.module';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';

@Module({
  imports: [AuthModule, MeetModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
