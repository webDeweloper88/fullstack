import {
  Controller,
  Get,
  Delete,
  Req,
  Param,
  UseGuards,
  HttpCode,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AtGuard } from 'src/jwt/guards/at.guard';
import { CurrentUser } from 'src/jwt/decorators/current-user.decorator';
import { SessionService } from './session.service';
import { SessionDto } from './dto/session.dto';
import { SESSION_ERRORS } from '../common/constants/errors';

@ApiTags('Sessions')
@ApiBearerAuth('JWT-auth')
@UseGuards(AtGuard)
@Controller('users/me/sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  @ApiOperation({ summary: 'Получить активные сессии пользователя' })
  @ApiResponse({ status: 200, type: [SessionDto] })
  async getMySessions(
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
  ): Promise<{ sessions: SessionDto[] }> {
    try {
      const ip = this.extractClientIp(req);
      const sessions = await this.sessionService.getSessionsByUserId(
        userId,
        ip,
      );
      return { sessions };
    } catch {
      throw new HttpException(
        SESSION_ERRORS.FETCH_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('all')
  @HttpCode(204)
  @ApiOperation({ summary: 'Выйти со всех устройств, включая текущее' })
  async deleteAllSessions(@CurrentUser('sub') userId: string): Promise<void> {
    await this.sessionService.deleteAllUserSessions(userId); // ❗ не deleteSessionOfUser!
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Завершить конкретную сессию (другое устройство)' })
  async deleteMySession(
    @CurrentUser('sub') userId: string,
    @Param('id') sessionId: string,
  ): Promise<void> {
    await this.sessionService.deleteSessionOfUser(userId, sessionId);
  }

  @Delete()
  @HttpCode(204)
  @ApiOperation({ summary: 'Выйти со всех устройств, кроме текущего' })
  async deleteOtherSessions(
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
  ): Promise<void> {
    const ip = this.extractClientIp(req);
    await this.sessionService.deleteOtherSessions(userId, ip);
  }

  private extractClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip ?? 'unknown';
  }
}
