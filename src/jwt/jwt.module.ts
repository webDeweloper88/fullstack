import { Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AtStrategy } from './strategies/at.strategy';
import { AtGuard } from './guards/at.guard';
import { RtGuard } from './guards/rt.guard';
import { RtStrategy } from './strategies/rt.strategy';

@Module({
  imports: [NestJwtModule.register({}), ConfigModule],
  providers: [JwtService, AtStrategy, AtGuard, RtGuard, RtStrategy],
  exports: [JwtService, AtGuard],
})
export class JwtModule {}
// Ushbu modul tokenlarni yaratish va tekshirish uchun JWT xizmatini sozlaydi.
