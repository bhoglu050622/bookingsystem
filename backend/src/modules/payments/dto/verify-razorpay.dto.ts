import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class VerifyRazorpayDto {
  @IsUUID()
  bookingId!: string;

  @IsString()
  @IsNotEmpty()
  razorpayOrderId!: string;

  @IsString()
  @IsNotEmpty()
  razorpayPaymentId!: string;

  @IsString()
  @IsNotEmpty()
  razorpaySignature!: string;
}
