import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  BadRequestException,
  Res,
  UseGuards,
  Patch,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from 'src/jwt/decorators/public.decorator';
import { RequestMetaData } from 'src/access-log/types/request-meta.type';
import { LoginDto } from './dto/login.dto';
import { RequestMeta } from 'src/access-log/decarators/request-meta.decorator';
import { Request, Response } from 'express';
import { AtGuard } from 'src/jwt/guards/at.guard';
import { CurrentUser } from 'src/jwt/decorators/current-user.decorator';
import { JwtPayload } from 'src/jwt/jwt.types';
import { RtGuard } from 'src/jwt/guards/rt.guard';
import { SetPasswordDto } from './dto/set-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(201)
  @ApiOkResponse({ description: 'Письмо для подтверждения отправлено' })
  @ApiBadRequestResponse({ description: 'Некорректные данные' })
  @ApiOperation({
    summary: 'Регистрация нового пользователя',
  })
  register(@Body() dto: RegisterDto, @RequestMeta() meta: RequestMetaData) {
    return this.authService.register(dto, meta);
  }

  @Public()
  @Get('verify-email')
  @ApiOkResponse({ description: 'Email успешно подтверждён' })
  @ApiNotFoundResponse({ description: 'Токен недействителен' })
  @ApiBadRequestResponse({ description: 'Email уже подтверждён' })
  @ApiOperation({
    summary: 'Подтверждение Email по токену',
  })
  verifyEmail(
    @Query('token') token: string,
    @RequestMeta() meta: RequestMetaData,
  ) {
    if (!token) {
      throw new BadRequestException('Токен обязателен');
    }

    return this.authService.verifyEmail(token, meta);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Повторная отправка письма для подтверждения Email',
  })
  @ApiOkResponse({ description: 'Письмо отправлено' })
  @ApiBadRequestResponse({ description: 'Email уже подтверждён' })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  resendEmailVerification(
    @Body() dto: ResendVerificationDto,
    @RequestMeta() meta: RequestMetaData,
  ) {
    return this.authService.resendVerification(dto, meta);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Вход пользователя' })
  @ApiOkResponse({ description: 'Успешный вход' })
  @ApiUnauthorizedResponse({ description: 'Неверные данные или 2FA включён' })
  login(
    @Body() dto: LoginDto,
    @RequestMeta() meta: RequestMetaData,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto, meta, res);
  }

  @UseGuards(AtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'выход из системы',
  })
  @Patch('logout')
  @UseGuards(AtGuard)
  @Post('logout')
  @ApiOperation({
    summary: 'Выход из системы (удаление refresh токена и сессии)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Вы успешно вышли из системы' })
  async logout(
    @CurrentUser('sub') userId: string,
    @CurrentUser() payload: JwtPayload,
    @RequestMeta() meta: RequestMetaData,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.logout(userId, meta, res);

    return { message: 'Вы вышли из системы' };
  }

  @UseGuards(RtGuard)
  @Post('refresh')
  @ApiOperation({ summary: 'Обновить access токен по refresh токену' })
  @ApiBearerAuth('JWT-refresh')
  @ApiResponse({ status: 200, description: 'Access токен успешно обновлён' })
  async refreshTokens(
    @CurrentUser('sub') userId: string,
    @CurrentUser() payload: JwtPayload,
    @RequestMeta() meta: RequestMetaData,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ access_token: string }> {
    const refreshToken = meta.refreshToken;
    if (!refreshToken) {
      throw new BadRequestException('Refresh token обязателен');
    }

    return this.authService.refresh(
      userId,
      payload.sessionId,
      refreshToken,
      res,
      meta,
    );
  }

  @Post('set-password')
  @UseGuards(AtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Установить пароль OAuth-пользователю' })
  @ApiResponse({ status: 200, description: 'Пароль успешно установлен' })
  async setPassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: SetPasswordDto,
    @RequestMeta() meta: RequestMetaData,
  ) {
    await this.authService.setPassword(userId, dto.password, meta);
    return { message: 'Пароль успешно установлен' };
  }
}
