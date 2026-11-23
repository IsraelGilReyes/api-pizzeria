import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ProductsService } from './products.service';

import { CreateProductDto } from './dto/create-product.dto';

import { UpdateProductDto } from './dto/update-product.dto';

import { Roles } from '../common/decorators/roles.decorator';

import { RolesGuard } from '../common/guards/roles.guard';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Solo GERENTE puede crear productos
  @ApiOperation({ summary: 'Crear un producto' })
  @Post()
  @Roles('GERENTE')
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  // Cualquier usuario autenticado puede consultar productos
  @ApiOperation({ summary: 'Obtener todos los productos' })
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // Cualquier usuario autenticado puede consultar un producto
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  // Solo GERENTE puede actualizar productos
  @ApiOperation({ summary: 'Actualizar un producto' })
  @Put(':id')
  @Roles('GERENTE')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  // Solo GERENTE puede eliminar productos
  @ApiOperation({ summary: 'Eliminar un producto' })
  @Delete(':id')
  @Roles('GERENTE')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}