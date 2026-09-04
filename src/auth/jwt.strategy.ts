import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'CLAVE_SECRETA_JWT_SUPER_SEGURA',
    });
  }

  async validate(payload: any) {
    console.log('🔍 Validando JWT:', payload); // <-- Log para depuración
    
    return { 
      userId: payload.sub, 
      email: payload.email,
      role: payload.role, // <-- AGREGAR EL ROL
    };
  }
}