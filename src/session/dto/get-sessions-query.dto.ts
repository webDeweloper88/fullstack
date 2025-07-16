import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetSessionsQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Номер страницы' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Размер страницы' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: '192.168.1.1', description: 'IP-адрес' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    example: 'Windows 10 · Chrome',
    description: 'Устройство',
  })
  @IsOptional()
  @IsString()
  device?: string;

  @ApiPropertyOptional({ example: 'user-uuid', description: 'ID пользователя' })
  @IsOptional()
  @IsString()
  userId?: string;
}
