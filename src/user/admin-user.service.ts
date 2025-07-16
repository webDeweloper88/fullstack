import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserByAdminDto } from './dto/create-user.admin.dto';
import { USER_ERRORS } from 'src/common/constants/errors';
import * as bcrypt from 'bcrypt';
import { AccountStatus, LogEventType, Prisma, UserRole } from '@prisma/client';
import { UserProfileDto } from './dto/user-profile.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { UpdateUserAdminDto } from './dto/update-user.admin.dto';
import { RequestMetaData } from 'src/access-log/types/request-meta.type';
import { AccessLogService } from 'src/access-log/access-log.service';

@Injectable()
export class AdminUserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly accessLogService: AccessLogService,
  ) {}

  async createUserByAdmin(dto: CreateUserByAdminDto) {
    const existing = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(USER_ERRORS.ALREADY_EXISTS);
    }

    const hash = await bcrypt.hash(dto.hash, 10);

    const user = await this.prismaService.user.create({
      data: {
        email: dto.email,
        hash,
        displayName: dto.displayName,
        picktureUrl: dto.pictureUrl,
        role: dto.role ?? UserRole.user,
        accountStatus: dto.accountStatus ?? AccountStatus.ACTIVE,
        emailVerified: true, // Так как админ создаёт вручную
      },
    });

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findById(id: string): Promise<UserProfileDto> {
    const user = await this.prismaService.user.findUnique({ where: { id } });

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

  async findAll(dto: FilterUsersDto) {
    const { role, status, email, page = 1, limit = 10 } = dto;

    const where = {
      ...(role && { role }),
      ...(status && { accountStatus: status }),
      ...(email && {
        email: {
          contains: email,
          mode: Prisma.QueryMode.insensitive,
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prismaService.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.user.count({ where }),
    ]);

    return {
      total,
      page,
      limit,
      data: data.map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName ?? '',
        pictureUrl: user.picktureUrl ?? '',
        role: user.role,
        accountStatus: user.accountStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    };
  }

  async updateByAdmin(userId: string, dto: UpdateUserAdminDto) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    return this.prismaService.user.update({
      where: { id: userId },
      data: {
        ...(dto.role && { role: dto.role }),
        ...(dto.accountStatus && { accountStatus: dto.accountStatus }),
      },
    });
  }
  async deleteByAdmin(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    return this.prismaService.user.update({
      where: { id: userId },
      data: { accountStatus: AccountStatus.DELETED },
    });
  }

  async blockAccount(
    targetUserId: string,
    meta: RequestMetaData,
    performedByUserId: string,
  ): Promise<void> {
    await this.prismaService.user.update({
      where: { id: targetUserId },
      data: { accountStatus: AccountStatus.BLOCKED },
    });

    await this.accessLogService.logEvent(
      performedByUserId,
      LogEventType.ACCOUNT_BLOCKED,
      meta,
    );
  }

  async unblockAccount(
    targetUserId: string,
    meta: RequestMetaData,
    performedByUserId: string,
  ): Promise<void> {
    await this.prismaService.user.update({
      where: { id: targetUserId },
      data: { accountStatus: AccountStatus.ACTIVE },
    });

    await this.accessLogService.logEvent(
      performedByUserId,
      LogEventType.ACCOUNT_UNLOCKED,
      meta,
    );
  }
}
