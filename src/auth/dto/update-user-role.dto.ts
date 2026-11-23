// src/auth/dto/update-user-role.dto.ts
import { IsEnum, IsNotEmpty, IsInt, IsOptional, ValidateIf } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserRoleDto {
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  @IsEnum(Role, {
    message: 'El rol debe ser válido: ADMIN_GENERAL, GERENTE, CAJERO, COCINA o REPARTIDOR',
  })
  role: Role;

  // Si al actualizar el rol también se actualiza/asigna la sucursal:
  @ValidateIf((o) => o.role !== Role.ADMIN_GENERAL)
  @IsInt({ message: 'El ID de la sucursal debe ser un número entero' })
  @IsNotEmpty({ message: 'La sucursal es obligatoria para este rol' })
  @IsOptional() // Pon @IsOptional() si la actualización puede ser parcial (ej. solo cambiar el rol sin tocar la sucursal)
  branchId?: number;
}