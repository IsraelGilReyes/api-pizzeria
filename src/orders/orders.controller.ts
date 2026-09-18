import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { OrdersService } from './orders.service';

import { CreateOrderDto } from './dto/create-order.dto';

import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

import { Roles } from '../common/decorators/roles.decorator';

import { RolesGuard } from '../common/guards/roles.guard';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Solo Gerente y Cajero pueden crear órdenes
  @ApiOperation({ summary: 'Crear una orden' })
  @Post()
  @Roles('GERENTE', 'CAJERO')
  create(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req: any,
  ) {
    return this.ordersService.create(
      createOrderDto,
      req.user.userId,
    );
  }

  @ApiOperation({ summary: 'Obtener todas las órdenes' })
  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @ApiOperation({ summary: 'Obtener una orden por ID' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  // Actualización de estado del pedido por rol asignado
  @ApiOperation({ summary: 'Actualizar el estado de una orden' })
  @Patch(':id/status')
  @Roles('GERENTE', 'CAJERO', 'REPARTIDOR', 'COCINA')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Request() req: any,
  ) {
    return this.ordersService.updateStatus(
      id,
      updateOrderStatusDto,
      req.user.role,
    );
  }
}