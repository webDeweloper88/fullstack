import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LogEventType } from '@prisma/client';
import { RequestMetaData } from './types/request-meta.type';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { GetAccessLogDto } from './dto/get-access-log.dto';

@Injectable()
export class AccessLogService {
  private readonly logger = new Logger(AccessLogService.name);
  private readonly MAX_LOGS_PER_USER = 50;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Логирование события доступа пользователя
   */
  async logEvent(
    userId: string,
    eventType: LogEventType,
    meta: RequestMetaData,
  ): Promise<void> {
    try {
      await this.prisma.accessLog.create({
        data: {
          userId: userId ?? undefined,
          eventType,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });

      // Очистка старых логов (оставляем только последние N)
      await this.pruneOldLogs(userId);

      this.logger.debug(`Logged event ${eventType} for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to log event ${eventType} for user ${userId}`,
        error.stack,
      );
    }
  }

  /**
   * Удаляет старые логи, оставляя только последние MAX_LOGS_PER_USER
   */
  private async pruneOldLogs(userId: string): Promise<void> {
    try {
      const oldLogs = await this.prisma.accessLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: this.MAX_LOGS_PER_USER,
        select: { id: true },
      });

      if (oldLogs.length > 0) {
        const result = await this.prisma.accessLog.deleteMany({
          where: {
            id: { in: oldLogs.map((log) => log.id) },
          },
        });

        this.logger.debug(`Pruned ${result.count} old logs for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to prune old logs for user ${userId}`,
        error.stack,
      );
    }
  }

  /**
   * Удаляет логи старше 6 месяцев (ежедневно в 00:00)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteOldLogs(): Promise<void> {
    const days = this.configService.getOrThrow<number>(
      'ACCESS_LOG_MAX_AGE_DAYS',
    );
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days); // ✅ правильно

    try {
      const result = await this.prisma.accessLog.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });

      if (result.count > 0) {
        this.logger.log(`Удалено ${result.count} логов старше ${days} дней`);
      }
    } catch (error) {
      this.logger.error('Ошибка при удалении старых логов', error.stack);
    }
  }

  async getLogs(dto: GetAccessLogDto) {
    const { page, limit, ...filters } = dto;

    return await this.prisma.accessLog.findMany({
      where: {
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.eventType && { eventType: filters.eventType }),
        ...(filters.ipAddress && { ipAddress: filters.ipAddress }),
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
