import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestMetaData } from '../types/request-meta.type';
import { parseClientFromUserAgent } from '../../common/utils/parse-user-agent';

export const RequestMeta = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestMetaData => {
    const request = ctx.switchToHttp().getRequest();

    const rawIp =
      request.headers['x-forwarded-for'] ||
      request.ip ||
      request.connection?.remoteAddress;

    const ipAddress = (Array.isArray(rawIp) ? rawIp[0] : rawIp) ?? 'unknown';

    const userAgent = request.headers['user-agent'] || 'unknown';

    return {
      ipAddress,
      userAgent,
      client: parseClientFromUserAgent?.(userAgent) ?? 'web',
      refreshToken: request.cookies?.refresh_token,
      sessionId: request.user?.sessionId,
    };
  },
);
