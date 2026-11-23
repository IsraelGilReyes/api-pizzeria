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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Crear una orden (LOCAL o DOMICILIO)' })
  @Post()
  @Roles('ADMIN_GENERAL', 'GERENTE', 'CAJERO')
  create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    return this.ordersService.create(createOrderDto, req.user);
  }

  @ApiOperation({ summary: 'Obtener órdenes (filtradas por sucursal salvo ADMIN_GENERAL)' })
  @Get()
  findAll(@Request() req: any) {
    return this.ordersService.findAll(req.user);
  }

  @ApiOperation({ summary: 'Obtener una orden por ID' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.ordersService.findOne(id, req.user);
  }

  @ApiOperation({ summary: 'Actualizar el estado de una orden' })
  @Patch(':id/status')
  @Roles('ADMIN_GENERAL', 'GERENTE', 'CAJERO', 'REPARTIDOR', 'COCINA')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Request() req: any,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto, req.user);
  }
}