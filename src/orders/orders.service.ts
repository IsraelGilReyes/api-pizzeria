import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  OrderStatus,
  OrderType,
  Role,
  CashRegisterStatus,
} from '@prisma/client';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private getUserId(currentUser: any): number {
    return currentUser.sub ?? currentUser.userId ?? currentUser.id;
  }

  async create(createOrderDto: CreateOrderDto, currentUser: any) {
    const { branchId, items } = createOrderDto;
    const orderType = createOrderDto.type ?? OrderType.LOCAL;
    const isDelivery = orderType === OrderType.DOMICILIO;
    const userId = this.getUserId(currentUser);

    // 1. Validar aislamiento por sucursal si no es ADMIN_GENERAL
    if (currentUser.role !== Role.ADMIN_GENERAL && currentUser.branchId !== branchId) {
      throw new ForbiddenException(
        'No puedes crear órdenes en una sucursal distinta a la tuya.',
      );
    }

    // 2. Validar campos obligatorios según el tipo de orden
    if (isDelivery && (!createOrderDto.customerName?.trim() || !createOrderDto.address?.trim())) {
      throw new BadRequestException(
        'Para pedidos a domicilio se requieren customerName y address.',
      );
    }

    // 3. Verificar existencia de la sucursal
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundException(`Sucursal con ID ${branchId} no encontrada`);
    }

    // 4. Verificar que haya una caja abierta en la sucursal
    const activeRegister = await this.prisma.cashRegister.findFirst({
      where: {
        branchId,
        status: CashRegisterStatus.OPEN,
      },
    });

    if (!activeRegister) {
      throw new BadRequestException(
        'No hay una caja abierta en esta sucursal. No se pueden crear órdenes.',
      );
    }

    // 5. Calcular total y validar productos
    let total = 0;
    const orderItemsData: { productId: number; quantity: number }[] = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
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

    // 6. Crear la orden
    return this.prisma.order.create({
      data: {
        type: orderType,
        customerName: isDelivery
          ? createOrderDto.customerName!.trim()
          : createOrderDto.customerName?.trim() || 'Mostrador',
        address: isDelivery ? createOrderDto.address!.trim() : null,
        userId,
        branchId,
        cashRegisterId: activeRegister.id,
        total,
        status: OrderStatus.PENDIENTE,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        branch: true,
        cashRegister: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async findAll(currentUser: any) {
    const where =
      currentUser.role === Role.ADMIN_GENERAL
        ? {}
        : { branchId: currentUser.branchId ?? -1 };

    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        branch: true,
        cashRegister: true,
        items: { include: { product: true } },
      },
    });
  }

  async findOne(id: number, currentUser: any) {
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

    if (currentUser.role !== Role.ADMIN_GENERAL && order.branchId !== currentUser.branchId) {
      throw new ForbiddenException('No tienes permiso para consultar órdenes de otra sucursal.');
    }

    return order;
  }

  async updateStatus(
    id: number,
    updateOrderStatusDto: UpdateOrderStatusDto,
    currentUser: any,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        cashRegister: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    if (currentUser.role !== Role.ADMIN_GENERAL && order.branchId !== currentUser.branchId) {
      throw new ForbiddenException('No puedes modificar órdenes de otra sucursal.');
    }

    const newStatus: OrderStatus = updateOrderStatusDto.status;
    const userRole: Role = currentUser.role;

    const allowedForCajeroAndRepartidor: OrderStatus[] = [
      OrderStatus.ENVIADO,
      OrderStatus.ENTREGADO,
    ];

    if (userRole === Role.GERENTE || userRole === Role.ADMIN_GENERAL) {
      // Gerente y Admin General pueden cambiar a cualquier estado
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
      const cashRegister = await this.prisma.cashRegister.findUnique({
        where: { id: order.cashRegisterId },
      });

      if (!cashRegister) {
        throw new NotFoundException(`Caja no encontrada`);
      }

      if (cashRegister.status === CashRegisterStatus.CLOSED) {
        throw new BadRequestException(
          'La caja asociada a esta orden ya está cerrada. No se puede marcar como entregada.',
        );
      }

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