import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // 👈 Ajustado
import { RolesGuard } from '../common/guards/roles.guard';        
import { Roles } from '../common/decorators/roles.decorator';


@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles('ADMIN_GENERAL')
  create(@Body() createBranchDto: CreateBranchDto, @Req() req: any) {
    return this.branchesService.create(createBranchDto, req.user);
  }

  @Get()
  @Roles('ADMIN_GENERAL', 'GERENTE')
  findAll(@Req() req: any) {
    return this.branchesService.findAll(req.user);
  }

  @Get(':id')
  @Roles('ADMIN_GENERAL', 'GERENTE', 'CAJERO', 'COCINA', 'REPARTIDOR')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.branchesService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles('ADMIN_GENERAL', 'GERENTE')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBranchDto: UpdateBranchDto,
    @Req() req: any,
  ) {
    return this.branchesService.update(id, updateBranchDto, req.user);
  }

  @Delete(':id')
  @Roles('ADMIN_GENERAL')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.branchesService.remove(id, req.user);
  }
}