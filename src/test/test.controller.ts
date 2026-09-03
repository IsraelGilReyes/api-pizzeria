import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

@Controller('test')
export class TestController {
  
  @Public() // Gracias al decorador, este endpoint no pedirá JWT
  @Get('public')
  getPublic() {
    return { message: 'API Pizzería - Endpoint público disponible' };
  }

  // Sin decorador, este endpoint está protegido globalmente por JwtAuthGuard
  @Get('protected')
  getProtected() {
    return { message: 'Acceso autorizado al módulo interno de la Pizzería' };
  }
}