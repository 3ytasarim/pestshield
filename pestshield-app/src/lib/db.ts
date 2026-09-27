import dns from "dns";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";

// Bazı hosting ortamlarında (ör. Neon'un pooler adresine SADECE IPv6 üzerinden kayıt
// dönmesi ama sunucunun IPv6 çıkışı/rotası olmaması) Prisma'nın native query-engine'i
// bağlantıyı ENETUNREACH ile reddedip panikliyor (bkz. 2026-09-27 pakispco.com.tr olayı).
// Node'un kendi DNS/ağ katmanını kullanan `pg` sürücüsüyle (aşağıdaki adapter) bu ayar
// gerçekten etkili oluyor — native motorda hiç etkisi yoktu.
dns.setDefaultResultOrder("ipv4first");

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; pgPool?: Pool };

const pool = globalForPrisma.pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pool;
}
