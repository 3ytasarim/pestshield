import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ClientCompanyStatus } from '../../../common/enums/client-company.enum';
import { User } from '../../users/entities/user.entity';
import { Device } from '../../devices/entities/device.entity';
import { License } from '../../licenses/entities/license.entity';

/**
 * client_companies: Sistemden kayıt olan müşteri firması (tenant).
 * Bir firmanın birden fazla çalışanı (users.role='client') olabilir;
 * cihazlar ve lisanslar doğrudan firmaya bağlıdır, tek bir kullanıcıya değil.
 */
@Entity('client_companies')
export class ClientCompany extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  /** Lisans anahtarı e-postalarının gönderileceği adres */
  @Column({ name: 'contact_email', length: 255 })
  contactEmail: string;

  @Column({
    type: 'enum',
    enum: ClientCompanyStatus,
    default: ClientCompanyStatus.PENDING_APPROVAL,
  })
  status: ClientCompanyStatus;

  @OneToMany(() => User, (user) => user.company)
  employees: User[];

  @OneToMany(() => Device, (device) => device.company)
  devices: Device[];

  @OneToMany(() => License, (license) => license.company)
  licenses: License[];
}
