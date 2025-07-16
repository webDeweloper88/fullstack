import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class Verify2FADto {
  @ApiProperty({ description: 'Код из приложения 2FA (6 цифр)' })
  @IsString()
  @Length(6, 6)
  token: string;

  @ApiProperty({
    description: 'Секрет (base32), полученный при генерации QR-кода',
  })
  @IsString()
  secret: string;
}
// Bu DTO (Data Transfer Object) foydalanuvchi tomonidan 2FA kodini tasdiqlash uchun ishlatiladi
