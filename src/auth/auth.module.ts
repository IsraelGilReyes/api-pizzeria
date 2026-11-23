// src/auth/auth.module.ts

// Importa el decorador Module de NestJS para definir un módulo.
import { Module } from '@nestjs/common';
// Servicio con la lógica de autenticación (lo provee este módulo).
import { AuthService } from './auth.service';
// Controlador que expone los endpoints de /auth (lo provee este módulo).
import { AuthController } from './auth.controller';
// Módulo de Prisma: provee el PrismaService para acceder a la BD.
import { PrismaModule } from '../prisma/prisma.module';
// PassportModule: integra Passport.js (estrategias de autenticación) en NestJS.
import { PassportModule } from '@nestjs/passport';
// JwtModule: utilidades para firmar y verificar tokens JWT.
import { JwtModule } from '@nestjs/jwt';
// Estrategia JWT personalizada que valida el token y adjunta el usuario a la request.
import { JwtStrategy } from './jwt.strategy';

/**
 * @Module define un módulo de NestJS.
 * Los módulos agrupan controladores, proveedores (servicios) e importaciones
 * relacionadas con una funcionalidad concreta. En este caso: autenticación.
 */
@Module({
  // imports: módulos externos que este módulo necesita para funcionar.
  imports: [
    // Hace disponible PrismaService (acceso a la base de datos) dentro de AuthModule.
    PrismaModule,

    // Registra Passport con "jwt" como estrategia por defecto.
    // Así, cuando un guard use Passport sin especificar estrategia,
    // se usará automáticamente la estrategia JWT.
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Configura JwtModule con la clave secreta y opciones de firma.
    // ⚠️ La clave está hardcodeada: en producción debería venir de variables de entorno.
    JwtModule.register({
      secret: 'CLAVE_SECRETA_JWT_SUPER_SEGURA',
      signOptions: { expiresIn: '1h' }, // El token expira en 1 hora
    }),
  ],

  // providers: clases que NestJS instanciará y podrá inyectar vía DI.
  providers: [
    AuthService,   // Lógica de login, registro, actualización y desactivación de usuarios.
    JwtStrategy,   // Estrategia que valida el JWT en cada request protegida.
  ],

  // controllers: endpoints HTTP que expone este módulo (/auth/...).
  controllers: [AuthController],

  // exports: lo que este módulo comparte con otros módulos que lo importen.
  // Se exportan PassportModule y JwtModule para que otros módulos puedan usar
  // los guards de Passport y firmar/verificar JWT sin reconfigurarlos.
  exports: [PassportModule, JwtModule],
})
export class AuthModule {}