import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { License } from './entities/license.entity';
import { ClientCompany } from '../companies/entities/client-company.entity';
import { LicensesService } from './licenses.service';
import { LicensesController } from './licenses.controller';
import { LicenseGuard } from '../../common/guards/license.guard';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([License, ClientCompany]), MailModule],
  controllers: [LicensesController],
  providers: [LicensesService, LicenseGuard],
  exports: [TypeOrmModule, LicensesService, LicenseGuard],
})
export class LicensesModule {}
