import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { USER_ERRORS } from 'src/common/constants/errors';

@Injectable()
export class RolesGuard implements CanActivate {
  // Guard - bu NestJS da so'rovlarni tekshirish uchun ishlatiladigan mexanizm
  constructor(private reflector: Reflector) {} // Guard yaratilganda chaqiriladi

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY, // Bu yerda dekorator orqali olingan rollarni olish
      [context.getHandler(), context.getClass()], // Bu yerda dekorator orqali olingan rollarni olish
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      // Agar rollar ko'rsatilmagan bo'lsa
      return true; // agar rollar ko'rsatilmagan bo'lsa, kirishga ruxsat beramiz
    }

    const request = context.switchToHttp().getRequest(); // HTTP so'rovini olish
    const user = request.user; // Foydalanuvchi ma'lumotlarini olish

    if (!user || !requiredRoles.includes(user.role)) {
      // Agar foydalanuvchi ma'lumotlari mavjud bo'lmasa yoki foydalanuvchi roli kerakli rollardan biri bo'lmasa
      throw new ForbiddenException(USER_ERRORS.NOT_ENOUGH_PRIVILEGES); //   Foydalanuvchiga kerakli rollarga ega emasligi haqida xato tashlanadi
    }

    return true;
  }
}
// Ushbu Guard foydalanuvchida resursga kirish uchun zarur rollar bor-yo‘qligini tekshiradi.
