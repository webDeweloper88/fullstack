import { LogEventType } from '@prisma/client';

export type LogEventInput = {
  userId: string;
  event: LogEventType;
  ip?: string;
  userAgent?: string;
};
