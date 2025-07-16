import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Session } from '@prisma/client';
import { formatSessionForDisplay } from 'src/common/utils/format-session-for-display';
import { SessionDto } from './dto/session.dto';

@Injectable()
export class AdminSessionService {
  private readonly logger = new Logger(AdminSessionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAllSessions(params: {
    page?: number;
    limit?: number;
    userId?: string;
    ipAddress?: string;
    device?: string;
  }): Promise<{ sessions: SessionDto[]; total: number }> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {
      userId: params.userId,
      ipAddress: params.ipAddress,
      device: params.device
        ? {
            contains: params.device,
            mode: 'insensitive' as const,
          }
        : undefined,
    };

    const [sessions, total] = await this.prisma.$transaction([
      this.prisma.session.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.session.count({ where }),
    ]);

    return {
      sessions: sessions.map((s) => formatSessionForDisplay(s, '')),
      total,
    };
  }

  async getSessionById(sessionId: string): Promise<Session> {
    return await this.prisma.session.findUniqueOrThrow({
      where: { id: sessionId },
    });
  }

  async deleteSessionById(sessionId: string): Promise<void> {
    await this.prisma.session.delete({ where: { id: sessionId } });
  }

  async deleteAllSessions(): Promise<number> {
    const result = await this.prisma.session.deleteMany({});
    return result.count;
  }

  async deleteSessionsByUserId(userId: string): Promise<number> {
    const result = await this.prisma.session.deleteMany({ where: { userId } });
    return result.count;
  }

  async getUserSessions(userId: string): Promise<SessionDto[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((s) => formatSessionForDisplay(s, ''));
  }
}
