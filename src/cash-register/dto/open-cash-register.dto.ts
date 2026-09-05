import { IsNumber, IsPositive, IsInt, Min } from 'class-validator';

export class OpenCashRegisterDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'El monto inicial no puede ser negativo' })
  initialAmount: number;

  @IsInt()
  @IsPositive()
  branchId: number;
}