import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IS_DEV_ENV } from './common/utils/is-dev.utils';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { JwtModule } from './jwt/jwt.module';
import { MailModule } from './mail/mail.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { AccessLogModule } from './access-log/access-log.module';
import { SessionModule } from './session/session.module';
import { ScheduleModule } from '@nestjs/schedule';
import { OauthModule } from './oauth/oauth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: !IS_DEV_ENV, // Agar isDev false bo'lsa, .env faylini e'tiborga olmaslik
      envFilePath: IS_DEV_ENV ? '.env' : '.env.production', // Agar isDev true bo'lsa, .env faylini yuklash
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UserModule,
    JwtModule,
    MailModule,
    RedisModule,
    AuthModule,
    AccessLogModule,
    SessionModule,
    OauthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
