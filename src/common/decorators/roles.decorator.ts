import { SetMetadata } from '@nestjs/common';

// Clave con la que guardaremos los roles permitidos en la metadata de la ruta
export const ROLES_KEY = 'roles';

// Decorador que recibe los roles permitidos (ej. @Roles('GERENTE'))
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);