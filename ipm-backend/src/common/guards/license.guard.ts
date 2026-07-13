import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { License } from '../../modules/licenses/entities/license.entity';
import { ClientCompany } from '../../modules/companies/entities/client-company.entity';
import { ClientCompanyStatus } from '../enums/client-company.enum';
import { LicenseStatus } from '../enums/license.enum';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole } from '../enums/user-role.enum';

/**
 * role=client istekleri için firmanın aktif (ve süresi dolmamış) bir
 * lisansı olmasını zorunlu kılar. admin/tech bu kontrolden muaftır
 * (Pak İş personelinin bir "firma"sı/lisansı yoktur).
 *
 * Kullanıcı login olabilir (JwtAuthGuard/RolesGuard bunu engellemez);
 * sadece devices/activity-logs gibi asıl iş uçları burada kilitlenir -
 * böylece müşteri neden erişemediğini ("onay bekliyor" / "lisans süresi
 * doldu") görebilir.
 */
@Injectable()
export class LicenseGuard implements CanActivate {
  constructor(
    @InjectRepository(License)
    private readonly licensesRepository: Repository<License>,
    @InjectRepository(ClientCompany)
    private readonly companiesRepository: Repository<ClientCompany>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user || user.role !== UserRole.CLIENT) {
      return true;
    }

    if (!user.companyId) {
      throw new ForbiddenException('Bir firmaya bağlı değilsiniz');
    }

    const company = await this.companiesRepository.findOne({
      where: { id: user.companyId },
    });
    if (!company || company.status !== ClientCompanyStatus.ACTIVE) {
      throw new ForbiddenException(
        'Firmanız henüz onaylanmadı. Onaylandığında bilgilendirileceksiniz.',
      );
    }

    const now = new Date();
    const activeLicense = await this.licensesRepository.findOne({
      where: {
        companyId: user.companyId,
        status: LicenseStatus.ACTIVE,
        expiresAt: MoreThan(now),
      },
    });
    if (activeLicense) {
      return true;
    }

    const hasExpiredLicense = await this.licensesRepository.findOne({
      where: {
        companyId: user.companyId,
        status: LicenseStatus.ACTIVE,
        expiresAt: LessThan(now),
      },
    });
    if (hasExpiredLicense) {
      throw new ForbiddenException(
        'Lisansınızın süresi doldu. Yenilemek için Pak İş ile iletişime geçin.',
      );
    }

    throw new ForbiddenException(
      'Aktif bir lisansınız yok. Lütfen size iletilen lisans anahtarını aktive edin.',
    );
  }
}
