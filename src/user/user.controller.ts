import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Query,
  UseGuards,
  Delete,
  Post,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiBearerAuth,
  ApiTags,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { UserProfileDto } from './dto/user-profile.dto';
import { CurrentUser } from 'src/jwt/decorators/current-user.decorator';
import { UpdateUserProfileDto } from './dto/update-user.profile.dto';
import { Roles } from 'src/jwt/decorators/roles.decorator';
import { AccountStatus, UserRole } from '@prisma/client';
import { USER_ERRORS } from 'src/common/constants/errors';
import { FilterUsersDto } from './dto/filter-users.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AtGuard } from 'src/jwt/guards/at.guard';
import { RolesGuard } from 'src/jwt/guards/roles.guard';
import { UpdateUserAdminDto } from './dto/update-user.admin.dto';
import { CreateUserByAdminDto } from './dto/create-user.admin.dto';
import { AccessLogDto } from './dto/access-log.dto';
import { QRCodeDto } from './dto/qr-code.dto';
import { TwoFactorAuthService } from 'src/two-factor-auth/two-factor-auth.service';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestMetaData } from 'src/access-log/types/request-meta.type';
import { RequestMeta } from 'src/access-log/decarators/request-meta.decorator';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(AtGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly prismaService: PrismaService,
    private readonly twoFAService: TwoFactorAuthService, // Injecting TwoFactorAuthService to use its methods
  ) {}

  @Get('profile')
  @ApiOkResponse({
    type: UserProfileDto,
    description: 'Профиль текущего пользователя',
  })
  @ApiOperation({
    summary: 'Получение профиля текущего пользователя',
  })
  getMe(@CurrentUser('sub') userId: string): Promise<UserProfileDto> {
    console.log('Decoded user from token:', userId);
    return this.userService.getProfile(userId);
  }

  @Patch('update-profile')
  @ApiOkResponse({ type: UserProfileDto })
  @ApiOperation({
    summary: 'Обновление профиля текущего пользователя',
  })
  updateMe(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.userService.updateProfile(userId, dto);
  }

  @Patch('me/change-password')
  @ApiOkResponse({ description: 'Пароль успешно изменен' })
  @ApiBadRequestResponse({ description: 'Неверный текущий пароль' })
  @ApiOperation({
    summary: 'Изменение пароля текущего пользователя',
  })
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
    @RequestMeta() meta: RequestMetaData,
  ) {
    return this.userService.changePassword(userId, dto, meta);
  }

  @Get('me/access-logs')
  @ApiOkResponse({
    type: [AccessLogDto],
    description: 'История входов пользователя',
  })
  @ApiOperation({
    summary: 'Получение истории входов текущего пользователя',
  })
  getAccessLogs(@CurrentUser('sub') userId: string) {
    return this.userService.getMyAccessLogs(userId);
  }

  @Roles(UserRole.admin)
  @Get(':id/access-logs')
  @ApiParam({ name: 'id', type: String, description: 'ID пользователя' })
  @ApiOkResponse({
    type: [AccessLogDto],
    description: 'История входов пользователя (admin only)',
  })
  @ApiNotFoundResponse({ description: USER_ERRORS.NOT_FOUND })
  @ApiForbiddenResponse({ description: USER_ERRORS.FORBIDDEN })
  @ApiOperation({
    summary: 'Получение истории входов пользователя администратором',
  })
  getAccessLogsByAdmin(@Param('id', ParseUUIDPipe) userId: string) {
    return this.userService.getAccessLogsByAdmin(userId);
  }

  @HttpCode(200)
  @Post('me/2fa/setup')
  @ApiOkResponse({
    type: QRCodeDto,
    description: 'QR-код и секрет для настройки 2FA',
  })
  @ApiOperation({
    summary: 'Настройка 2FA для текущего пользователя',
  })
  async setup2FA(@CurrentUser('sub') userId: string): Promise<QRCodeDto> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new Error('User not found');
    }
    const { base32, otpauthUrl } = this.twoFAService.generateSecret(user.email);
    if (!otpauthUrl) {
      throw new Error('Failed to generate otpauthUrl for 2FA setup');
    }
    const qrCodeImage = await this.twoFAService.generateQRCode(otpauthUrl);

    return { qrCodeImage, secret: base32 };
  }

  @HttpCode(200)
  @Post('me/2fa/verify')
  @ApiOkResponse({ description: '2FA успешно включена' })
  @ApiOperation({
    summary: 'Верификация 2FA для текущего пользователя',
  })
  async verify2FA(
    @CurrentUser('sub') userId: string,
    @Body() dto: Verify2FADto,
  ) {
    const isValid = this.twoFAService.verifyCode(dto.secret, dto.token);

    if (!isValid) {
      throw new BadRequestException('Неверный код 2FA');
    }

    return this.userService.enable2FA(userId, dto.secret);
  }
}
