import { Controller } from '@nestjs/common';
import { JwtService } from './jwt.service';

@Controller('jwt')
export class JwtController {
  constructor(private readonly jwtService: JwtService) {}
}
