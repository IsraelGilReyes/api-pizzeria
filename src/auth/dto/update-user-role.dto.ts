import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateUserRoleDto {
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  @IsIn(['CAJERO', 'GERENTE', 'COCINA', 'REPARTIDOR'], {
    message: 'El rol debe ser: CAJERO, GERENTE, COCINA o REPARTIDOR',
  })
  role: 'CAJERO' | 'GERENTE' | 'COCINA' | 'REPARTIDOR';
}
