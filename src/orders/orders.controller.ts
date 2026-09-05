import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard) // Intercepta y valida JWT y roles
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Solo Gerente y Cajero pueden crear órdenes
  @Post()
  @Roles('GERENTE', 'CAJERO')
  create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    return this.ordersService.create(createOrderDto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  // Actualización de estado del pedido por rol asignado
  @Patch(':id/status')
  @Roles('GERENTE', 'CAJERO', 'REPARTIDOR', 'COCINA')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Request() req: any,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto, req.user.role);
  }
}