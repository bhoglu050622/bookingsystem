import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class GetAvailabilityDto {
  @IsDateString()
  targetDate!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? String(value) : undefined))
  timezone?: string;
}
