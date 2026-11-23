// src/auth/jwt.strategy.ts

// Decorador de NestJS que marca la clase como proveedor inyectable.
import { Injectable } from '@nestjs/common';
// PassportStrategy: clase base para crear estrategias de Passport en NestJS.
import { PassportStrategy } from '@nestjs/passport';
// ExtractJwt: utilidades para extraer el token de la request (header, query, cookie…).
// Strategy: la estrategia JWT de passport-jwt que valida el token.
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * JwtStrategy
 *
 * Estrategia de Passport que valida los tokens JWT en cada request protegida.
 *
 * ¿Qué hace?
 * 1. Extrae el token del header `Authorization: Bearer <token>`.
 * 2. Verifica la firma usando la clave secreta configurada.
 * 3. Comprueba que el token no esté expirado.
 * 4. Llama a `validate()` con el payload decodificado.
 * 5. Lo que devuelve `validate()` se adjunta automáticamente a `req.user`.
 *
 * Es la pieza que "activa" el JwtAuthGuard: sin esta estrategia registrada
 * en AuthModule.providers, el guard `AuthGuard('jwt')` fallaría.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Constructor: configura la estrategia JWT.
   * `super({...})` pasa las opciones a la Strategy de passport-jwt.
   */
  constructor() {
    super({
      // Extrae el token del header "Authorization: Bearer <token>".
      // Alternativas: fromBodyField, fromQueryParameter, fromExtractors, etc.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // false = un token expirado será rechazado (comportamiento deseado).
      // Si fuera true, Passport aceptaría tokens caducados (no recomendado).
      ignoreExpiration: false,

      // Clave secreta usada para verificar la firma del JWT.
      // ⚠️ Debe coincidir EXACTAMENTE con la usada en JwtModule.register()
      // del AuthModule; si no, todos los tokens fallarán la verificación.
      // ⚠️ En producción, cárgala de variables de entorno (process.env.JWT_SECRET).
      secretOrKey: 'CLAVE_SECRETA_JWT_SUPER_SEGURA',
    });
  }

  /**
   * validate: se ejecuta DESPUÉS de que Passport verifica la firma y expiración.
   * Recibe el payload ya decodificado del JWT.
   *
   * Lo que retornes aquí se asigna automáticamente a `req.user` en cada request.
   * Si lanzas una excepción, la request se rechaza con 401.
   *
   * @param payload - Contenido del token (lo que firmó AuthService.login):
   *                  { sub, email, role, branchId, iat, exp }
   */
  async validate(payload: any) {


    // Devuelve el objeto que se adjuntará a `req.user`.
    // Los controladores acceden a estos campos vía @Req() req: AuthenticatedRequest.
    return { 
      userId: payload.sub,   // "sub" es el ID del usuario (estándar JWT).
      email: payload.email,
      role: payload.role,
      branchId: payload.branchId,  // ID de la sucursal del usuario.
      
    };
  }
}