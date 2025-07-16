import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/jwt/decorators/roles.decorator';
import { UserProfileDto } from './dto/user-profile.dto';
import { USER_ERRORS } from 'src/common/constants/errors';
import { CreateUserByAdminDto } from './dto/create-user.admin.dto';
import { AdminUserService } from './admin-user.service';
import { FilterUsersDto } from './dto/filter-users.dto';
import { UpdateUserAdminDto } from './dto/update-user.admin.dto';
import { RequestMeta } from 'src/access-log/decarators/request-meta.decorator';
import { RequestMetaData } from 'src/access-log/types/request-meta.type';
import { CurrentUser } from 'src/jwt/decorators/current-user.decorator';
import { AtGuard } from 'src/jwt/guards/at.guard';
import { RolesGuard } from 'src/jwt/guards/roles.guard';

@ApiTags('Admin / Users')
@ApiBearerAuth('JWT-auth')
@Controller('admin/users')
@Roles(UserRole.admin)
@UseGuards(AtGuard, RolesGuard)
export class AdminUserController {
  constructor(private readonly userAdminService: AdminUserService) {}

  @Post('create-user-by-admin')
  @ApiOkResponse({
    type: UserProfileDto,
    description: 'Создан новый пользователь',
  })
  @ApiForbiddenResponse({ description: USER_ERRORS.FORBIDDEN })
  @ApiConflictResponse({ description: USER_ERRORS.ALREADY_EXISTS })
  @ApiOperation({
    summary: 'Создание нового пользователя администратором',
  })
  createByAdmin(@Body() dto: CreateUserByAdminDto) {
    return this.userAdminService.createUserByAdmin(dto);
  }

  @Get('find-all')
  @ApiOkResponse({
    description: 'Список пользователей с фильтрацией и пагинацией',
  })
  @ApiOperation({
    summary:
      'Получение списка пользователей с фильтрацией и пагинацией (admin only)',
  })
  getAll(@Query() dto: FilterUsersDto) {
    return this.userAdminService.findAll(dto);
  }

  @Get('find-by-id/:id')
  @ApiParam({ name: 'id', type: String, description: 'ID пользователя' })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiNoContentResponse({ description: USER_ERRORS.NOT_FOUND })
  @ApiForbiddenResponse({ description: USER_ERRORS.FORBIDDEN })
  @ApiOperation({
    summary: 'Получение пользователя по ID (admin only)',
  })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userAdminService.findById(id);
  }

  @Patch('update-by-admin/:id')
  @ApiParam({ name: 'id', type: String, description: 'ID пользователя' })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiForbiddenResponse({ description: USER_ERRORS.FORBIDDEN })
  @ApiNoContentResponse({ description: USER_ERRORS.NOT_FOUND })
  @ApiOperation({
    summary: 'Обновление Role пользователя администратором',
  })
  updateByAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserAdminDto,
  ) {
    return this.userAdminService.updateByAdmin(id, dto);
  }

  @Delete('delete-by-admin/:id')
  @ApiParam({ name: 'id', type: String, description: 'ID пользователя' })
  @ApiOkResponse({ description: 'Пользователь помечен как удалён' })
  @ApiNoContentResponse({ description: USER_ERRORS.NOT_FOUND })
  @ApiForbiddenResponse({ description: USER_ERRORS.FORBIDDEN })
  @ApiOperation({
    summary: 'Удаление пользователя администратором',
  })
  deleteByAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.userAdminService.deleteByAdmin(id);
  }

  @Patch('/users/:id/block')
  @ApiOperation({
    summary: 'Блокировка пользователя администратором',
  })
  blockUser(
    @Param('id') userId: string,
    @RequestMeta() meta: RequestMetaData,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.userAdminService.blockAccount(userId, meta, adminId);
  }

  @Patch('/users/:id/unblock')
  @Roles(UserRole.admin)
  @ApiOperation({
    summary: 'Разблокировка пользователя администратором',
  })
  unblockUser(
    @Param('id') userId: string,
    @RequestMeta() meta: RequestMetaData,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.userAdminService.unblockAccount(userId, meta, adminId);
  }
}
