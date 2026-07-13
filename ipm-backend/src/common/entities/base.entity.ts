import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Tüm entity'lerin ortak alanları.
 * HACCP/BRC denetimlerinde kayıtların ne zaman oluşturulup değiştirildiği
 * izlenebilir olmalıdır, bu yüzden createdAt/updatedAt zorunludur.
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
