import { IsNumber, Max, Min } from 'class-validator';

export class UpdateCommissionAmountDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99_999_999.99)
  baseAmount!: number;
}
