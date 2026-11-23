// src/auth/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;          // ID del usuario autenticado
    email: string;           // Email del usuario
    role: Role;              // Rol del usuario (enum Prisma)
    branchId?: number | null; // Sucursal asociada (null para admin general)
  };
}

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Iniciar sesión' })
  @Post('login')
  @Public()
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Registrar un Gerente (Solo Admin General)' })
  @Post('register/manager')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_GENERAL')
  async registerManager(
    @Body() registerDto: RegisterDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authService.registerManager(registerDto, req.user);
  }

  @ApiOperation({ summary: 'Registrar personal para una sucursal (Cajero, Cocina, Repartidor)' })
  @Post('register/staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_GENERAL', 'GERENTE')
  async registerStaff(
    @Body() registerDto: RegisterDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authService.registerStaff(registerDto, req.user);
  }

  @ApiOperation({ summary: 'Actualizar el rol y/o sucursal de un usuario' })
  @Patch('users/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_GENERAL', 'GERENTE')
  async updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authService.updateUserRole(
      id,
      updateUserRoleDto,
      req.user,
    );
  }

  @ApiOperation({ summary: 'Desactivar un usuario de la sucursal o sistema' })
  @Patch('users/:id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_GENERAL', 'GERENTE')
  async deactivateUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authService.deactivateUser(id, req.user);
  }

  /**
   * CAMBIAR CONTRASEÑA DEL USUARIO AUTENTICADO
   * Requiere token JWT válido. Cualquier rol autenticado puede cambiar su propia contraseña.
   */
  @ApiOperation({ summary: 'Cambiar la contraseña del usuario autenticado' })
  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId ?? (req.user as any).sub ?? (req.user as any).id;
    return this.authService.changePassword(userId, changePasswordDto);
  }
}