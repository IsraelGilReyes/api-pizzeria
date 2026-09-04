import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateBranchDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la sucursal es obligatorio' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  address: string;
}