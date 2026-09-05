import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

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

    // 2. Calcular total verificando los precios de cada producto
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

    // 3. Crear la orden y sus items en la base de datos
    return this.prisma.order.create({
      data: {
        userId,
        branchId,
        total,
        status: 'PENDING',
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

  async updateStatus(id: number, status: string) {
    await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }
}