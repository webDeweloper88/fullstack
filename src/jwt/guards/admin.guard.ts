import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { USER_ERRORS } from 'src/common/constants/errors';

@Injectable()
export class AdminGuard implements CanActivate {
  // Guard - bu NestJS da so'rovlarni tekshirish uchun ishlatiladigan mexanizm
  constructor(private reflector: Reflector) {} // Guard yaratilganda chaqiriladi

  canActivate(context: ExecutionContext): boolean {
    // Guard ishga tushganda chaqiriladi
    const request = context.switchToHttp().getRequest(); // HTTP so'rovini olish
    const user = request.user; // Foydalanuvchi ma'lumotlari JWT dan olinadi

    if (!user || user.role !== UserRole.admin) {
      // Agar foydalanuvchi ma'lumotlari mavjud bo'lmasa yoki foydalanuvchi admin roli bo'lmasa
      throw new ForbiddenException(USER_ERRORS.NOT_ENOUGH_PRIVILEGES); // Foydalanuvchiga admin huquqlari yo'qligi haqida xato tashlanadi
    }

    return true; // Agar foydalanuvchi admin roli bo'lsa, true qaytariladi
  }
}
// Ushbu guard foydalanuvchining admin roli borligini tekshiradi.
