import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  BadRequestException,
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

import { Public } from '../common/decorators/public.decorator';

import { Roles } from '../common/decorators/roles.decorator';

import { JwtAuthGuard } from './jwt-auth.guard';

import { RolesGuard } from '../common/guards/roles.guard';

import { Request } from 'express';

// Definir el tipo del usuario autenticado
interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
    role: string;
  };
}

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Registro público - siempre asigna CAJERO por defecto
  @ApiOperation({ summary: 'Registrar un usuario' })
  @Post('register')
  @Public()
  async register(@Body() registerDto: RegisterDto) {
    // Si se especifica rol GERENTE, lanza error
    if (registerDto.role === 'GERENTE') {
      throw new BadRequestException(
        'No puedes registrarte como gerente. Contacta con un gerente existente.',
      );
    }

    return this.authService.register(registerDto);
  }

  // Registro de gerentes - protegido
  @ApiOperation({ summary: 'Registrar un gerente' })
  @Post('register/manager')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GERENTE')
  async registerManager(
    @Body() registerDto: RegisterDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authService.registerManager(registerDto, req.user);
  }

  // Login público
  @ApiOperation({ summary: 'Iniciar sesión' })
  @Post('login')
  @Public()
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Actualizar rol de usuario - solo GERENTE
  @ApiOperation({ summary: 'Actualizar el rol de un usuario' })
  @Patch('users/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GERENTE')
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
}