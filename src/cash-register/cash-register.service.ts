import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenCashRegisterDto } from './dto/open-cash-register.dto';
import { CashRegisterStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class CashRegisterService {
  constructor(private readonly prisma: PrismaService) {}

  // Inicializar Caja (Solo Gerente)
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
      },
      include: {
        openedBy: { select: { id: true, name: true, email: true } },
        branch: true,
      },
    });
  }

  // Finalizar Caja (Solo Gerente)
  async close(id: number) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id },
    });

    if (!register) {
      throw new NotFoundException(`Caja con ID ${id} no encontrada.`);
    }

    if (register.status === CashRegisterStatus.CLOSED) {
      throw new BadRequestException('Esta caja ya ha sido cerrada previamente.');
    }

    const closeTime = new Date();

    // Sumar el total de las órdenes ENTREGADAS desde que se abrió la caja
    const ordersSummary = await this.prisma.order.aggregate({
      _sum: {
        total: true,
      },
      where: {
        branchId: register.branchId,
        status: OrderStatus.ENTREGADO,
        createdAt: {
          gte: register.openedAt,
          lte: closeTime,
        },
      },
    });

    const generatedAmount = ordersSummary._sum.total ? Number(ordersSummary._sum.total) : 0;
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

  // Consultar caja activa por sucursal
  async getActiveRegister(branchId: number) {
    const register = await this.prisma.cashRegister.findFirst({
      where: {
        branchId,
        status: CashRegisterStatus.OPEN,
      },
      include: {
        openedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!register) {
      throw new NotFoundException('No hay ninguna caja abierta en esta sucursal.');
    }

    return register;
  }
}