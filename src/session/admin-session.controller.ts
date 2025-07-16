import {
  Controller,
  Get,
  Query,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminSessionService } from './admin-session.service';
import { GetSessionsQueryDto } from './dto/get-sessions-query.dto';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiOkResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SessionDto } from './dto/session.dto';

@ApiTags('Admin / Sessions')
@ApiBearerAuth('JWT-auth')
@Controller('admin/sessions')
export class AdminSessionController {
  constructor(private readonly sessionService: AdminSessionService) {}

  @Get()
  @ApiOperation({
    summary: 'Получить список всех сессий (фильтрация, пагинация)',
  })
  @ApiOkResponse({ type: [SessionDto] })
  async getAllSessions(
    @Query() query: GetSessionsQueryDto,
  ): Promise<{ sessions: SessionDto[]; total: number }> {
    return this.sessionService.getAllSessions(query);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Получить все сессии пользователя по ID' })
  @ApiParam({ name: 'userId', required: true })
  @ApiOkResponse({ type: [SessionDto] })
  async getUserSessions(
    @Param('userId') userId: string,
  ): Promise<SessionDto[]> {
    return this.sessionService.getUserSessions(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить сессию по ID' })
  @ApiParam({ name: 'id', required: true })
  async deleteSession(@Param('id') sessionId: string): Promise<void> {
    await this.sessionService.deleteSessionById(sessionId);
  }

  @Delete('user/:userId')
  @ApiOperation({ summary: 'Удалить все сессии конкретного пользователя' })
  @ApiParam({ name: 'userId', required: true })
  async deleteSessionsByUserId(
    @Param('userId') userId: string,
  ): Promise<{ count: number }> {
    const count = await this.sessionService.deleteSessionsByUserId(userId);
    return { count };
  }

  @Delete()
  @ApiOperation({ summary: 'Удалить все сессии в системе (осторожно!)' })
  async deleteAllSessions(): Promise<{ count: number }> {
    const count = await this.sessionService.deleteAllSessions();
    return { count };
  }
}
