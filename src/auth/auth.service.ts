import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client'; // <-- Importar el enum
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Mapear string a enum de Prisma
  private mapRole(role?: string): Role {
    if (role === 'GERENTE') return Role.GERENTE;
    if (role === 'COCINA') return Role.COCINA;
    if (role === 'REPARTIDOR') return Role.REPARTIDOR;
    return Role.CAJERO; // Por defecto
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
        role: this.mapRole(data.role), // <-- Usar el mapper
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
    
    console.log(`✅ Usuario logueado: ${user.email} con rol: ${user.role}`);
    
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