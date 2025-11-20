import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateInstructorDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value).toLowerCase())
  slug!: string;

  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsInt()
  @Min(0)
  pricingAmount!: number;

  @IsString()
  @IsNotEmpty()
  pricingCurrency: string = 'INR';

  @IsInt()
  @Min(15)
  @Max(180)
  meetingDuration!: number;

  @IsInt()
  @Min(0)
  @Max(120)
  bufferBefore: number = 0;

  @IsInt()
  @Min(0)
  @Max(120)
  bufferAfter: number = 0;

  @IsString()
  @IsNotEmpty()
  calendarTimezone: string = 'UTC';

  @IsOptional()
  @IsString()
  rrule?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
