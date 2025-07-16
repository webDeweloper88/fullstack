import { Session } from '@prisma/client';

import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as relativeTime from 'dayjs/plugin/relativeTime';
import { SessionDto } from 'src/session/dto/session.dto';

dayjs.extend(utc);
dayjs.extend(relativeTime);

export function formatSessionForDisplay(
  session: Session,
  currentIp: string,
): SessionDto {
  return {
    id: session.id,
    device: session.device ?? 'Неизвестное устройство',
    ipAddress: session.ipAddress,
    location: session.location ?? '',
    lastActive: dayjs(session.updatedAt).fromNow(), // → '5 минут назад'
    expiresAt: session.expiresAt.toISOString(),
    isCurrent: session.ipAddress === currentIp,
  };
}
