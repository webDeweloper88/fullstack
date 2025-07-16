// sessions/dto/session.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class SessionDto {
  @ApiProperty({
    description: 'ID of the session',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Device of the session',
    example: 'kompyuter',
  })
  @IsString()
  device: string;

  @ApiProperty({
    description: 'IP address of the session',
    example: '192.168.0.1',
  })
  @IsString()
  ipAddress: string;

  @ApiProperty({
    description: 'Location of the session',
    example: 'Tashkent, Uzbekistan',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'Last active date of the session',
    example: '2025-03-15T12:00:00Z',
  })
  @IsString()
  lastActive: string;

  @ApiProperty({
    description: 'Expires at date of the session',
    example: '2025-03-15T12:00:00Z',
  })
  @IsString()
  expiresAt: string;

  @ApiProperty({
    description: 'Is current session',
    example: true,
  })
  @IsBoolean()
  isCurrent: boolean;
}
