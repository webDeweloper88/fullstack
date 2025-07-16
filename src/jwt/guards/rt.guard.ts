import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RtGuard extends AuthGuard('jwt-refresh') {} // refresh tokenini tekshirish uchun ishlatiladi.
// RtGuard JWT refresh tokenini tekshirish uchun ishlatiladi.
