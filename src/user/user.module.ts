import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TwoFactorAuthModule } from 'src/two-factor-auth/two-factor-auth.module';
import { AccessLogModule } from 'src/access-log/access-log.module';
import { AdminUserController } from './admin-user.controller';
import { AdminUserService } from './admin-user.service';

@Module({
  imports: [TwoFactorAuthModule, AccessLogModule], // Importing TwoFactorAuthModule to use its services
  controllers: [UserController, AdminUserController],
  providers: [UserService, AdminUserService],
  exports: [UserService, AdminUserService], // Exporting UserService to be used in other modules
})
export class UserModule {}
