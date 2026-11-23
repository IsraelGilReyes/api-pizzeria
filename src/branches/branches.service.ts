import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Role } from '@prisma/client';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  // --- CREAR SUCURSAL (Exclusivo ADMIN_GENERAL) ---
  async create(createBranchDto: CreateBranchDto, currentUser: any) {
    if (currentUser.role !== Role.ADMIN_GENERAL) {
      throw new ForbiddenException('Solo el Administrador General puede crear nuevas sucursales.');
    }

    return await this.prisma.branch.create({
      data: createBranchDto,
    });
  }

  // --- OBTENER SUCURSALES (Admin General ve todas; Gerente ve solo la suya) ---
  async findAll(currentUser: any) {
    if (currentUser.role === Role.ADMIN_GENERAL) {
      return await this.prisma.branch.findMany({
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              active: true,
            },
          },
        },
      });
    }

    if (currentUser.role === Role.GERENTE) {
      if (!currentUser.branchId) {
        throw new ForbiddenException('No tienes ninguna sucursal asignada.');
      }
      const branch = await this.prisma.branch.findUnique({
        where: { id: currentUser.branchId },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              active: true,
            },
          },
        },
      });
      return [branch]; // Retornamos en arreglo para mantener consistencia en la respuesta
    }

    throw new ForbiddenException('No tienes permisos para ver el listado de sucursales.');
  }

  // --- OBTENER UNA SUCURSAL POR ID ---
  async findOne(id: number, currentUser: any) {
    if (currentUser.role === Role.GERENTE) {
      if (currentUser.branchId !== id) {
        throw new ForbiddenException('No tienes permitido consultar información de otra sucursal.');
      }
    } else if (currentUser.role !== Role.ADMIN_GENERAL) {
      if (currentUser.branchId !== id) {
        throw new ForbiddenException('No tienes permisos para consultar esta sucursal.');
      }
    }

    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Sucursal no encontrada.');
    }

    return branch;
  }

  // --- ACTUALIZAR SUCURSAL ---
  async update(id: number, updateBranchDto: UpdateBranchDto, currentUser: any) {
    if (currentUser.role === Role.GERENTE) {
      if (currentUser.branchId !== id) {
        throw new ForbiddenException('Solo puedes modificar la información de tu propia sucursal asignada.');
      }
    } else if (currentUser.role !== Role.ADMIN_GENERAL) {
      throw new ForbiddenException('No tienes permisos para modificar sucursales.');
    }

    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new NotFoundException('Sucursal no encontrada.');
    }

    return await this.prisma.branch.update({
      where: { id },
      data: updateBranchDto,
    });
  }

  // --- ELIMINAR SUCURSAL (Exclusivo ADMIN_GENERAL) ---
  async remove(id: number, currentUser: any) {
    if (currentUser.role !== Role.ADMIN_GENERAL) {
      throw new ForbiddenException('Solo el Administrador General puede eliminar sucursales.');
    }

    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: { users: true },
    });

    if (!branch) {
      throw new NotFoundException('Sucursal no encontrada.');
    }

    if (branch.users && branch.users.length > 0) {
      throw new BadRequestException('No se puede eliminar la sucursal porque tiene usuarios asociados.');
    }

    return await this.prisma.branch.delete({
      where: { id },
    });
  }
}