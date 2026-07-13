import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums/user-role.enum';
import { User } from '../../modules/users/entities/user.entity';

/**
 * @Roles(...) belirtilmemiş endpoint'lerde sadece kimlik doğrulama
 * yeterlidir (JwtAuthGuard zaten bunu garanti eder). Belirtilmişse
 * kullanıcının rolü listede olmalıdır.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user as User;
    return !!user && requiredRoles.includes(user.role);
  }
}
