import {
  Injectable,
  Logger,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Session } from '@prisma/client';
import { CreateSessionDto } from './dto/create-session.dto';
import { SESSION_ERRORS } from '../common/constants/errors';
import { SessionDto } from './dto/session.dto';
import { formatSessionForDisplay } from 'src/common/utils/format-session-for-display';
import { parseUserAgent } from 'src/common/utils/parse-user-agent';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GetSessionsQueryDto } from './dto/get-sessions-query.dto';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly prisma: PrismaService) {}

  private normalizeIp(ip: string): string {
    if (ip === '::1') return '127.0.0.1';
    if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
    return ip;
  }

  async createSession(dto: CreateSessionDto): Promise<Session> {
    try {
      const normalizedIp = this.normalizeIp(dto.ipAddress);
      const rawUserAgent = dto.userAgent?.trim() || 'Unknown';
      const deviceInfo = parseUserAgent(rawUserAgent);

      const existing = await this.prisma.session.findFirst({
        where: {
          userId: dto.userId,
          ipAddress: normalizedIp,
          device: deviceInfo,
        },
      });

      if (existing) {
        return await this.prisma.session.update({
          where: { id: existing.id },
          data: {
            expiresAt: dto.expiresAt,
            updatedAt: new Date(),
          },
        });
      }

      return await this.prisma.session.create({
        data: {
          userId: dto.userId,
          ipAddress: normalizedIp,
          userAgent: rawUserAgent,
          device: dto.device ?? deviceInfo,
          client: dto.client ?? 'web',
          location: dto.location ?? null,
          expiresAt: dto.expiresAt,
        },
      });
    } catch (error) {
      this.logger.error(`Не удалось создать сессию: ${error.message}`);
      throw new InternalServerErrorException(SESSION_ERRORS.CREATE_FAILED);
    }
  }

  async getSessionsByUserId(
    userId: string,
    currentIp: string,
  ): Promise<SessionDto[]> {
    try {
      const normalizedIp = this.normalizeIp(currentIp);
      const sessions = await this.prisma.session.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return sessions.map((session) =>
        formatSessionForDisplay(session, normalizedIp),
      );
    } catch (error) {
      this.logger.error(
        `Не удалось получить сессии пользователя ${userId}: ${error.message}`,
      );
      throw new InternalServerErrorException(SESSION_ERRORS.FETCH_FAILED);
    }
  }

  async updateSessionExpiry(
    userId: string,
    ipAddress: string,
    newExpiry: Date,
  ): Promise<void> {
    try {
      const normalizedIp = this.normalizeIp(ipAddress);
      await this.prisma.session.updateMany({
        where: { userId, ipAddress: normalizedIp },
        data: { expiresAt: newExpiry },
      });
    } catch (error) {
      this.logger.error(
        `Не удалось обновить срок действия сессии: ${error.message}`,
      );
      throw new InternalServerErrorException(SESSION_ERRORS.UPDATE_FAILED);
    }
  }

  async deleteSessionById(sessionId: string): Promise<void> {
    try {
      await this.prisma.session.delete({
        where: { id: sessionId },
      });
    } catch (error) {
      if (error.code !== 'P2025') {
        this.logger.error(
          `Не удалось удалить сессию ${sessionId}: ${error.message}`,
        );
        throw new InternalServerErrorException(SESSION_ERRORS.DELETE_FAILED);
      }
    }
  }

  async deleteSessionOfUser(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new ForbiddenException(SESSION_ERRORS.SESSION_NOT_FOUND);
    }

    await this.prisma.session.delete({
      where: { id: sessionId },
    });
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    try {
      await this.prisma.session.deleteMany({ where: { userId } });
    } catch (error) {
      this.logger.error(
        `Не удалось удалить все сессии пользователя ${userId}: ${error.message}`,
      );
      throw new InternalServerErrorException(SESSION_ERRORS.DELETE_FAILED);
    }
  }

  async deleteAllUserSessionsIncludingCurrent(userId: string): Promise<void> {
    try {
      await this.prisma.session.deleteMany({ where: { userId } });
    } catch (error) {
      this.logger.error(
        `Не удалось удалить все сессии (включая текущую) пользователя ${userId}: ${error.message}`,
      );
      throw new InternalServerErrorException(SESSION_ERRORS.DELETE_FAILED);
    }
  }

  async deleteOtherSessions(userId: string, currentIp: string): Promise<void> {
    try {
      const normalizedIp = this.normalizeIp(currentIp);
      await this.prisma.session.deleteMany({
        where: {
          userId,
          NOT: { ipAddress: normalizedIp },
        },
      });
    } catch (error) {
      this.logger.error(
        `Не удалось удалить другие сессии пользователя ${userId}: ${error.message}`,
      );
      throw new InternalServerErrorException(SESSION_ERRORS.DELETE_FAILED);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async deleteExpiredSessions(): Promise<void> {
    try {
      const result = await this.prisma.session.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      if (result.count > 0) {
        this.logger.log(`Удалено ${result.count} просроченных сессий.`);
      }
    } catch (error) {
      this.logger.error(
        `Ошибка при удалении просроченных сессий: ${error.message}`,
      );
    }
  }

  // src/session/admin-session.service.ts
}
