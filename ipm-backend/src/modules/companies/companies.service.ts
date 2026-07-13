import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientCompany } from './entities/client-company.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { ClientCompanyStatus } from '../../common/enums/client-company.enum';
import { SupabaseAdminService } from '../auth/supabase-admin.service';
import { LicensesService } from '../licenses/licenses.service';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { InviteEmployeeDto } from './dto/invite-employee.dto';
import { UpdateCompanyStatusDto } from './dto/update-company-status.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(ClientCompany)
    private readonly companiesRepository: Repository<ClientCompany>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly supabaseAdminService: SupabaseAdminService,
    private readonly licensesService: LicensesService,
  ) {}

  async register(dto: RegisterCompanyDto): Promise<{ message: string }> {
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Bu e-posta adresi zaten kullanılıyor');
    }

    const company = await this.companiesRepository.save(
      this.companiesRepository.create({
        name: dto.companyName,
        contactEmail: dto.contactEmail,
        status: ClientCompanyStatus.PENDING_APPROVAL,
      }),
    );

    try {
      await this.supabaseAdminService.createUser({
        email: dto.email,
        password: dto.password,
        fullName: dto.fullName,
        role: UserRole.CLIENT,
        companyId: company.id,
        isCompanyOwner: true,
      });
    } catch (error) {
      // Auth kullanıcısı oluşturulamadıysa yetim (owner'sız) bir firma
      // kalmasın diye geri alıyoruz.
      await this.companiesRepository.delete(company.id);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Kullanıcı oluşturulamadı',
      );
    }

    return {
      message:
        'Kaydınız alındı. Firmanız onaylandığında giriş yapıp lisans anahtarınızı aktive edebileceksiniz.',
    };
  }

  async inviteEmployee(dto: InviteEmployeeDto, requestingUser: User): Promise<{ message: string }> {
    if (!requestingUser.isCompanyOwner || !requestingUser.companyId) {
      throw new ForbiddenException('Sadece firma sahibi çalışan ekleyebilir');
    }
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Bu e-posta adresi zaten kullanılıyor');
    }

    await this.supabaseAdminService.createUser({
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
      role: UserRole.CLIENT,
      companyId: requestingUser.companyId,
      isCompanyOwner: false,
    });

    return { message: 'Çalışan hesabı oluşturuldu' };
  }

  async findEmployees(companyId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { companyId },
      order: { createdAt: 'ASC' },
    });
  }

  async findMe(companyId: string): Promise<ClientCompany> {
    return this.findById(companyId);
  }

  async findAll(status?: ClientCompanyStatus): Promise<ClientCompany[]> {
    return this.companiesRepository.find({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<ClientCompany> {
    const company = await this.companiesRepository.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException('Firma bulunamadı');
    }
    return company;
  }

  /** Admin onayı: firmayı aktive eder ve otomatik 5 günlük demo lisans üretir. */
  async approve(id: string, adminId: string) {
    const company = await this.findById(id);
    company.status = ClientCompanyStatus.ACTIVE;
    await this.companiesRepository.save(company);
    const license = await this.licensesService.issueDemoLicense(company.id, adminId);
    return { company, license };
  }

  async updateStatus(id: string, dto: UpdateCompanyStatusDto): Promise<ClientCompany> {
    const company = await this.findById(id);
    company.status = dto.status;
    return this.companiesRepository.save(company);
  }
}
