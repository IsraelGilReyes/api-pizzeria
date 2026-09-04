import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Inyecta la conexión a la base de datos
  controllers: [BranchesController],
  providers: [BranchesService],
})
export class BranchesModule {}