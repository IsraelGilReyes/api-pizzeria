import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@prisma/client'; 
import { JwtUser } from '../decorators/current-user.decorator'; 


@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Roles requeridos (método gana sobre clase)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. Sin @Roles o @Roles() vacío → ruta pública respecto a roles
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 3. Usuario adjuntado por JwtAuthGuard
    const request = context.switchToHttp().getRequest();
    const user: JwtUser | undefined = request.user;

    if (!user) {
      throw new UnauthorizedException(
        'Debes iniciar sesión para acceder a este recurso',
      );
    }

    // 4. Verificación de rol
    if (!requiredRoles.includes(user.role)) {
      this.logger.warn(
        `Acceso denegado: user=${user.email} role=${user.role} ` +
          `ruta=${request.method} ${request.url} ` +
          `requerido=[${requiredRoles.join(', ')}]`,
      );

      throw new ForbiddenException(
        `No tienes permisos suficientes. Roles requeridos: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}