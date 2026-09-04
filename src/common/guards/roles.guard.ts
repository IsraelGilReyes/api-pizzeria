import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener los roles requeridos definidos en el decorador @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si la ruta no exige roles específicos, se permite el acceso
    if (!requiredRoles) {
      return true;
    }

    // Obtener la información del usuario adjuntada por el JwtAuthGuard
    const { user } = context.switchToHttp().getRequest();

    // Verificar si el usuario tiene el rol necesario
    const hasRole = requiredRoles.includes(user?.role);

    if (!hasRole) {
      throw new ForbiddenException('No tienes permisos suficientes (Se requiere rol GERENTE)');
    }

    return true;
  }
}