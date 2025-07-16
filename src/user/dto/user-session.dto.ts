import { ApiProperty } from '@nestjs/swagger';

export class UserSessionDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Уникальный идентификатор сессии',
  })
  id: string;

  @ApiProperty({ example: '192.168.0.1', description: 'IP-адрес пользователя' })
  ipAddress: string;

  @ApiProperty({ required: false, description: 'User-Agent браузера' })
  userAgent?: string;

  @ApiProperty({
    example: '2025-03-15T12:00:00Z',
    description: 'Дата и время создания сессии',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-03-15T12:00:00Z',
    description: 'Дата и время последнего обновления сессии',
  })
  updatedAt: Date;

  @ApiProperty({
    example: '2025-03-15T12:00:00Z',
    description: 'Дата и время истечения сессии',
  })
  expiresAt: Date;
}
