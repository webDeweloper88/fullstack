import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../jwt.types';

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
  // JWT strategiyasini yaratish
  constructor(config: ConfigService) {
    // ConfigService orqali JWT sozlamalarini olish
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // JWT tokenini Authorization headeridan olish
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'), // JWT tokenini tekshirish uchun sirli kalit
    });
  }

  validate(payload: JwtPayload) {
    // JWT tokeni muvaffaqiyatli tekshirilganda chaqiriladi
    return payload;
  }
}
