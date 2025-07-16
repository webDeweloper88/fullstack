import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountStatus,
  LogEventType,
  Prisma,
  User,
  UserRole,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserProfileDto } from './dto/user-profile.dto';
import { USER_ERRORS } from 'src/common/constants/errors';
import { UpdateUserProfileDto } from './dto/update-user.profile.dto';
import * as bcrypt from 'bcrypt';
import { AccessLogDto } from './dto/access-log.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestMetaData } from 'src/access-log/types/request-meta.type';
import { AccessLogService } from 'src/access-log/access-log.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly accessLogService: AccessLogService,
  ) {}

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName ?? '',
      pictureUrl: user.picktureUrl ?? '',
      role: user.role,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
  async updateProfile(
    userId: string,
    dto: UpdateUserProfileDto,
  ): Promise<UserProfileDto> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    const updated = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        picktureUrl: dto.pictureUrl,
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName ?? '',
      pictureUrl: updated.picktureUrl ?? '',
      role: updated.role,
      accountStatus: updated.accountStatus,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    meta: RequestMetaData,
  ) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.hash);

    if (!isMatch) {
      throw new BadRequestException('Неверный текущий пароль');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prismaService.user.update({
      where: { id: userId },
      data: { hash: newHash },
    });
    await this.accessLogService.logEvent(
      userId,
      LogEventType.PASSWORD_CHANGED,
      meta,
    );

    return { message: 'Пароль успешно изменен' };
  }

  async getMyAccessLogs(userId: string): Promise<AccessLogDto[]> {
    const logs = await this.prismaService.accessLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((log) => ({
      id: log.id,
      eventType: log.eventType,
      ipAddress: log.ipAddress ?? '',
      userAgent: log.userAgent ?? '',
      createdAt: log.createdAt,
    }));
  }

  async getAccessLogsByAdmin(userId: string): Promise<AccessLogDto[]> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    const logs = await this.prismaService.accessLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((log) => ({
      id: log.id,
      eventType: log.eventType,
      ipAddress: log.ipAddress ?? '',
      userAgent: log.userAgent ?? '',
      createdAt: log.createdAt,
    }));
  }

  async enable2FA(userId: string, secret: string) {
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true,
        twoFactorExpiresAt: null, // если используешь TTL
      },
    });

    return { message: '2FA включена' };
  }

  async disable2FA(userId: string) {
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: null,
        twoFactorEnabled: false,
        twoFactorExpiresAt: null,
      },
    });

    return { message: '2FA отключена' };
  }

  // --- Internal methods ---
  /**
   * Найти пользователя по ID
   */
  async findByIdInternal(userId: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { id: userId },
    });
  }
  async createUserInternal(data: {
    email: string;
    hash: string;
    displayName?: string;
    emailVerified: boolean;
    emailVerificationToken: string;
    emailVerificationTokenExpiresAt?: Date;
    accountStatus: AccountStatus;
  }): Promise<User> {
    const existing = await this.prismaService.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException(USER_ERRORS.ALREADY_EXISTS);
    }

    return this.prismaService.user.create({
      data: {
        email: data.email,
        hash: data.hash,
        displayName: data.displayName ?? '',
        emailVerified: data.emailVerified,
        emailVerificationToken: data.emailVerificationToken,
        emailVerificationTokenExpiresAt: data.emailVerificationTokenExpiresAt, // <-- добавлено
        accountStatus: data.accountStatus,
      },
    });
  }

  /**
   * Найти пользователя по email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { email },
    });
  }

  /**
   * Установить hash пароля напрямую (например, при сбросе пароля)
   */
  async updatePassword(userId: string, newHash: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { hash: newHash },
    });
  }

  /**
   * Установить emailVerified в true
   */
  async markEmailVerified(userId: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
        accountStatus: AccountStatus.ACTIVE,
      },
    });
  }

  /**
   * Установить token для верификации email
   */
  async setEmailVerificationToken(
    userId: string,
    token: string,
    expiresAt: Date, // предполагается, что expiresAt передаётся в метод
  ): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
        emailVerificationTokenExpiresAt: expiresAt, // предполагается, что expiresAt передаётся в метод
      },
    });
  }

  /**
   * Найти пользователя по токену подтверждения email
   */
  async findByEmailVerificationToken(token: string): Promise<User | null> {
    return this.prismaService.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationTokenExpiresAt: {
          gte: new Date(), // токен должен быть ещё действителен
        },
      },
    });
  }

  async updateRefreshToken(userId: string, hashedRt: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { hashRt: hashedRt },
    });
  }

  async findByOAuth(provider: string, providerId: string) {
    return this.prismaService.user.findFirst({
      where: {
        OAuthAccount: {
          some: {
            provider,
            providerId,
          },
        },
      },
    });
  }

  async createOAuthUser(
    email: string,
    displayName?: string,
    picktureUrl?: string,
  ): Promise<User> {
    return this.prismaService.user.create({
      data: {
        email,
        hash: '', // Без пароля
        displayName: displayName ?? null,
        picktureUrl: picktureUrl ?? null,
        emailVerified: true,
        role: 'user',
        accountStatus: AccountStatus.ACTIVE,
      },
    });
  }
}
