import { IsString, IsNotEmpty } from 'class-validator';

export class ReleaseSlotDto {
  @IsNotEmpty()
  @IsString()
  slotId!: string;

  @IsNotEmpty()
  @IsString()
  token!: string;
}
