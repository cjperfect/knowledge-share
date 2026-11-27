import { IsNumber, Max, Min } from 'class-validator';

export class UpdateCommissionRateDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  ratePercent!: number;
}
