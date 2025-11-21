import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsString()
  slotId!: string;

  @IsString()
  @MinLength(10)
  lockToken!: string;

  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? String(value).trim() : undefined))
  notes?: string;
}
