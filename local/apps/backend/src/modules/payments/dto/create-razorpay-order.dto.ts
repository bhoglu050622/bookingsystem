import { IsUUID } from 'class-validator';

export class CreateRazorpayOrderDto {
  @IsUUID()
  bookingId!: string;
}
