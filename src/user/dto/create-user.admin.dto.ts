import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole, AccountStatus } from '@prisma/client';

export class CreateUserByAdminDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email нового пользователя',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'strongpassword123',
    description: 'Пароль пользователя',
  })
  @IsString()
  @MinLength(6)
  hash: string;

  @ApiProperty({
    required: false,
    description: 'Отображаемое имя пользователя',
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({
    required: false,
    description: 'URL изображения профиля пользователя',
  })
  @IsOptional()
  @IsString()
  pictureUrl?: string;

  @ApiProperty({
    enum: UserRole,
    required: false,
    default: UserRole.user,
    description: 'Роль пользователя',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({
    enum: AccountStatus,
    required: false,
    default: AccountStatus.ACTIVE,
    description: 'Статус аккаунта пользователя',
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  accountStatus?: AccountStatus;
}
