import { Module } from '@nestjs/common';
import { AccessLogService } from './access-log.service';
import { AccessLogController } from './access-log.controller';

@Module({
  controllers: [AccessLogController],
  providers: [AccessLogService],
  exports: [AccessLogService], // Exporting AccessLogService to be used in other modules
})
export class AccessLogModule {}
