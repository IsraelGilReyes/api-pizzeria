import { IsEmail, IsNotEmpty, IsString, IsIn, MinLength, IsOptional, IsInt } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsOptional()
  @IsIn(['CAJERO', 'COCINA', 'REPARTIDOR', 'GERENTE'], { 
    message: 'El rol debe ser: CAJERO, COCINA, REPARTIDOR o GERENTE' 
  })
  role?: 'CAJERO' | 'COCINA' | 'REPARTIDOR' | 'GERENTE';

  @IsOptional()
  @IsInt({ message: 'El ID de la sucursal debe ser un número entero' })
  branchId?: number; // 👈 NUEVO: Permite asociar o registrar con una sucursal opcionalmente
}