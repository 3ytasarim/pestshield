import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { ClientCompany } from '../companies/entities/client-company.entity';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { LicensesModule } from '../licenses/licenses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, ClientCompany]),
    ActivityLogsModule,
    LicensesModule,
  ],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [TypeOrmModule, DevicesService],
})
export class DevicesModule {}
