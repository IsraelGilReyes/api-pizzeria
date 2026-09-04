import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  // Guardar nueva sucursal en la base de datos
  async create(createBranchDto: CreateBranchDto) {
    return this.prisma.branch.create({
      data: createBranchDto,
    });
  }

  // Obtener la lista de todas las sucursales
  async findAll() {
    return this.prisma.branch.findMany();
  }

  // Buscar una sucursal por su ID
  async findOne(id: number) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new NotFoundException(`Sucursal con ID ${id} no encontrada`);
    }
    return branch;
  }

  // Actualizar una sucursal por su ID
  async update(id: number, updateBranchDto: UpdateBranchDto) {
    // Verificar si la sucursal existe
    await this.findOne(id);

    return this.prisma.branch.update({
      where: { id },
      data: updateBranchDto,
    });
  }

  // Eliminar una sucursal por su ID
  async remove(id: number) {
    // Verificar si la sucursal existe
    await this.findOne(id);

    return this.prisma.branch.delete({
      where: { id },
    });
  }
}