// src/oauth/dto/get-oauth-accounts-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetOAuthAccountsQueryDto {
  @ApiPropertyOptional({
    enum: ['google'],
    description: 'Фильтр по OAuth-провайдеру',
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ default: 1, description: 'Номер страницы' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10, description: 'Количество на странице' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
