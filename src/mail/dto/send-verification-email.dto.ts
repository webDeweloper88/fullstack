import { ApiProperty } from '@nestjs/swagger';

export class SendVerificationEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address of the user',
  })
  to: string;

  @ApiProperty({
    example: 'https://yourapp.com/verify?token=123456',
    description: 'URL for email verification',
  })
  url: string;
}
