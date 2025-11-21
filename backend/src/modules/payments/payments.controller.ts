import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreateRazorpayOrderDto } from './dto/create-razorpay-order.dto';
import { VerifyRazorpayDto } from './dto/verify-razorpay.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('health')
  healthCheck() {
    return this.paymentsService.healthCheck();
  }

  @UseGuards(JwtAuthGuard)
  @Post('razorpay/order')
  createOrder(@Body() dto: CreateRazorpayOrderDto) {
    return this.paymentsService.createRazorpayOrder(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('razorpay/verify')
  verifyPayment(@Body() dto: VerifyRazorpayDto) {
    return this.paymentsService.verifyRazorpayOrder(dto);
  }

  @Post('razorpay/webhook')
  webhook(@Body() payload: unknown) {
    return this.paymentsService.handleWebhook(payload);
  }
}
