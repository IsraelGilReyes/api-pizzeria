import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  name: string;

  @IsNumber()
  @IsNotEmpty({ message: 'El precio es obligatorio' })
  @Min(0, { message: 'El precio debe ser mayor o igual a 0' })
  price: number;
}