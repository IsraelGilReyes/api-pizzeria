import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TestController } from './test/test.controller';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { BranchesModule } from './branches/branches.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    
    PrismaModule,
    AuthModule,
    BranchesModule,
    ProductsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    OrdersModule,
  ],
  controllers: [AppController, TestController],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Guard global a nivel de aplicación
    },
  ],
})
export class AppModule {}
