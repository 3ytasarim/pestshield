import { randomBytes } from 'crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { License } from './entities/license.entity';
import { ClientCompany } from '../companies/entities/client-company.entity';
import { LicenseStatus, LicenseType, LICENSE_DURATION_DAYS } from '../../common/enums/license.enum';
import { MailService } from '../mail/mail.service';
import { ActivateLicenseDto } from './dto/activate-license.dto';

function generateLicenseKey(): string {
  const group = () => randomBytes(3).toString('hex').toUpperCase();
  return `PSHLD-${group()}-${group()}`;
}

@Injectable()
export class LicensesService {
  constructor(
    @InjectRepository(License)
    private readonly licensesRepository: Repository<License>,
    @InjectRepository(ClientCompany)
    private readonly companiesRepository: Repository<ClientCompany>,
    private readonly mailService: MailService,
  ) {}

  /** Admin bir firmayı onayladığında otomatik 5 günlük demo lisansı üretir. */
  async issueDemoLicense(companyId: string, createdBy: string): Promise<License> {
    const license = this.licensesRepository.create({
      companyId,
      key: generateLicenseKey(),
      type: LicenseType.DEMO,
      status: LicenseStatus.ISSUED,
      issuedAt: new Date(),
      createdBy,
    });
    return this.licensesRepository.save(license);
  }

  /** Admin ücretli (aylık/yıllık) lisans üretir ve firmanın mailine gönderir. */
  async issuePaidLicense(
    companyId: string,
    dto: { type: LicenseType.MONTHLY | LicenseType.YEARLY },
    createdBy: string,
  ): Promise<License> {
    const company = await this.companiesRepository.findOne({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Firma bulunamadı');
    }

    const license = await this.licensesRepository.save(
      this.licensesRepository.create({
        companyId,
        key: generateLicenseKey(),
        type: dto.type,
        status: LicenseStatus.ISSUED,
        issuedAt: new Date(),
        createdBy,
      }),
    );

    await this.mailService.sendLicenseKeyEmail({
      to: company.contactEmail,
      companyName: company.name,
      licenseKey: license.key,
      type: license.type,
      expiresAt: null,
    });
    license.emailedAt = new Date();
    await this.licensesRepository.save(license);

    return license;
  }

  async activate(dto: ActivateLicenseDto, companyId: string): Promise<License> {
    const license = await this.licensesRepository.findOne({
      where: { key: dto.key, companyId, status: LicenseStatus.ISSUED },
    });
    if (!license) {
      throw new BadRequestException('Geçersiz veya zaten kullanılmış lisans anahtarı');
    }

    const activatedAt = new Date();
    const durationDays = LICENSE_DURATION_DAYS[license.type];
    const expiresAt = new Date(activatedAt);
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    license.status = LicenseStatus.ACTIVE;
    license.activatedAt = activatedAt;
    license.expiresAt = expiresAt;
    return this.licensesRepository.save(license);
  }

  async findAllForCompany(companyId: string): Promise<License[]> {
    return this.licensesRepository.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
  }
}
