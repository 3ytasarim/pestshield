import { Body, Controller, Get, Post } from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { ActivateLicenseDto } from './dto/activate-license.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

/**
 * NOT: bu controller'a LicenseGuard kasıtlı olarak uygulanmadı - müşteri
 * lisansı henüz aktif değilken bile buraya erişip anahtarını
 * aktive edebilmeli / geçmişini görebilmelidir.
 */
@Roles(UserRole.CLIENT)
@Controller('licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Post('activate')
  activate(
    @Body() dto: ActivateLicenseDto,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.licensesService.activate(dto, companyId);
  }

  @Get('me')
  findMine(@CurrentUser('companyId') companyId: string) {
    return this.licensesService.findAllForCompany(companyId);
  }
}
