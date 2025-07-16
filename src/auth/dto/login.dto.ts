import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'webdeweloper88@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'web',
    description: 'Тип клиента, с которого выполняется вход (web или mobile)',
    required: false,
  })
  @IsOptional()
  @IsIn(['web', 'mobile']) // ограничим допустимые значения
  client?: 'web' | 'mobile';
}
