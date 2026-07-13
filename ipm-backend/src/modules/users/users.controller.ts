import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Herhangi bir doğrulanmış kullanıcı kendi profilini (ve dolayısıyla
   * rolünü) okuyabilir. Frontend, login sonrası bunu çağırıp role göre
   * doğru dashboard'a yönlendirir - public.users RLS ile kilitli olduğu
   * için (sadece service_role) bu bilgiye başka türlü ulaşılamaz.
   */
  @Roles(UserRole.ADMIN, UserRole.TECH, UserRole.CLIENT)
  @Get('me')
  me(@CurrentUser() user: User) {
    return user;
  }

  /** admin (Pak İş): tüm kullanıcıları görüntüler/yönetir. */
  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() query: FindUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Roles(UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(id, dto);
  }
}
