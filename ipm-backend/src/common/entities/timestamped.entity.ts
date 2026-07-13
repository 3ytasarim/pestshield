import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * BaseEntity'den farklı olarak id üretmez: User.id her zaman
 * auth.users.id ile birebir aynı olmalıdır (Supabase Auth entegrasyonu),
 * bu yüzden @PrimaryGeneratedColumn kullanılamaz.
 */
export abstract class TimestampedEntity {
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
