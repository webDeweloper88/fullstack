import { ApiProperty } from '@nestjs/swagger';

export class SendPasswordResetEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address of the user',
  })
  to: string;

  @ApiProperty({
    example: 'https://yourapp.com/reset-password?token=abcdef',
    description: 'URL for password reset',
  })
  url: string;
}
