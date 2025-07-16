import { Module } from '@nestjs/common';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GoogleStrategy } from './strategies/google.strategy'; // 👈 не забудь!
import { AccessLogModule } from 'src/access-log/access-log.module';
import { YandexStrategy } from './strategies/yandex.strategy';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, AccessLogModule], // 👈 добавь AccessLogModule
  controllers: [OAuthController],
  providers: [OAuthService, GoogleStrategy, YandexStrategy], // 👈 добавь стратегию
})
export class OauthModule {}
