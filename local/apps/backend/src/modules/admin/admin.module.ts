import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';
import { PaymentsModule } from '../payments/payments.module';
import { AvailabilityModule } from '../availability/availability.module';

@Module({
  imports: [AuthModule, PaymentsModule, AvailabilityModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
