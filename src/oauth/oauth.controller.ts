import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthService } from './oauth.service';
import { Request, Response } from 'express';
import { RequestMetaData } from 'src/access-log/types/request-meta.type';
import {
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { parseClientFromUserAgent } from 'src/common/utils/parse-user-agent';
import { AtGuard } from 'src/jwt/guards/at.guard';
import { CurrentUser } from 'src/jwt/decorators/current-user.decorator';
import { OAuthProvider } from './enums/oauth-provider.enum';
import { GetOAuthAccountsQueryDto } from './dto/oauth-account-response.dto';
import { RequestMeta } from 'src/access-log/decarators/request-meta.decorator';

@ApiTags('OAuth')
@Controller('auth/oauth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @Get('google')
  @ApiOperation({ summary: 'Перенаправление на Google OAuth' })
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Перенаправление обрабатывается стратегией
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({
    status: 302,
    description:
      'Успешный вход через Google. Редирект на фронтенд с access_token',
  })
  @ApiResponse({ status: 401, description: 'OAuth user not found' })
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
    @RequestMeta() meta: RequestMetaData,
  ) {
    if (!req.user) {
      return res.status(401).json({ message: 'OAuth user not found' });
    }

    const oauthUser = req.user as {
      provider: string;
      providerId: string;
      email: string;
      accessToken: string;
      refreshToken?: string;
      displayName?: string;
      pictureUrl?: string;
    };

    const result = await this.oauthService.handleOAuthLogin(
      oauthUser,
      meta,
      res,
    );

    return res.redirect(
      `http://localhost:5173/oauth/success?access_token=${result.access_token}`,
    );
  }

  // oauth.controller.ts
  @Delete('disconnect/:provider')
  @UseGuards(AtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Удаление привязки OAuth-аккаунта (например, Google)',
  })
  @ApiParam({
    name: 'provider',
    enum: OAuthProvider,
    description: 'OAuth провайдер',
  })
  @ApiResponse({ status: 200, description: 'OAuth-аккаунт успешно удалён' })
  @ApiResponse({
    status: 400,
    description: 'Нельзя удалить последний способ входа',
  })
  @ApiResponse({ status: 404, description: 'OAuth-аккаунт не найден' })
  async disconnectOAuth(
    @Param('provider') provider: string,
    @CurrentUser('sub') userId: string,
  ) {
    if (!Object.values(OAuthProvider).includes(provider as OAuthProvider)) {
      throw new BadRequestException(
        `Провайдер "${provider}" не поддерживается`,
      );
    }

    return this.oauthService.disconnectProvider(userId, provider);
  }
  @Get('accounts')
  @UseGuards(AtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Список привязанных OAuth-аккаунтов' })
  @ApiResponse({
    status: 200,
    description:
      'Список OAuth-аккаунтов пользователя с пагинацией и фильтрацией',
  })
  async getConnectedAccounts(
    @CurrentUser('sub') userId: string,
    @Query() query: GetOAuthAccountsQueryDto,
  ) {
    const { provider, page, limit } = query;
    return this.oauthService.getConnectedProviders(
      userId,
      provider,
      page,
      limit,
    );
  }

  @Get('yandex')
  @ApiOperation({ summary: 'Перенаправление на Yandex OAuth' })
  @UseGuards(AuthGuard('yandex'))
  async yandexAuth() {
    // Редирект на yandex handled автоматически
  }

  @Get('yandex/callback')
  @ApiOperation({ summary: 'Yandex OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Успешный вход через Yandex. Редирект на фронт с access_token',
  })
  @ApiResponse({ status: 401, description: 'OAuth user not found' })
  @UseGuards(AuthGuard('yandex'))
  async yandexCallback(
    @Req() req: Request,
    @Res() res: Response,
    @RequestMeta() meta: RequestMetaData,
  ) {
    if (!req.user) {
      return res.status(401).json({ message: 'OAuth user not found' });
    }

    const oauthUser = req.user as {
      provider: string;
      providerId: string;
      email: string;
      accessToken: string;
      refreshToken?: string;
      displayName?: string;
      pictureUrl?: string;
    };

    const result = await this.oauthService.handleOAuthLogin(
      oauthUser,
      meta,
      res,
    );

    return res.redirect(
      `http://localhost:5173/oauth/success?access_token=${result.access_token}`,
    );
  }
}
