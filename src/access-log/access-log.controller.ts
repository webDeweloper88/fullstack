import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AccessLogService } from './access-log.service';
import { GetAccessLogDto } from './dto/get-access-log.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AtGuard } from 'src/jwt/guards/at.guard';
import { RolesGuard } from 'src/jwt/guards/roles.guard';
import { Roles } from 'src/jwt/decorators/roles.decorator';

@ApiTags('Access Logs')
@ApiBearerAuth('JWT-auth')
@UseGuards(AtGuard, RolesGuard)
@Controller('access-log')
export class AccessLogController {
  constructor(private readonly accessLogService: AccessLogService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Просмотр логов доступа (только для админов)' })
  async getLogs(@Query() query: GetAccessLogDto) {
    return this.accessLogService.getLogs(query);
  }
}
