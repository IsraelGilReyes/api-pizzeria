import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType } from '@prisma/client';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @IsInt()
  @IsPositive()
  branchId: number;

  @IsEnum(OrderType, {
    message: 'El tipo de orden debe ser LOCAL o DOMICILIO',
  })
  @IsOptional()
  type?: OrderType = OrderType.LOCAL;

  @ValidateIf((o) => o.type === OrderType.DOMICILIO)
  @IsNotEmpty({
    message: 'El nombre del cliente es obligatorio para pedidos a domicilio',
  })
  @IsString({ message: 'El nombre del cliente debe ser texto' })
  customerName?: string;

  @ValidateIf((o) => o.type === OrderType.DOMICILIO)
  @IsNotEmpty({
    message: 'La dirección es obligatoria para pedidos a domicilio',
  })
  @IsString({ message: 'La dirección debe ser texto' })
  address?: string;

  @IsArray()
  @IsNotEmpty({ message: 'La orden debe contener al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}