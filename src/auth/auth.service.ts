// src/auth/auth.service.ts

// Importaciones de NestJS: decoradores y excepciones HTTP.
import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
// Servicio de Prisma para acceder a la base de datos.
import { PrismaService } from '../prisma/prisma.service';
// Servicio de JWT para firmar y verificar tokens.
import { JwtService } from '@nestjs/jwt';
// bcrypt para hashear y comparar contraseñas.
import * as bcrypt from 'bcrypt';
// Enum Role de Prisma (ADMIN_GENERAL, GERENTE, CAJERO, COCINA, REPARTIDOR).
import { Role } from '@prisma/client';
// DTOs que tipan los datos entrantes.
import { RegisterDto } from './dto/register.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

/**
 * @Injectable marca la clase como proveedor inyectable en NestJS.
 * AuthService contiene toda la lógica de negocio de autenticación:
 * login, registro de gerentes/personal, actualización de rol y desactivación.
 */
@Injectable()
export class AuthService {
  // Inyección de dependencias: PrismaService (BD) y JwtService (tokens).
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * mapRole: convierte un string de rol a un valor del enum Role de Prisma.
   * Si el string no coincide con ninguno, devuelve CAJERO por defecto.
   * Útil para normalizar el rol que llega en el DTO (que es string).
   */
  private mapRole(role?: string): Role {
    if (role === 'ADMIN_GENERAL') return Role.ADMIN_GENERAL;
    if (role === 'GERENTE') return Role.GERENTE;
    if (role === 'COCINA') return Role.COCINA;
    if (role === 'REPARTIDOR') return Role.REPARTIDOR;
    return Role.CAJERO;
  }

  // ============================================================
  // 1. REGISTRAR GERENTE (Exclusivo ADMIN_GENERAL)
  // ============================================================
  async registerManager(data: RegisterDto, currentUser: any) {
    // Valida que quien registra sea el Admin General.
    if (currentUser.role !== Role.ADMIN_GENERAL) {
      throw new ForbiddenException('Solo el Administrador General puede registrar gerentes.');
    }

    // El gerente DEBE tener sucursal asignada.
    if (!data.branchId) {
      throw new BadRequestException('El gerente debe estar asignado obligatoriamente a una sucursal.');
    }

    // Verifica que la sucursal exista en la BD.
    const branchExists = await this.prisma.branch.findUnique({ where: { id: data.branchId } });
    if (!branchExists) {
      throw new BadRequestException('La sucursal especificada no existe.');
    }

    // Verifica que el email no esté ya registrado.
    const userExists = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (userExists) {
      throw new BadRequestException('El correo electrónico ya está registrado.');
    }

    // Hashea la contraseña con bcrypt (10 rondas de salt).
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Crea el usuario con rol GERENTE y lo asocia a la sucursal.
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: Role.GERENTE,
        branchId: data.branchId,
      },
      include: { branch: true }, // Incluye los datos de la sucursal en la respuesta.
    });

    // Desestructura para excluir la contraseña del resultado (no se debe exponer).
    const { password: _, ...result } = user;
    return result;
  }

  // ============================================================
  // 2. REGISTRAR PERSONAL DE SUCURSAL (Cajero, Cocina, Repartidor)
  // ============================================================
  async registerStaff(data: RegisterDto, currentUser: any) {
    // Normaliza el rol recibido a un valor del enum Role.
    const targetRole = this.mapRole(data.role);

    // No permite crear admins ni gerentes desde este endpoint.
    if (targetRole === Role.ADMIN_GENERAL || targetRole === Role.GERENTE) {
      throw new ForbiddenException('No tienes permisos para registrar este tipo de rol.');
    }

    let finalBranchId = data.branchId;

    // Si quien registra es GERENTE, se fuerza a que el nuevo usuario quede en SU sucursal.
    if (currentUser.role === Role.GERENTE) {
      finalBranchId = currentUser.branchId;
    } else if (currentUser.role !== Role.ADMIN_GENERAL) {
      // Cualquier otro rol no puede registrar personal.
      throw new ForbiddenException('No tienes permisos para registrar usuarios.');
    }

    // La sucursal es obligatoria (todo staff pertenece a una sucursal).
    if (!finalBranchId) {
      throw new BadRequestException('La sucursal es obligatoria.');
    }

    // Verifica que la sucursal exista.
    const branchExists = await this.prisma.branch.findUnique({ where: { id: finalBranchId } });
    if (!branchExists) {
      throw new BadRequestException('La sucursal especificada no existe.');
    }

    // Verifica que el email no esté duplicado.
    const userExists = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (userExists) {
      throw new BadRequestException('El correo electrónico ya está registrado.');
    }

    // Hashea la contraseña.
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Crea el usuario con el rol normalizado y la sucursal final.
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: targetRole,
        branchId: finalBranchId,
      },
      include: { branch: true },
    });

    // Excluye la contraseña de la respuesta.
    const { password: _, ...result } = user;
    return result;
  }

  // ============================================================
  // 3. ACTUALIZAR ROL Y/O SUCURSAL DE USUARIO
  // ============================================================
  async updateUserRole(userId: number, updateUserRoleDto: UpdateUserRoleDto, currentUser: any) {
    // Solo Admin General y Gerente pueden modificar usuarios.
    if (currentUser.role !== Role.ADMIN_GENERAL && currentUser.role !== Role.GERENTE) {
      throw new ForbiddenException('No tienes permisos para modificar usuarios.');
    }

    // Busca al usuario objetivo (con su sucursal).
    const targetUser = await this.prisma.user.findUnique({ 
      where: { id: userId },
      include: { branch: true }
    });
    if (!targetUser) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // 🔒 RESTRICCIONES ESTRICTAS PARA EL GERENTE
    if (currentUser.role === Role.GERENTE) {
      // 1. Solo puede modificar usuarios de su misma sucursal.
      if (targetUser.branchId !== currentUser.branchId) {
        throw new ForbiddenException('No puedes modificar usuarios de otra sucursal.');
      }
      // 2. No puede asignar roles de GERENTE o ADMIN_GENERAL.
      if (updateUserRoleDto.role && (updateUserRoleDto.role === Role.ADMIN_GENERAL || updateUserRoleDto.role === Role.GERENTE)) {
        throw new ForbiddenException('Un gerente no puede asignar roles de gerente o administrador.');
      }
      // 3. No puede mover al usuario a otra sucursal.
      if (updateUserRoleDto.branchId && updateUserRoleDto.branchId !== currentUser.branchId) {
        throw new ForbiddenException('No puedes mover usuarios a otra sucursal.');
      }
    }

    // Determina el nuevo rol: el del DTO si viene, o el actual del usuario.
    const newRole = updateUserRoleDto.role ? this.mapRole(updateUserRoleDto.role) : targetUser.role;

    // Solo puede existir UN Admin General en el sistema.
    if (newRole === Role.ADMIN_GENERAL && targetUser.role !== Role.ADMIN_GENERAL) {
      const existingAdmin = await this.prisma.user.findFirst({
        where: { role: Role.ADMIN_GENERAL },
      });
      if (existingAdmin) {
        throw new BadRequestException('Ya existe un Administrador General registrado en el sistema.');
      }
    }

    // Determina el branchId final según quién ejecuta la acción.
    let finalBranchId = targetUser.branchId;
    if (newRole === Role.ADMIN_GENERAL) {
      finalBranchId = null; // El Admin General no tiene sucursal.
    } else if (currentUser.role === Role.GERENTE) {
      finalBranchId = currentUser.branchId; // El gerente mantiene al usuario en su sucursal.
    } else if (currentUser.role === Role.ADMIN_GENERAL) {
      // El Admin General puede cambiar la sucursal si la envía en el DTO.
      if (updateUserRoleDto.branchId !== undefined) {
        finalBranchId = updateUserRoleDto.branchId;
      }
    }

    // Todo rol distinto de Admin General requiere sucursal.
    if (newRole !== Role.ADMIN_GENERAL && !finalBranchId) {
      throw new BadRequestException('La sucursal es obligatoria para este rol.');
    }

    // Si el Admin General cambió la sucursal, verifica que exista.
    if (currentUser.role === Role.ADMIN_GENERAL && finalBranchId && finalBranchId !== targetUser.branchId) {
      const branchExists = await this.prisma.branch.findUnique({ where: { id: finalBranchId } });
      if (!branchExists) {
        throw new BadRequestException('La sucursal especificada no existe en la base de datos.');
      }
    }

    // Actualiza el usuario y devuelve solo campos seguros (sin password).
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { 
        role: newRole,
        branchId: finalBranchId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branchId: true,
        branch: true,
      },
    });

    return updatedUser;
  }

  // ============================================================
  // 4. LOGIN
  // ============================================================
  async login(data: { email: string; password: string }) {
    // Busca al usuario por email (incluye su sucursal).
    const user = await this.prisma.user.findUnique({ 
      where: { email: data.email },
      include: { branch: true },
    });
    // Si no existe o está inactivo, error genérico (no revela cuál falló).
    if (!user || !user.active) {
      throw new UnauthorizedException('Credenciales inválidas o usuario inactivo.');
    }

    // Compara la contraseña enviada con el hash guardado.
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    // Firma el JWT con los datos clave del usuario.
    // "sub" es el ID (estándar JWT). Incluye email, role y branchId.
    const token = this.jwtService.sign({ 
      sub: user.id, 
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    });
    
    // Devuelve el token y los datos del usuario (sin password).
    return { 
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        branch: user.branch,
      }
    };
  }

  // ============================================================
  // 5. DESACTIVAR / DAR DE BAJA A UN USUARIO (soft delete)
  // ============================================================
  async deactivateUser(userId: number, currentUser: any) {
    // Solo Admin General y Gerente pueden desactivar.
    if (currentUser.role !== Role.ADMIN_GENERAL && currentUser.role !== Role.GERENTE) {
      throw new ForbiddenException('No tienes permisos para desactivar usuarios.');
    }

    // Busca al usuario objetivo.
    const targetUser = await this.prisma.user.findUnique({ 
      where: { id: userId },
      include: { branch: true }
    });

    if (!targetUser) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // 🔒 El Admin General no puede ser desactivado por nadie.
    if (targetUser.role === Role.ADMIN_GENERAL) {
      throw new ForbiddenException('No se puede desactivar al Administrador General.');
    }

    // 🔒 Restricciones si quien ejecuta es GERENTE.
    if (currentUser.role === Role.GERENTE) {
      // 1. Solo puede desactivar personal de su misma sucursal.
      if (targetUser.branchId !== currentUser.branchId) {
        throw new ForbiddenException('No puedes desactivar usuarios de otra sucursal.');
      }
      // 2. Un gerente no puede desactivar a otro gerente.
      if (targetUser.role === Role.GERENTE) {
        throw new ForbiddenException('Un gerente no puede desactivar a otro gerente. Contacta al Administrador General.');
      }
    }

    // Borrado lógico: marca active = false en lugar de eliminar el registro.
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { active: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        branchId: true,
      },
    });

    // Log de auditoría básico en consola.
    console.log(`⚠️ Usuario desactivado: ${updatedUser.email} por ${currentUser.email}`);
    return {
      message: 'Usuario desactivado exitosamente',
      user: updatedUser,
    };
  }

  // ============================================================
  // 6. CAMBIAR CONTRASEÑA DEL USUARIO AUTENTICADO
  // ============================================================
  async changePassword(userId: number, data: { currentPassword: string; newPassword: string }) {
    if (!data.currentPassword || !data.newPassword) {
      throw new BadRequestException('Debes enviar la contraseña actual y la nueva contraseña.');
    }

    if (data.newPassword.length < 6) {
      throw new BadRequestException('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    if (data.currentPassword === data.newPassword) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.active) {
      throw new NotFoundException('Usuario no encontrado o inactivo.');
    }

    const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta.');
    }

    const hashedNewPassword = await bcrypt.hash(data.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    return {
      message: 'Contraseña actualizada correctamente.',
    };
  }
}