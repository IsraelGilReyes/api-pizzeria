import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, Role } from '@prisma/client';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto, userId: number) {
    const { branchId, items } = createOrderDto;

    // 1. Verificar existencia de la sucursal
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundException(`Sucursal con ID ${branchId} no encontrada`);
    }

    // 2. Calcular total
    let total = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        throw new NotFoundException(`Producto con ID ${item.productId} no encontrado`);
      }
      
      const itemPrice = Number(product.price);
      total += itemPrice * item.quantity;

      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
      });
    }

    // 3. Crear la orden e iniciar con el estado por defecto PENDIENTE
    return this.prisma.order.create({
      data: {
        userId,
        branchId,
        total,
        status: OrderStatus.PENDIENTE,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        branch: true,
        items: { include: { product: true } },
      },
    });
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        branch: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    return order;
  }

  async updateStatus(id: number, updateOrderStatusDto: UpdateOrderStatusDto, userRole: Role) {
    await this.findOne(id);
    const newStatus: OrderStatus = updateOrderStatusDto.status;

    // Arreglo explícitamente tipado como OrderStatus[] para evitar errores de compilación
    const allowedForCajeroAndRepartidor: OrderStatus[] = [
      OrderStatus.ENVIADO,
      OrderStatus.ENTREGADO,
    ];

    // Validación de permisos por rol para el cambio de estado
    if (userRole === Role.GERENTE) {
      // El Gerente puede cambiar a cualquier estado
    } else if (userRole === Role.CAJERO || userRole === Role.REPARTIDOR) {
      if (!allowedForCajeroAndRepartidor.includes(newStatus)) {
        throw new ForbiddenException(
          `El rol ${userRole} solo puede cambiar el estado a ENVIADO o ENTREGADO`,
        );
      }
    } else if (userRole === Role.COCINA) {
      if (newStatus !== OrderStatus.PREPARACION) {
        throw new ForbiddenException(
          'El personal de Cocina solo puede cambiar el estado a PREPARACION',
        );
      }
    } else {
      throw new ForbiddenException('No tienes permisos para modificar el estado del pedido');
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: newStatus },
    });
  }
}