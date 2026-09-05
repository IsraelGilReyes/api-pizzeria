import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; 

@Module({
  imports: [PrismaModule, AuthModule], // Importa AuthModule para usar JwtAuthGuard y RolesGuard
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}