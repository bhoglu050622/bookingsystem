import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateInstructorAdminDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  @IsPositive()
  pricingAmount?: number;

  @IsOptional()
  @IsString()
  pricingCurrency?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(240)
  meetingDuration?: number;
}
