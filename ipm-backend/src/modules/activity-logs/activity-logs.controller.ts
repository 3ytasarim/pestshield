import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { FindActivityLogsQueryDto } from './dto/find-activity-logs-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LicenseGuard } from '../../common/guards/license.guard';

/**
 * activity_logs trend analizinin kaynağı olduğu için kasıtlı olarak
 * PATCH/DELETE ucu yoktur - kontrol kayıtları oluşturulduktan sonra
 * değiştirilemez/silinemez.
 *
 * LicenseGuard: role=client istekleri için firmanın aktif bir lisansı
 * olmasını zorunlu kılar (admin/tech etkilenmez).
 */
@UseGuards(LicenseGuard)
@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  /**
   * Mobil QR akışı: saha personeli (tech) kontrol sonucunu buradan girer.
   * JwtAuthGuard + RolesGuard burada AYRICA (global guard'lara ek olarak)
   * açıkça belirtildi - bu uç sadece geçerli bir Supabase JWT'si olan VE
   * rolü 'tech' olan kullanıcılara açıktır.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TECH)
  @Post()
  create(@Body() dto: CreateActivityLogDto, @CurrentUser() user: User) {
    return this.activityLogsService.create(dto, user);
  }

  @Roles(UserRole.ADMIN, UserRole.TECH, UserRole.CLIENT)
  @Get()
  findAll(@CurrentUser() user: User, @Query() query: FindActivityLogsQueryDto) {
    if (user.role === UserRole.CLIENT) {
      return this.activityLogsService.findAllForCompany(user.companyId!, query);
    }
    return this.activityLogsService.findAllForStaff(user, query);
  }

  @Roles(UserRole.ADMIN, UserRole.TECH, UserRole.CLIENT)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.activityLogsService.findOne(id, user);
  }
}
