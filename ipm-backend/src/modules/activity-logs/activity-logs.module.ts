import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { Device } from '../devices/entities/device.entity';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogsController } from './activity-logs.controller';
import { LicensesModule } from '../licenses/licenses.module';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLog, Device]), LicensesModule],
  controllers: [ActivityLogsController],
  providers: [ActivityLogsService],
  exports: [TypeOrmModule, ActivityLogsService],
})
export class ActivityLogsModule {}
