import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { LicenseGuard } from '../../common/guards/license.guard';

const RECENT_ACTIVITY_LOGS_LIMIT = 5;

/**
 * LicenseGuard: role=client istekleri için firmanın aktif/süresi
 * dolmamış bir lisansı olmasını zorunlu kılar (admin/tech etkilenmez).
 */
@UseGuards(LicenseGuard)
@Controller('devices')
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  @Roles(UserRole.ADMIN, UserRole.TECH)
  @Post()
  create(@Body() dto: CreateDeviceDto) {
    return this.devicesService.create(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TECH, UserRole.CLIENT)
  @Get()
  findAll(@CurrentUser() user: User, @Query('companyId') companyId?: string) {
    if (user.role === UserRole.CLIENT) {
      return this.devicesService.findAllForCompany(user.companyId!);
    }
    return this.devicesService.findAll(companyId);
  }

  /**
   * Mobil QR okutma akışı: saha personeli sahada QR kodu okutur, cihaz
   * bilgisini ve izlenebilirlik/trend için son 5 ActivityLog kaydını
   * (en yeniden en eskiye) tek istekte alır.
   */
  @Roles(UserRole.ADMIN, UserRole.TECH)
  @Get('qr/:qrCode')
  async findByQrCode(@Param('qrCode') qrCode: string) {
    const device = await this.devicesService.findByQrCode(qrCode);
    const recentActivityLogs = await this.activityLogsService.findRecentByDevice(
      device.id,
      RECENT_ACTIVITY_LOGS_LIMIT,
    );
    return { device, recentActivityLogs };
  }

  @Roles(UserRole.ADMIN, UserRole.TECH, UserRole.CLIENT)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    if (user.role === UserRole.CLIENT) {
      return this.devicesService.findOneForCompany(id, user.companyId!);
    }
    return this.devicesService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TECH)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDeviceDto) {
    return this.devicesService.update(id, dto);
  }
}
