import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '../jwt.types';

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  // JWT strategiyasini yaratish
  constructor(config: ConfigService) {
    // ConfigService orqali JWT sozlamalarini olish
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // JWT tokenini olish uchun extractorlar
        (request: Request) => {
          // Authorization headeridan tokenni olish
          if (!request || !request.headers) return null; // agar request yoki headers bo'lmasa, null qaytarish
          const authHeader = request.headers['authorization']; // Authorization headerini olish
          return authHeader?.startsWith('Bearer ') // agar header "Bearer " bilan boshlansa
            ? authHeader.split(' ')[1] // tokenni olish
            : null; // aks holda null qaytarish
        },
      ]),
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'), // JWT tokenini tekshirish uchun sirli kalit
      passReqToCallback: true, // raw tokenni olish uchun muhim
    });
  }

  validate(req: Request, payload: JwtPayload) {
    // JWT tokeni muvaffaqiyatli tekshirilganda chaqiriladi
    const refreshToken = req?.headers['authorization'] // Authorization headeridan tokenni olish
      ?.replace('Bearer ', '') // agar header mavjud bo'lsa, "Bearer " prefiksini olib tashlash
      ?.trim(); // tokenni tozalash

    return {
      // request.user sifatida mavjud bo'ladi
      ...payload, // payloadni qo'shish
      refreshToken, // refresh tokenni qo'shish
      sessionId: payload.sessionId,
    };
  }
}
