import { Module } from '@nestjs/common';
import { TwoFactorAuthService } from './two-factor-auth.service';

@Module({
  providers: [TwoFactorAuthService],
  exports: [TwoFactorAuthService], // Экспортируем сервис, чтобы его можно было использовать в других модулях
})
export class TwoFactorAuthModule {}
// Bu modul TwoFactorAuthService ni o'z ichiga oladi va uni boshqa modullarga eksport qiladi
