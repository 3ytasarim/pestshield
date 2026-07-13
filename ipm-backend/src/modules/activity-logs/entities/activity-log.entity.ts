import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ConsumptionLevel } from '../../../common/enums/activity-log.enum';
import { Device } from '../../devices/entities/device.entity';
import { User } from '../../users/entities/user.entity';

/**
 * activity_logs: Trend analizlerini besleyen ana tablo. Her satır, bir
 * cihazda (device_id) bir saha personelinin (technician_id) yaptığı
 * TEK bir kontrolü temsil eder.
 */
@Entity('activity_logs')
@Index(['deviceId', 'checkedAt'])
export class ActivityLog extends BaseEntity {
  @Column({ name: 'device_id', type: 'uuid' })
  deviceId: string;

  @ManyToOne(() => Device, (device) => device.activityLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @Column({ name: 'technician_id', type: 'uuid' })
  technicianId: string;

  @ManyToOne(() => User, (user) => user.activityLogs, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'technician_id' })
  technician: User;

  @Column({
    name: 'consumption_level',
    type: 'enum',
    enum: ConsumptionLevel,
  })
  consumptionLevel: ConsumptionLevel;

  @Column({ name: 'pest_count', type: 'int', default: 0 })
  pestCount: number;

  @Column({ name: 'pest_type', length: 100, nullable: true })
  pestType: string | null;

  /** Saha personelinin kontrol sırasında uyguladığı işlem (örn. "Yem yenilendi") */
  @Column({ name: 'action_taken', type: 'text' })
  actionTaken: string;

  @Column({ name: 'checked_at', type: 'timestamptz' })
  checkedAt: Date;
}
