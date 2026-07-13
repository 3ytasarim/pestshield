import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { Device } from '../devices/entities/device.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { FindActivityLogsQueryDto } from './dto/find-activity-logs-query.dto';

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogsRepository: Repository<ActivityLog>,
    @InjectRepository(Device)
    private readonly devicesRepository: Repository<Device>,
  ) {}

  /** Sadece 'tech' rolü çağırabilir (bkz. ActivityLogsController) - technicianId her zaman JWT'deki kimliktir. */
  async create(
    dto: CreateActivityLogDto,
    requestingUser: User,
  ): Promise<ActivityLog> {
    const device = await this.devicesRepository.findOne({
      where: { id: dto.deviceId },
    });
    if (!device) {
      throw new BadRequestException('Geçersiz deviceId');
    }

    const log = this.activityLogsRepository.create({
      deviceId: dto.deviceId,
      technicianId: requestingUser.id,
      consumptionLevel: dto.consumptionLevel,
      pestCount: dto.pestCount,
      pestType: dto.pestType ?? null,
      actionTaken: dto.actionTaken,
      checkedAt: dto.checkedAt ? new Date(dto.checkedAt) : new Date(),
    });
    return this.activityLogsRepository.save(log);
  }

  /** Bir cihazın izlenebilirlik/trend geçmişi için en son N kaydı (bkz. GET /devices/qr/:qrCode) */
  async findRecentByDevice(deviceId: string, limit = 5): Promise<ActivityLog[]> {
    return this.activityLogsRepository.find({
      where: { deviceId },
      order: { checkedAt: 'DESC' },
      take: limit,
    });
  }

  /** admin: tüm kayıtlar / tech: sadece kendi kayıtları */
  async findAllForStaff(
    requestingUser: User,
    query: FindActivityLogsQueryDto,
  ): Promise<ActivityLog[]> {
    const qb = this.activityLogsRepository.createQueryBuilder('log');
    if (requestingUser.role === UserRole.TECH) {
      qb.where('log.technician_id = :technicianId', {
        technicianId: requestingUser.id,
      });
    }
    if (query.deviceId) {
      qb.andWhere('log.device_id = :deviceId', { deviceId: query.deviceId });
    }
    if (query.companyId) {
      qb.innerJoin('log.device', 'device').andWhere(
        'device.company_id = :companyId',
        { companyId: query.companyId },
      );
    }
    this.applyDateFilters(qb, query);
    return qb.orderBy('log.checked_at', 'DESC').getMany();
  }

  /** client: sadece kendi firmasının cihazlarındaki kayıtlar */
  async findAllForCompany(
    companyId: string,
    query: FindActivityLogsQueryDto,
  ): Promise<ActivityLog[]> {
    const qb = this.activityLogsRepository
      .createQueryBuilder('log')
      .innerJoin('log.device', 'device')
      .where('device.company_id = :companyId', { companyId });
    if (query.deviceId) {
      qb.andWhere('log.device_id = :deviceId', { deviceId: query.deviceId });
    }
    this.applyDateFilters(qb, query);
    return qb.orderBy('log.checked_at', 'DESC').getMany();
  }

  private applyDateFilters(
    qb: SelectQueryBuilder<ActivityLog>,
    query: FindActivityLogsQueryDto,
  ) {
    if (query.from) {
      qb.andWhere('log.checked_at >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('log.checked_at <= :to', { to: query.to });
    }
  }

  async findOne(id: string, requestingUser: User): Promise<ActivityLog> {
    const log = await this.activityLogsRepository.findOne({
      where: { id },
      relations: { device: true },
    });
    if (!log) {
      throw new NotFoundException('Kontrol kaydı bulunamadı');
    }
    if (requestingUser.role === UserRole.TECH && log.technicianId !== requestingUser.id) {
      throw new NotFoundException('Kontrol kaydı bulunamadı');
    }
    if (
      requestingUser.role === UserRole.CLIENT &&
      log.device.companyId !== requestingUser.companyId
    ) {
      throw new NotFoundException('Kontrol kaydı bulunamadı');
    }
    return log;
  }
}
