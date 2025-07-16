import { ApiProperty } from '@nestjs/swagger';

export class QRCodeDto {
  @ApiProperty({
    description: 'QR-код в формате Base64 (data:image/png;base64,...)',
  })
  qrCodeImage: string;

  @ApiProperty({
    description:
      'Секрет для подключения в приложении (например, Google Authenticator)',
  })
  secret: string;
}
// Bu DTO (Data Transfer Object) foydalanuvchi uchun QR-kod va ulanish sirini olish uchun ishlatiladi
