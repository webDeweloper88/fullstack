import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

// .env fayldan o'zgaruvchilarni yuklash
dotenv.config();

// Bu funksiya ConfigService orqali NODE_ENV o'zgaruvchisi 'development' ekanligini tekshiradi
export const isDev = (configService: ConfigService) =>
  configService.getOrThrow('NODE_ENV') === 'development';

// Bu o'zgaruvchi NODE_ENV 'development' bo'lsa true qiymat qaytaradi
export const IS_DEV_ENV = process.env.NODE_ENV === 'development';
