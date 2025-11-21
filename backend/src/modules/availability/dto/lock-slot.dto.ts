import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class LockSlotDto {
  @IsNotEmpty()
  @IsString()
  slotId!: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
