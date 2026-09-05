import { Controller, Post, Patch, Get, Body, Param, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { OpenCashRegisterDto } from './dto/open-cash-register.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('cash-register')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  // Abrir caja (SOLO GERENTE)
  @Post('open')
  @Roles(Role.GERENTE)
  open(@Body() openDto: OpenCashRegisterDto, @Request() req: any) {
    return this.cashRegisterService.open(openDto, req.user.userId);
  }

  // Cerrar caja y calcular dinero generado por órdenes ENTREGADAS (SOLO GERENTE)
  @Patch(':id/close')
  @Roles(Role.GERENTE)
  close(@Param('id', ParseIntPipe) id: number) {
    return this.cashRegisterService.close(id);
  }

  // Consultar caja abierta de una sucursal
  @Get('active/:branchId')
  @Roles(Role.GERENTE, Role.CAJERO)
  getActiveRegister(@Param('branchId', ParseIntPipe) branchId: number) {
    return this.cashRegisterService.getActiveRegister(branchId);
  }
}