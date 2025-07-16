import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { UserRole, AccountStatus } from '@prisma/client';

export class UpdateUserAdminDto {
  @ApiPropertyOptional({
    enum: UserRole,
    description: 'Новая роль пользователя',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    enum: AccountStatus,
    description: 'Новый статус аккаунта',
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  accountStatus?: AccountStatus;
}
// Bu klass foydalanuvchi rolini va statusini o'zgartirish uchun DTO (Data Transfer Object) sifatida ishlatiladi
