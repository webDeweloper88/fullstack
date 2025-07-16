import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { AdminSessionController } from './admin-session.controller';
import { AdminSessionService } from './admin-session.service';

@Module({
  controllers: [SessionController, AdminSessionController],
  providers: [SessionService, AdminSessionService],
  exports: [SessionService],
})
export class SessionModule {}
