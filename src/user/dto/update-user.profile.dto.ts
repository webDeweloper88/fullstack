import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ description: 'Отображаемое имя пользователя' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'URL изображения пользователя (аватар)' })
  @IsOptional()
  @IsUrl()
  pictureUrl?: string;
}
// Bu klass foydalanuvchi ma'lumotlarini yangilash uchun DTO (Data Transfer Object) sifatida ishlatiladi
