import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBranchDto {
  @IsNotEmpty({ message: 'El nombre de la sucursal es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  name: string;

  @IsNotEmpty({ message: 'La dirección de la sucursal es obligatoria' })
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  address: string;
}