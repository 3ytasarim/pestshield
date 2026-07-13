import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { LicensesService } from '../licenses/licenses.service';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { InviteEmployeeDto } from './dto/invite-employee.dto';
import { UpdateCompanyStatusDto } from './dto/update-company-status.dto';
import { IssueLicenseDto } from '../licenses/dto/issue-license.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ClientCompanyStatus } from '../../common/enums/client-company.enum';
import { User } from '../users/entities/user.entity';

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly licensesService: LicensesService,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterCompanyDto) {
    return this.companiesService.register(dto);
  }

  @Roles(UserRole.CLIENT)
  @Get('me')
  getOwn(@CurrentUser('companyId') companyId: string) {
    return this.companiesService.findMe(companyId);
  }

  @Roles(UserRole.CLIENT)
  @Get('me/employees')
  getMyEmployees(@CurrentUser('companyId') companyId: string) {
    return this.companiesService.findEmployees(companyId);
  }

  @Roles(UserRole.CLIENT)
  @Post('me/employees')
  inviteEmployee(@Body() dto: InviteEmployeeDto, @CurrentUser() user: User) {
    return this.companiesService.inviteEmployee(dto, user);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query('status') status?: ClientCompanyStatus) {
    return this.companiesService.findAll(status);
  }

  @Roles(UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companiesService.findById(id);
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/approve')
  approve(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') adminId: string) {
    return this.companiesService.approve(id, adminId);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyStatusDto,
  ) {
    return this.companiesService.updateStatus(id, dto);
  }

  /** Admin: ücretli (aylık/yıllık) lisans üretir ve firmanın mailine gönderir. */
  @Roles(UserRole.ADMIN)
  @Post(':id/licenses')
  issueLicense(
    @Param('id', ParseUUIDPipe) companyId: string,
    @Body() dto: IssueLicenseDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.licensesService.issuePaidLicense(companyId, dto, adminId);
  }

  @Roles(UserRole.ADMIN)
  @Get(':id/licenses')
  getLicenses(@Param('id', ParseUUIDPipe) companyId: string) {
    return this.licensesService.findAllForCompany(companyId);
  }
}
