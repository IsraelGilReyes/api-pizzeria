import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, Role, CashRegisterStatus } from '@prisma/client';
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

    // 2. Verificar que haya una caja abierta en la sucursal
    const activeRegister = await this.prisma.cashRegister.findFirst({
      where: {
        branchId,
        status: CashRegisterStatus.OPEN,
      },
    });

    if (!activeRegister) {
      throw new BadRequestException(
        'No hay una caja abierta en esta sucursal. No se pueden crear órdenes.'
      );
    }

    // 3. Calcular total
    let total = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({ 
        where: { id: item.productId } 
      });
      
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

    // 4. Crear la orden asociada a la caja activa
    return this.prisma.order.create({
      data: {
        userId,
        branchId,
        cashRegisterId: activeRegister.id, // Asociar la orden a la caja activa
        total,
        status: OrderStatus.PENDIENTE,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        branch: true,
        cashRegister: true, // Incluir información de la caja
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
        cashRegister: true,
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
        cashRegister: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    return order;
  }

  async updateStatus(id: number, updateOrderStatusDto: UpdateOrderStatusDto, userRole: Role) {
    // Obtener la orden con su caja asociada
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        cashRegister: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    const newStatus: OrderStatus = updateOrderStatusDto.status;

    // Arreglo de estados permitidos para Cajero y Repartidor
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

    // Si la orden se marca como ENTREGADO, actualizar la caja
    if (newStatus === OrderStatus.ENTREGADO && order.cashRegisterId) {
      // Verificar que la caja aún esté abierta
      const cashRegister = await this.prisma.cashRegister.findUnique({
        where: { id: order.cashRegisterId },
      });

      if (!cashRegister) {
        throw new NotFoundException(`Caja no encontrada`);
      }

      if (cashRegister.status === CashRegisterStatus.CLOSED) {
        throw new BadRequestException(
          'La caja asociada a esta orden ya está cerrada. No se puede marcar como entregada.'
        );
      }

      // Sumar el total de la orden al generatedAmount de la caja
      const currentGenerated = Number(cashRegister.generatedAmount) || 0;
      const orderTotal = Number(order.total);
      
      await this.prisma.cashRegister.update({
        where: { id: order.cashRegisterId },
        data: {
          generatedAmount: currentGenerated + orderTotal,
          totalAmount: Number(cashRegister.initialAmount) + currentGenerated + orderTotal,
        },
      });
    }

    // Actualizar el estado de la orden
    return this.prisma.order.update({
      where: { id },
      data: { status: newStatus },
      include: {
        user: { select: { id: true, name: true, email: true } },
        branch: true,
        cashRegister: true,
        items: { include: { product: true } },
      },
    });
  }
}