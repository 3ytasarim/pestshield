import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DeviceType } from '../../../common/enums/device.enum';
import { ClientCompany } from '../../companies/entities/client-company.entity';
import { ActivityLog } from '../../activity-logs/entities/activity-log.entity';

/**
 * devices: Sahada QR koduyla okutulacak ekipman (kemirgen kutusu,
 * canlı yakalama kapanı, EFT sinek cihazı). Her cihaz bir müşteri
 * firmasına bağlıdır — aynı firmanın tüm çalışanları aynı cihazları görür.
 */
@Entity('devices')
export class Device extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'qr_code', length: 255 })
  qrCode: string;

  @Column({ type: 'enum', enum: DeviceType })
  type: DeviceType;

  @Column({ name: 'location_zone', length: 255 })
  locationZone: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => ClientCompany, (company) => company.devices, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'company_id' })
  company: ClientCompany;

  @OneToMany(() => ActivityLog, (log) => log.device)
  activityLogs: ActivityLog[];
}
