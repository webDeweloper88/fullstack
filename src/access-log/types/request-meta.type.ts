import { ClientType } from 'src/common/types/client.type';

export type RequestMetaData = {
  ipAddress: string;
  userAgent: string;
  client?: ClientType; //web | mobile | android | ios | desktop;
  userId?: string; // 👈 добавь эту строку
  refreshToken?: string; // 👈 добавь эту строку
  sessionId?: string; // 👈 для logout и логов
};
