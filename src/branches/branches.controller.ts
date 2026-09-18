import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { AuthGuard } from '@nestjs/passport';

import { BranchesService } from './branches.service';

import { CreateBranchDto } from './dto/create-branch.dto';

import { UpdateBranchDto } from './dto/update-branch.dto';

import { RolesGuard } from '../common/guards/roles.guard';

import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Branches')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @ApiOperation({ summary: 'Crear una sucursal' })
  @Post()
  @Roles('GERENTE')
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @ApiOperation({ summary: 'Obtener todas las sucursales' })
  @Get()
  findAll() {
    return this.branchesService.findAll();
  }

  @ApiOperation({ summary: 'Obtener una sucursal por ID' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.branchesService.findOne(id);
  }

  @ApiOperation({ summary: 'Actualizar una sucursal' })
  @Put(':id')
  @Roles('GERENTE')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @ApiOperation({ summary: 'Eliminar una sucursal' })
  @Delete(':id')
  @Roles('GERENTE')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.branchesService.remove(id);
  }
}