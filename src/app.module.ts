import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { HealthController } from './health/health.controller';

const NODE_ENV = process.env.NODE_ENV || 'development';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        NODE_ENV === 'production' ? '.env.production' : '.env.development',
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
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
