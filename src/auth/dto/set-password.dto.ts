// src/auth/dto/set-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class SetPasswordDto {
  @ApiProperty({ example: 'newStrongPassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;
}
