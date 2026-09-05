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
      },
    });

    const token = this.jwtService.sign({ 
      sub: user.id, 
      email: user.email,
      role: user.role,
    });
    
    console.log(`✅ Usuario registrado: ${user.email} con rol: ${user.role}`);
    
    return { 
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    };
  }

  // Nuevo método para registro de gerentes (solo para admin/gerentes)
  async registerManager(data: RegisterDto, currentUser: any) {
    // Verificar que el usuario actual es GERENTE
    if (currentUser.role !== Role.GERENTE) {
      throw new ForbiddenException('Solo los gerentes pueden registrar otros gerentes');
    }

    // Verificar que se está intentando registrar un gerente
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
      },
    });

    const token = this.jwtService.sign({ 
      sub: user.id, 
      email: user.email,
      role: user.role,
    });
    
    console.log(`✅ Gerente registrado: ${user.email}`);
    
    return { 
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    };
  }

  // Método administrativo exclusivo para gerentes
  async updateUserRole(userId: number, updateUserRoleDto: UpdateUserRoleDto, currentUser: any) {
    // Verificar que el usuario actual es GERENTE
    if (currentUser.role !== Role.GERENTE) {
      throw new ForbiddenException('Solo los gerentes pueden cambiar roles de usuarios');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // No permitir que un gerente cambie el rol de otro gerente (excepto si es necesario)
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
      },
    });
  }

  // Método original de login (sin cambios)
  async login(data: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ 
      where: { email: data.email } 
    });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Credenciales inválidas');

    const token = this.jwtService.sign({ 
      sub: user.id, 
      email: user.email,
      role: user.role,
    });
    
    console.log(`Usuario logueado: ${user.email} con rol: ${user.role}`);
    
    return { 
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    };
  }
}