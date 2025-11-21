import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ManualRefundDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
