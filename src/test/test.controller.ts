import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('test')
export class TestController {
  @Get('public')
  getPublic() {
    return { message: 'Endpoint público: Acceso concedido sin token' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('protected')
  getProtected() {
    return { message: 'Endpoint protegido: Token JWT verificado con éxito' };
  }
}