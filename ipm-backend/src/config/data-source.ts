import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../modules/users/entities/user.entity';
import { ClientCompany } from '../modules/companies/entities/client-company.entity';
import { License } from '../modules/licenses/entities/license.entity';
import { Device } from '../modules/devices/entities/device.entity';
import { ActivityLog } from '../modules/activity-logs/entities/activity-log.entity';

dotenv.config();

/**
 * Şemanın kaynağı Supabase migration'larıdır (bkz. Supabase MCP ile
 * uygulanan SQL migration'lar). Bu DataSource sadece TypeORM CLI ile
 * "entity'ler canlı DB ile hâlâ eşleşiyor mu" diye diff almak
 * (migration:generate --check gibi) veya lokal script'ler için vardır;
 * asla migration:run ile şema değiştirmek amacıyla kullanılmamalıdır.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [User, ClientCompany, License, Device, ActivityLog],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
});
