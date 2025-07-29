import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UserService } from 'src/user/user.service';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { AUTH_ERRORS, USER_ERRORS } from 'src/common/constants/errors';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { AccountStatus, LogEventType, User } from '@prisma/client';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { RedisService } from '../redis/redis.service';
import { AccessLogService } from 'src/access-log/access-log.service';
import { RequestMetaData } from 'src/access-log/types/request-meta.type';
import { LoginDto } from './dto/login.dto';
import { JwtService } from 'src/jwt/jwt.service';
import { Response } from 'express';
import { SessionService } from 'src/session/session.service';
import * as ms from 'ms';
import { AdminUserService } from 'src/user/admin-user.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  // This service can be used to handle authentication logic, such as validating users,
  // generating tokens, etc. For now, it's empty but can be expanded as needed.
  constructor(
    private readonly userService: UserService,
    private readonly adminUserService: AdminUserService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService, // Assuming RedisService is imported and available
    private readonly accessLogService: AccessLogService, // Assuming AccessLogService is imported and available
    private readonly jwtService: JwtService, // Assuming TokenService is imported and available
    private readonly sessionService: SessionService, // Assuming SessionService is imported and available
    private readonly prismaServivce: PrismaService, // Assuming PrismaService is imported and available
  ) {}

  async register(
    dto: RegisterDto,
    meta: RequestMetaData,
  ): Promise<{ message: string }> {
    // 1. Проверка на существование пользователя
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(USER_ERRORS.ALREADY_EXISTS);
    }

    // 2. Хеширование пароля
    const hash = await bcrypt.hash(dto.password, 10);

    // 3. Генерация verificationToken и его срок действия
    const emailVerificationToken = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 час

    // 4. Создание пользователя
    const user = await this.userService.createUserInternal({
      email: dto.email,
      hash,
      displayName: dto.displayName,
      emailVerified: false,
      emailVerificationToken,
      emailVerificationTokenExpiresAt: expiresAt,
      accountStatus: AccountStatus.PENDING,
    });

    // 5. Генерация ссылки подтверждения
    const confirmUrl = `${this.configService.getOrThrow(
      'CORS_ORIGIN',
    )}/auth/verify-email?token=${emailVerificationToken}`;

    // 6. Отправка письма
    await this.mailService.sendMail({
      to: dto.email,
      subject: 'Подтверждение Email',
      templateName: 'verify-email',
      context: { url: confirmUrl },
    });

    // 7. Логирование события
    await this.accessLogService.logEvent(user.id, LogEventType.REGISTER, meta);

    return { message: 'Регистрация прошла успешно. Подтвердите email.' };
  }

  async verifyEmail(
    token: string,
    meta: RequestMetaData,
  ): Promise<{ message: string }> {
    const user = await this.userService.findByEmailVerificationToken(token);

    console.log('[user found]', user?.id);
    if (!user) {
      throw new NotFoundException(USER_ERRORS.EMAIL_VERIFICATION_TOKEN_INVALID);
    }

    if (user.emailVerified) {
      throw new BadRequestException(USER_ERRORS.EMAIL_ALREADY_VERIFIED);
    }

    const now = new Date();
    if (
      user.emailVerificationTokenExpiresAt &&
      user.emailVerificationTokenExpiresAt < now
    ) {
      throw new BadRequestException(
        USER_ERRORS.EMAIL_VERIFICATION_TOKEN_EXPIRED,
      );
    }

    await this.userService.markEmailVerified(user.id);
    await this.accessLogService.logEvent(
      user.id,
      LogEventType.EMAIL_VERIFIED,
      meta,
    );
    return { message: 'Email успешно подтверждён' };
  }
  async resendVerification(
    dto: ResendVerificationDto,
    meta: RequestMetaData,
  ): Promise<{ message: string }> {
    const redisKey = `email:resend:${dto.email}`;
    const redisAttemptsKey = `email:resend:attempts:${dto.email}`;

    // 1. Проверка частоты (ограничение: 1 запрос в 60 секунд)
    const cooldown = await this.redisService.get(redisKey);
    if (cooldown) {
      throw new BadRequestException(
        'Письмо уже было отправлено. Подождите немного.',
      );
    }

    // 2. Найти пользователя
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    if (user.emailVerified) {
      throw new BadRequestException(USER_ERRORS.EMAIL_ALREADY_VERIFIED);
    }

    // 3. Проверка количества попыток (макс 5 в час)
    const attemptsStr = await this.redisService.get(redisAttemptsKey);
    const attempts = parseInt(attemptsStr ?? '0');

    if (attempts >= 5) {
      // 3.1 Блокируем пользователя
      await this.adminUserService.blockAccount(
        user.id,
        meta,
        'Слишком много попыток подтверждения email',
      );
      throw new BadRequestException(
        'Слишком много попыток. Аккаунт временно заблокирован.',
      );
    }

    // 4. Генерация токена
    const verificationToken = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 минут

    // 5. Обновляем токен в БД
    await this.userService.setEmailVerificationToken(
      user.id,
      verificationToken,
      expiresAt,
    );

    // 6. Обновляем Redis:
    await this.redisService.set(redisKey, '1', 60); // Cooldown 60 сек
    await this.redisService.set(
      redisAttemptsKey,
      (attempts + 1).toString(),
      3600, // TTL: 1 час
    );

    // 7. Формируем ссылку
    const confirmUrl = `${this.configService.getOrThrow('CORS_ORIGIN')}/auth/verify-email?token=${verificationToken}`;

    // 8. Отправляем письмо
    await this.mailService.sendMail({
      to: dto.email,
      subject: 'Подтверждение Email',
      templateName: 'verify-email',
      context: { url: confirmUrl },
    });

    // 9. Логируем событие
    await this.accessLogService.logEvent(
      user.id,
      LogEventType.EMAIL_RESEND,
      meta,
    );

    return { message: 'Письмо повторно отправлено' };
  }

  async login(
    dto: LoginDto,
    meta: RequestMetaData,
    res: Response,
  ): Promise<{ message: string; access_token?: string }> {
    const user = await this.userService.findByEmail(dto.email);

    if (!user || !(await bcrypt.compare(dto.password, user.hash))) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException(AUTH_ERRORS.ACCOUNT_NOT_ACTIVE);
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(AUTH_ERRORS.EMAIL_NOT_VERIFIED);
    }

    if (user.twoFactorEnabled) {
      await this.accessLogService.logEvent(
        user.id,
        LogEventType.LOGIN_2FA_REQUIRED,
        meta,
      );
      return { message: 'Требуется двухфакторная аутентификация' };
    }

    // ⏱ Расчёт времени жизни refresh токена
    const refreshTtlStr = this.configService.getOrThrow(
      'JWT_REFRESH_EXPIRES_IN',
    );
    const refreshTtlMs = Number(ms(refreshTtlStr));

    // 🗂️ Создаём сессию в PostgreSQL
    const session = await this.sessionService.createSession({
      userId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      expiresAt: new Date(Date.now() + refreshTtlMs),
    });

    // 🔐 Генерация пары токенов
    const tokens = await this.jwtService.generateTokens(user.id, {
      email: user.email,
      role: user.role,
      client: meta.client,
      sessionId: session.id, // 👈 передаём sessionId
    });

    // 🧠 Сохраняем refresh токен в Redis
    await this.redisService.set(
      `session:${session.id}`,
      tokens.refresh_token,
      refreshTtlMs / 1000, // TTL в секундах
    );

    // 🍪 Устанавливаем refresh_token в httpOnly cookie
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: refreshTtlMs,
      path: '/',
    });

    // 🧾 Логирование
    await this.accessLogService.logEvent(
      user.id,
      LogEventType.LOGIN_SUCCESS,
      meta,
    );

    return {
      message: 'Успешный вход',
      access_token: tokens.access_token,
    };
  }

  async logout(
    userId: string,
    meta: RequestMetaData,
    res: Response,
  ): Promise<void> {
    const logger = new Logger(AuthService.name);
    const { sessionId } = meta;
    console.log('sessionId in logout:', sessionId);
    try {
      if (sessionId) {
        // 🧠 Удаление refresh токена из Redis
        await this.redisService.del(`session:${sessionId}`);

        // 🗂️ Удаление сессии из PostgreSQL
        await this.sessionService.deleteSessionById(sessionId);
      }

      // 🍪 Очистка куки
      res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
      });

      // 🧾 Логирование события выхода
      await this.accessLogService.logEvent(userId, LogEventType.LOGOUT, meta);
    } catch (error) {
      logger.error(`Logout failed for user ${userId}:`, error.stack);
    }
  }

  async refresh(
    userId: string,
    sessionId: string,
    refreshToken: string,
    res: Response,
    meta: RequestMetaData,
  ): Promise<{ access_token: string }> {
    if (!sessionId || !refreshToken) {
      throw new ForbiddenException('Недопустимый запрос');
    }

    // Проверяем, что refresh_token актуален
    const stored = await this.redisService.get(`session:${sessionId}`);
    if (stored !== refreshToken) {
      throw new ForbiddenException('Недействительный токен');
    }

    const user = await this.userService.findByIdInternal(userId);
    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    const refreshTtlStr = this.configService.getOrThrow(
      'JWT_REFRESH_EXPIRES_IN',
    );
    const refreshTtlMs = Number(ms(refreshTtlStr));

    const newTokens = await this.jwtService.generateTokens(user.id, {
      email: user.email,
      role: user.role,
      sessionId,
      client: meta.client,
    });

    // Обновляем refresh token в Redis
    await this.redisService.set(
      `session:${sessionId}`,
      newTokens.refresh_token,
      refreshTtlMs / 1000,
    );

    // Обновляем cookie
    res.cookie('refresh_token', newTokens.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: refreshTtlMs,
      path: '/',
    });

    return { access_token: newTokens.access_token };
  }

  async loginWithOAuth(
    user: User,
    meta: RequestMetaData,
    res: Response,
  ): Promise<{ message: string; access_token?: string }> {
    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException(AUTH_ERRORS.ACCOUNT_NOT_ACTIVE);
    }

    // ⏱ Расчёт времени жизни refresh токена
    const refreshTtlStr = this.configService.getOrThrow(
      'JWT_REFRESH_EXPIRES_IN',
    );
    const refreshTtlMs = Number(ms(refreshTtlStr));

    // 🗂️ Создаём сессию в PostgreSQL
    const session = await this.sessionService.createSession({
      userId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      expiresAt: new Date(Date.now() + refreshTtlMs),
    });

    // 🔐 Генерация пары токенов
    const tokens = await this.jwtService.generateTokens(user.id, {
      email: user.email,
      role: user.role,
      client: meta.client,
      sessionId: session.id,
    });

    // 🧠 Сохраняем refresh токен в Redis
    await this.redisService.set(
      `session:${session.id}`,
      tokens.refresh_token,
      refreshTtlMs / 1000,
    );

    // 🍪 Устанавливаем refresh_token в httpOnly cookie
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: refreshTtlMs,
      path: '/',
    });

    // 🧾 Логирование входа через OAuth
    await this.accessLogService.logEvent(
      user.id,
      LogEventType.LOGIN_OAUTH_SUCCESS, // 👈 добавь в enum
      meta,
    );

    return {
      message: 'OAuth вход выполнен',
      access_token: tokens.access_token,
    };
  }
  // src/auth/auth.service.ts
  async setPassword(
    userId: string,
    newPassword: string,
    meta: RequestMetaData,
  ): Promise<void> {
    const user = await this.prismaServivce.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    if (user.hash) {
      throw new BadRequestException('Пароль уже установлен');
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await this.prismaServivce.user.update({
      where: { id: userId },
      data: { hash },
    });

    await this.accessLogService.logEvent(
      userId,
      LogEventType.PASSWORD_SET_OAUTH_SUCCESS,
      meta,
    );
  }
}
