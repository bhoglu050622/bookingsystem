import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminService } from './admin.service';
import { UpdateInstructorAdminDto } from './dto/update-instructor-admin.dto';
import { ManualRefundDto } from './dto/manual-refund.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  overview() {
    return this.adminService.getOverview();
  }

  @Get('instructors')
  listInstructors() {
    return this.adminService.listInstructors();
  }

  @Patch('instructors/:id')
  updateInstructor(
    @Param('id') id: string,
    @Body() dto: UpdateInstructorAdminDto,
  ) {
    return this.adminService.updateInstructor(id, dto);
  }

  @Get('bookings')
  listBookings(@Query('limit') limit?: string) {
    const numericLimit = limit ? Number(limit) : 50;
    const take =
      Number.isFinite(numericLimit) && numericLimit > 0
        ? Math.min(numericLimit, 200)
        : 50;
    return this.adminService.listBookings(take);
  }

  @Post('bookings/:id/refund')
  refundBooking(@Param('id') id: string, @Body() dto: ManualRefundDto) {
    return this.adminService.refundBooking(id, dto.reason);
  }
}
