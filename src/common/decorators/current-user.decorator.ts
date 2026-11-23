import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';

// Interfaz que define la estructura del usuario dentro del token JWT
export interface JwtUser {
  sub: number;       // ID del usuario
  email: string;     // Correo electrónico
  role: Role;        // Rol del usuario (ADMIN_GENERAL, GERENTE, etc.)
  branchId: number | null; // ID de sucursal (null si es ADMIN_GENERAL)
}

// Decorador personalizado para extraer el usuario autenticado en los controladores
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);