// user/dto/user-profile.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, AccountStatus } from '@prisma/client';

export class UserProfileDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier of the user',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address of the user',
  })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Display name of the user',
  })
  displayName: string;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    description: 'Profile picture URL of the user',
  })
  pictureUrl: string;

  @ApiProperty({
    enum: UserRole,
    description: 'Role of the user',
    default: UserRole.user,
  })
  role: UserRole;

  @ApiProperty({
    enum: AccountStatus,
    description: 'Account status of the user',
    default: AccountStatus.PENDING,
  })
  accountStatus: AccountStatus;

  @ApiProperty({
    example: '202501-01T00:00:00Z',
    description: 'Creation date of the user account',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-01-01T00:00:00Z',
    description: 'Last update date of the user account',
  })
  updatedAt: Date;
}
// Bu klass foydalanuvchi profili ma'lumotlarini olish uchun ishlatiladi
