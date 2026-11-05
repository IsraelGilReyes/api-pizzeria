import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private mapRole(role?: string): Role {
    if (role === 'COCINA') return Role.COCINA;
    if (role === 'REPARTIDOR') return Role.REPARTIDOR;
    if (role === 'GERENTE') return Role.GERENTE;
    return Role.CAJERO; // Por defecto asigna CAJERO
  }

  async register(data: RegisterDto) {
    const userExists = await this.prisma.user.findUnique({ 
      where: { email: data.email } 
    });
    if (userExists) throw new BadRequestException('El correo ya está registrado');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: this.mapRole(data.role),
        branchId: data.branchId ?? null, // 👈 Asegúrate de guardar el branchId si viene en el DTO
      },
      include: { branch: true }, // 👈 Incluimos la relación para enviarla al frontend
    });

    const token = this.jwtService.sign({ 
      sub: user.id, 
      email: user.email,
      role: user.role,
      branchId: user.branchId, // 👈 Recomendado incluirlo también en el token JWT si lo usas
    });
    
    console.log(`✅ Usuario registrado: ${user.email} con rol: ${user.role}`);
    
    return { 
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId,       // 👈 ENVIADO AL FRONTEND
        branch: user.branch,           // 👈 ENVIADO AL FRONTEND
      }
    };
  }

  // Método para registro de gerentes
  async registerManager(data: RegisterDto, currentUser: any) {
    if (currentUser.role !== Role.GERENTE) {
      throw new ForbiddenException('Solo los gerentes pueden registrar otros gerentes');
    }

    if (data.role !== 'GERENTE') {
      throw new BadRequestException('Este método solo permite registrar usuarios con rol GERENTE');
    }

    const userExists = await this.prisma.user.findUnique({ 
      where: { email: data.email } 
    });
    if (userExists) throw new BadRequestException('El correo ya está registrado');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: Role.GERENTE,
        branchId: data.branchId ?? null, // 👈 Incluimos branchId
      },
      include: { branch: true },
    });

    const token = this.jwtService.sign({ 
      sub: user.id, 
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    });
    
    console.log(`✅ Gerente registrado: ${user.email}`);
    
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

  // Método administrativo para actualizar rol
  async updateUserRole(userId: number, updateUserRoleDto: UpdateUserRoleDto, currentUser: any) {
    if (currentUser.role !== Role.GERENTE) {
      throw new ForbiddenException('Solo los gerentes pueden cambiar roles de usuarios');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (user.role === Role.GERENTE && currentUser.id !== userId) {
      throw new ForbiddenException('No puedes modificar el rol de otro gerente');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: updateUserRoleDto.role as Role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branchId: true, // 👈 Incluimos branchId aquí también
        branch: true,
      },
    });
  }

  // Método de login actualizado para incluir branchId y branch
  async login(data: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ 
      where: { email: data.email },
      include: { branch: true }, // 👈 Hacemos include para traer la sucursal asociada
    });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Credenciales inválidas');

    const token = this.jwtService.sign({ 
      sub: user.id, 
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    });
    
    console.log(`Usuario logueado: ${user.email} con rol: ${user.role} y sucursal ID: ${user.branchId}`);
    
    return { 
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId, // 👈 ENVIADO AL FRONTEND
        branch: user.branch,     // 👈 ENVIADO AL FRONTEND
      }
    };
  }
}