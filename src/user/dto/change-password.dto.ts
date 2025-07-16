import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Текущий пароль' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'Новый пароль (не менее 6 символов)' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
// Bu DTO (Data Transfer Object) foydalanuvchi parolini o'zgartirish uchun ishlatiladi
