import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AtGuard extends AuthGuard('jwt') {} // AtGuard JWT access tokenini tekshirish uchun ishlatiladi.
// Bu guard JWT access tokenini tekshirish uchun ishlatiladi.
