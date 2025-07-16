import { UserRole } from '@prisma/client';
import { ClientType } from 'src/common/types/client.type';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  sessionId: string; // 👈 добавить
  isTwoFactorAuthenticated?: boolean;
  client?: ClientType;
};

export type JwtTokens = {
  access_token: string;
  refresh_token: string;
};
