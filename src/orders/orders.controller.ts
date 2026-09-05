import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('orders')
@UseGuards(RolesGuard) // Intercepta y valida los permisos por rol
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // SOLO el Gerente y el Cajero pueden registrar órdenes
  @Post()
  @Roles('GERENTE', 'CAJERO')
  create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    return this.ordersService.create(createOrderDto, req.user.userId);
  }

  // Consulta de pedidos disponible para personal autenticado
  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  // Actualización de estado del pedido 
  @Patch(':id/status')
  @Roles('GERENTE', 'CAJERO', 'REPARTIDOR') // Solo roles específicos pueden actualizar el estado
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.ordersService.updateStatus(id, status);
  }
}