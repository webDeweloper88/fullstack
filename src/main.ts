import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { join } from 'path';
/**
 * NestJS ilovasini ishga tushirish uchun bootstrap funksiyasi.
 *
 * Ushbu funksiya quyidagi vazifalarni bajaradi:
 * - NestJS ilovasini yaratadi va konfiguratsiya xizmatini oladi.
 * - Global validatsiya quvurlarini (ValidationPipe) o‘rnatadi.
 * - CORS sozlamalarini konfiguratsiya qiladi.
 * - Swagger yordamida API hujjatlarini yaratadi va sozlaydi.
 * - Ilovani belgilangan portda ishga tushiradi va konsolga kerakli ma’lumotlarni chiqaradi.
 * - Xatolik yuz bersa, uni konsolga chiqaradi va jarayonni to‘xtatadi.
 *
 * @async
 * @function
 * @returns {Promise<void>} Hech qanday qiymat qaytarmaydi, faqat ilovani ishga tushiradi.
 */
async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule); // NestJS ilovasini yaratish
    const configService = app.get(ConfigService); // ConfigService orqali konfiguratsiya xizmatini olish
    const port = configService.getOrThrow<number>('APP_PORT'); // Konfiguratsiyadan port raqamini olish

    app.useGlobalPipes(
      // Global validatsiya quvurlarini o‘rnatish
      new ValidationPipe({
        transform: true, // So‘rovlarni avtomatik ravishda DTO'ga o‘zgartirish
        whitelist: true, // Faqat ruxsat berilgan maydonlarni qabul qilish
        forbidNonWhitelisted: true, // Ruxsat berilmagan maydonlar bo‘lsa, xatolik qaytarish
      }),
    );

    // app.enableCors({
    //   // CORS sozlamalarini yoqish
    //   origin: configService.getOrThrow<string>('CORS_ORIGIN'),
    //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    //   credentials: true,
    // });
    app.enableCors({
    // Включение CORS с поддержкой нескольких источников
      origin: (origin, callback) => {
        const allowedOrigins = configService.getOrThrow<string>('CORS_ORIGIN').split(',');
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
    },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
});

    app.use(cookieParser());

    // 👉 Раздача статики
    app.use('/api', express.static(join(__dirname, '..', 'public')));

    const configSwager = new DocumentBuilder()
      .setTitle('NestJS API') // Swagger hujjatlari uchun sarlavha
      .setDescription('API documentation for NestJS application') // Swagger hujjatlari uchun tavsif
      .setVersion('1.0') // Swagger hujjatlari uchun versiya
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Введите access token',
          in: 'header',
        },
        'JWT-auth', // <-- Название схемы
      )
      .addOAuth2(
        {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
              tokenUrl: 'https://oauth2.googleapis.com/token',
              scopes: {
                email: 'Access your email address',
                profile: 'Access your basic profile info',
              },
            },
          },
        },
        'google-oauth', // 👈 это название схемы
      )
      .addOAuth2(
        {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://oauth.yandex.com/authorize',
              tokenUrl: 'https://oauth.yandex.com/token',
              scopes: {},
            },
          },
        },
        'yandex-oauth', // 👈 название схемы
      )
      .build(); // Swagger konfiguratsiyasini yaratish

    const document = SwaggerModule.createDocument(app, configSwager);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        oauth2RedirectUrl: 'http://localhost:3000/api/oauth2-redirect.html',
      },
    });

    await app.listen(port); // Ilovani belgilangan portda ishga tushirish
    console.log(`Application is running on: http://localhost:${port}/api`); // Ilova ishga tushirilganda konsolga chiqarish
    console.log(
      `Cors_Orign : ${configService.getOrThrow<string>('CORS_ORIGIN')}`, // CORS origin konfiguratsiyasini konsolga chiqarish
    );
  } catch (error) {
    console.error('Ishga tushirishda xatolik yuz berdi:', error); // Xatolikni diagnostika qilish uchun loglash
    process.exit(1);
  }
}
bootstrap();
