import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';
import { ClientCompany } from '../companies/entities/client-company.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly devicesRepository: Repository<Device>,
    @InjectRepository(ClientCompany)
    private readonly companiesRepository: Repository<ClientCompany>,
  ) {}

  async create(dto: CreateDeviceDto): Promise<Device> {
    const company = await this.companiesRepository.findOne({
      where: { id: dto.companyId },
    });
    if (!company) {
      throw new BadRequestException('Geçersiz companyId');
    }
    const device = this.devicesRepository.create(dto);
    return this.devicesRepository.save(device);
  }

  /** admin/tech: tüm cihazlar (opsiyonel companyId filtresi) */
  async findAll(companyId?: string): Promise<Device[]> {
    return this.devicesRepository.find({
      where: companyId ? { companyId } : {},
      order: { createdAt: 'DESC' },
    });
  }

  /** client: sadece kendi firmasının cihazları */
  async findAllForCompany(companyId: string): Promise<Device[]> {
    return this.devicesRepository.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Device> {
    const device = await this.devicesRepository.findOne({ where: { id } });
    if (!device) {
      throw new NotFoundException('Cihaz bulunamadı');
    }
    return device;
  }

  /** Mobil QR okutma akışı: sahada okutulan benzersiz koda ait cihazı bulur. */
  async findByQrCode(qrCode: string): Promise<Device> {
    const device = await this.devicesRepository.findOne({ where: { qrCode } });
    if (!device) {
      throw new NotFoundException('Bu QR koda ait cihaz bulunamadı');
    }
    return device;
  }

  async findOneForCompany(id: string, companyId: string): Promise<Device> {
    const device = await this.devicesRepository.findOne({
      where: { id, companyId },
    });
    if (!device) {
      throw new NotFoundException('Cihaz bulunamadı');
    }
    return device;
  }

  async update(id: string, dto: UpdateDeviceDto): Promise<Device> {
    const device = await this.findOne(id);
    Object.assign(device, dto);
    return this.devicesRepository.save(device);
  }
}
