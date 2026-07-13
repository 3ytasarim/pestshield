import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { TimestampedEntity } from '../../../common/entities/timestamped.entity';
import { UserRole } from '../../../common/enums/user-role.enum';
import { ActivityLog } from '../../activity-logs/entities/activity-log.entity';
import { ClientCompany } from '../../companies/entities/client-company.entity';

/**
 * users: Supabase Auth (auth.users) ile 1-1 profil tablosu.
 * id, auth.users.id ile birebir aynıdır (bkz. handle_new_auth_user
 * DB trigger'ı) — burada asla otomatik üretilmez.
 * role sadece auth.users.raw_app_meta_data üzerinden (service_role/admin
 * API ile) belirlenir; kullanıcı kendi rolünü değiştiremez.
 */
@Entity('users')
export class User extends TimestampedEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 255 })
  email: string;

  @Column({ name: 'full_name', length: 255, nullable: true })
  fullName: string | null;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  /** role = client olduğunda doldurulur: hangi müşteri firmasına ait olduğu */
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string | null;

  @ManyToOne(() => ClientCompany, (company) => company.employees, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company: ClientCompany | null;

  /** Firmanın ilk kullanıcısı (kayıt açan) - sadece owner yeni çalışan davet edebilir */
  @Column({ name: 'is_company_owner', default: false })
  isCompanyOwner: boolean;

  /** role = tech olduğunda doldurulur: yaptığı kontroller */
  @OneToMany(() => ActivityLog, (log) => log.technician)
  activityLogs: ActivityLog[];
}
