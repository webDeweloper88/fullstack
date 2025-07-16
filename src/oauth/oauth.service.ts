import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';
import { RequestMetaData } from 'src/access-log/types/request-meta.type';
import { Response } from 'express';
import { AccessLogService } from 'src/access-log/access-log.service';
import { LogEventType } from '@prisma/client';

@Injectable()
export class OAuthService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private userService: UserService,
    private accessLogService: AccessLogService,
  ) {}

  async handleOAuthLogin(
    oauthUser: {
      provider: string;
      providerId: string;
      email: string;
      accessToken: string;
      refreshToken?: string;
      displayName?: string;
      pictureUrl?: string;
    },
    meta: RequestMetaData,
    res: Response,
  ) {
    const { provider, providerId, email, accessToken, refreshToken } =
      oauthUser;

    let account = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerId: { provider, providerId } },
      include: { user: true },
    });

    if (!account) {
      let user = await this.userService.findByEmail(email);

      if (!user) {
        // 👤 Новый пользователь
        user = await this.userService.createOAuthUser(
          email,
          oauthUser.displayName,
          oauthUser.pictureUrl,
        );
      } else {
        // 🔗 Привязка к существующему пользователю
        await this.accessLogService.logEvent(
          user.id,
          LogEventType.LOGIN_OAUTH_SUCCESS,
          meta,
        );
      }

      // ✏️ Обновим имя/аватар, если они не заполнены
      if (!user.displayName || !user.picktureUrl) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            displayName: oauthUser.displayName ?? user.displayName,
            picktureUrl: oauthUser.pictureUrl ?? user.picktureUrl,
          },
        });
      }

      // 💾 Создаём OAuth аккаунт
      account = await this.prisma.oAuthAccount.create({
        data: {
          provider,
          providerId,
          email,
          accessToken,
          refreshToken,
          userId: user.id,
        },
        include: { user: true },
      });
    }

    // 🔄 Обновляем токены
    await this.prisma.oAuthAccount.update({
      where: { provider_providerId: { provider, providerId } },
      data: { accessToken, refreshToken },
    });

    // 🚀 Авторизация и возврат токенов
    return this.authService.loginWithOAuth(account.user, meta, res);
  }

  async disconnectProvider(userId: string, provider: string) {
    const account = await this.prisma.oAuthAccount.findFirst({
      where: {
        provider,
        userId,
      },
    });

    if (!account) {
      throw new NotFoundException(`OAuth аккаунт ${provider} не найден`);
    }

    // Получить пользователя и другие OAuth аккаунты
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { OAuthAccount: true },
    });

    if (!user) {
      throw new NotFoundException(`Пользователь с id ${userId} не найден`);
    }

    const otherOAuthAccounts = user.OAuthAccount.filter(
      (acc) => acc.provider !== provider,
    );

    const hasPassword = !!user.hash;

    // 🚫 Безопасность: если нет других способов входа, запретить отвязку
    if (!hasPassword && otherOAuthAccounts.length === 0) {
      throw new BadRequestException(
        'Вы не можете удалить последнюю OAuth-привязку без установленного пароля.',
      );
    }

    // Удалить привязку
    await this.prisma.oAuthAccount.delete({
      where: {
        provider_providerId: {
          provider: account.provider,
          providerId: account.providerId,
        },
      },
    });

    await this.accessLogService.logEvent(
      userId,
      LogEventType.OAUTH_DISCONNECT,
      {
        ipAddress: 'unknown',
        userAgent: 'unknown',
        client: 'web',
      },
    );

    return { message: `${provider} аккаунт успешно отвязан` };
  }

  // src/oauth/oauth.service.ts
  // src/oauth/oauth.service.ts
  async getConnectedProviders(
    userId: string,
    provider?: string,
    page = 1,
    limit = 10,
  ) {
    const where = {
      userId,
      ...(provider ? { provider } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.oAuthAccount.findMany({
        where,
        select: {
          provider: true,
          providerId: true,
          email: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.oAuthAccount.count({ where }),
    ]);

    return {
      total,
      page,
      limit,
      data,
    };
  }
}
