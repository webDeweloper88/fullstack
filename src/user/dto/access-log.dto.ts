import { ApiProperty } from '@nestjs/swagger';
import { LogEventType } from '@prisma/client';

export class AccessLogDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Уникальный идентификатор записи журнала доступа',
  })
  id: string;

  @ApiProperty({
    enum: LogEventType,
    description: 'Тип события журнала доступа',
  })
  eventType: LogEventType;

  @ApiProperty({ required: false, description: 'IP-адрес пользователя' })
  ipAddress?: string;

  @ApiProperty({ required: false, description: 'User-Agent пользователя' })
  userAgent?: string;

  @ApiProperty({ description: 'Дата и время создания записи' })
  createdAt: Date;
}
// Bu DTO (Data Transfer Object) foydalanuvchi kirish loglarini olish uchun ishlatiladi
