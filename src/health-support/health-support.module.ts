import { Module } from '@nestjs/common';
import { HealthSupportController } from './health-support.controller';
import { HealthSupportService } from './health-support.service';

@Module({
  controllers: [HealthSupportController],
  providers: [HealthSupportService],
  exports: [HealthSupportService]
})
export class HealthSupportModule {}