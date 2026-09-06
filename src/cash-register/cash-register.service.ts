import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenCashRegisterDto } from './dto/open-cash-register.dto';
import { CashRegisterStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class CashRegisterService {
  constructor(private readonly prisma: PrismaService) {}

  async open(openDto: OpenCashRegisterDto, userId: number) {
    // 1. Verificar si ya existe una caja abierta en la sucursal
    const activeRegister = await this.prisma.cashRegister.findFirst({
      where: {
        branchId: openDto.branchId,
        status: CashRegisterStatus.OPEN,
      },
    });

    if (activeRegister) {
      throw new BadRequestException('Ya existe una caja abierta en esta sucursal.');
    }

    // 2. Abrir la nueva caja
    return this.prisma.cashRegister.create({
      data: {
        initialAmount: openDto.initialAmount,
        branchId: openDto.branchId,
        openedById: userId,
        status: CashRegisterStatus.OPEN,
        generatedAmount: 0,
        totalAmount: openDto.initialAmount,
      },
      include: {
        openedBy: { select: { id: true, name: true, email: true } },
        branch: true,
      },
    });
  }

  async close(id: number) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id },
      include: {
        orders: {
          where: {
            status: OrderStatus.ENTREGADO,
          },
          select: {
            total: true,
          },
        },
        openedBy: { select: { id: true, name: true, email: true } },
        branch: true,
      },
    });

    if (!register) {
      throw new NotFoundException(`Caja con ID ${id} no encontrada.`);
    }

    if (register.status === CashRegisterStatus.CLOSED) {
      throw new BadRequestException('Esta caja ya ha sido cerrada previamente.');
    }

    const closeTime = new Date();

    // Calcular el total de órdenes ENTREGADAS asociadas a esta caja
    let generatedAmount = 0;
    if (register.orders && register.orders.length > 0) {
      generatedAmount = register.orders.reduce((sum, order) => {
        return sum + Number(order.total);
      }, 0);
    }

    const initialAmount = Number(register.initialAmount);
    const totalAmount = initialAmount + generatedAmount;

    // Actualizar y cerrar la caja
    return this.prisma.cashRegister.update({
      where: { id },
      data: {
        generatedAmount,
        totalAmount,
        status: CashRegisterStatus.CLOSED,
        closedAt: closeTime,
      },
      include: {
        openedBy: { select: { id: true, name: true, email: true } },
        branch: true,
      },
    });
  }

  async getActiveRegister(branchId: number) {
    const register = await this.prisma.cashRegister.findFirst({
      where: {
        branchId,
        status: CashRegisterStatus.OPEN,
      },
      include: {
        openedBy: { select: { id: true, name: true, email: true } },
        branch: true,
        orders: {
          where: {
            status: OrderStatus.ENTREGADO,
          },
          select: {
            id: true,
            total: true,
            createdAt: true,
          },
        },
      },
    });

    if (!register) {
      throw new NotFoundException('No hay ninguna caja abierta en esta sucursal.');
    }

    return register;
  }
}