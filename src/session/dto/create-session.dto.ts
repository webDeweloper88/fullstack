import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({
    description: 'Foydalanuvchining ID si',
    example: '1234567890',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Foydalanuvchining IP manzili',
    example: '192.168.1.1',
  })
  @IsString()
  ipAddress: string;

  @ApiProperty({
    description: 'Foydalanuvchining user agent',
    example:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
    required: false,
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({
    description: 'Sessiyaning amal qilish muddati',
    example: '2025-10-01T12:00:00Z',
  })
  @IsDateString()
  expiresAt: Date;

  @ApiProperty({
    description: 'Foydalanuvchi qurilmasi',
    example: 'kompyuter',
  })
  @IsString()
  device?: string;

  @ApiProperty({
    description: 'Foydalanuvchi qurilmasi',
    example: 'web',
  })
  @IsString()
  client?: string;

  @ApiProperty({
    description: 'Foydalanuvchi qurilmasi',
    example: 'Tashkent, Uzbekistan',
  })
  @IsString()
  location?: string;
}
