import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from  '@prisma/client';

export class UpdateOrderStatusDto {
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  @IsEnum(OrderStatus, {
    message: 'El estado debe ser: PREPARACION, ENVIADO, ENTREGADO o CANCELADO',
  })
  status: OrderStatus;
}