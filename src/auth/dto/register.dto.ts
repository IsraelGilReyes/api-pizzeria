// src/auth/dto/register.dto.ts
import { IsString, IsEmail, IsNotEmpty, IsEnum, IsInt, MinLength, ValidateIf } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsEmail({}, { message: 'El formato del correo electrónico es inválido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsEnum(Role, { message: 'El rol especificado no es válido' })
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  role: Role;

  // Obligatorio para todos los roles, EXCEPTO para ADMIN_GENERAL
  @ValidateIf((o) => o.role !== Role.ADMIN_GENERAL)
  @IsInt({ message: 'El ID de la sucursal debe ser un número entero' })
  @IsNotEmpty({ message: 'La sucursal es obligatoria para este rol' })
  branchId: number;
}