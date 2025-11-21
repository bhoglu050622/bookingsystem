import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MeetService } from './meet.service';

@Controller('meet')
export class MeetController {
  constructor(private readonly meetService: MeetService) {}

  @Get('health')
  healthCheck() {
    return this.meetService.healthCheck();
  }

  @UseGuards(JwtAuthGuard)
  @Post('create/:bookingId')
  enqueueMeet(@Param('bookingId') bookingId: string) {
    return this.meetService.enqueueMeetCreation(bookingId);
  }
}
