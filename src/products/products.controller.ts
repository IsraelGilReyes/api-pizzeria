import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
@UseGuards(RolesGuard) // Activa el interceptor de validación de roles
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // SOLO el usuario con rol GERENTE puede crear productos
  @Post()
  @Roles('GERENTE')
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  // Cualquier usuario autenticado puede ver el catálogo de productos
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  // SOLO el usuario con rol GERENTE puede actualizar productos
    @Put(':id')
  @Roles('GERENTE')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  // SOLO el usuario con rol GERENTE puede eliminar productos
  @Delete(':id')
  @Roles('GERENTE')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}