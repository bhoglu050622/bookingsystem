import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { GetAvailabilityDto } from './dto/get-availability.dto';
import { LockSlotDto } from './dto/lock-slot.dto';
import { ReleaseSlotDto } from './dto/release-slot.dto';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('health')
  healthCheck() {
    return this.availabilityService.healthCheck();
  }

  @Get('instructor/:instructorId')
  async getAvailability(
    @Param('instructorId') instructorId: string,
    @Query() query: GetAvailabilityDto,
  ) {
    const targetDate = query.targetDate
      ? new Date(query.targetDate)
      : new Date();
    if (Number.isNaN(targetDate.getTime())) {
      throw new BadRequestException('Invalid targetDate provided');
    }

    return this.availabilityService.getDailyAvailability(
      instructorId,
      targetDate,
    );
  }

  @Post('lock')
  lockSlot(@Body() dto: LockSlotDto) {
    return this.availabilityService.lockSlot(dto);
  }

  @Post('release')
  releaseSlot(@Body() dto: ReleaseSlotDto) {
    return this.availabilityService.releaseSlot(dto);
  }
}
