import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Tek-firmalı (self-hosted, müşterinin kendi sunucusuna kurulan) dağıtımlarda
 * self-servis "Firma Kayıt" ekranı kapalı olduğu için ilk giriş hesabını bu
 * script oluşturur. Demo/mock veri YOK — sadece verilen gerçek bilgilerle
 * tek bir CLIENT kullanıcısı yaratılır. Boş veritabanına şema kurmak için
 * önce `npx prisma db push` çalıştırılmış olmalı.
 *
 * Kullanım (o dağıtımın .env'i DATABASE_URL'i yeni boş veritabanına
 * gösterecek şekilde ayarlanmış olarak):
 *
 *   TENANT_EMAIL="firma@musteri.com" \
 *   TENANT_PASSWORD="GucluBirSifre123!" \
 *   TENANT_COMPANY_NAME="Örnek İlaçlama Ltd. Şti." \
 *   TENANT_NAME="Yetkili Adı Soyadı" \
 *   TENANT_LICENSE_TYPE="YEARLY" \
 *   npm run tenant:create
 */

const BCRYPT_ROUNDS = 12;
const LICENSE_DURATION_DAYS: Record<string, number> = { DEMO: 5, MONTHLY: 30, YEARLY: 365 };

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    console.error(`Eksik ortam değişkeni: ${name}`);
    process.exit(1);
  }
  return value.trim();
}

async function main() {
  const email = requireEnv("TENANT_EMAIL");
  const password = requireEnv("TENANT_PASSWORD");
  const companyName = requireEnv("TENANT_COMPANY_NAME");
  const name = process.env.TENANT_NAME?.trim() || companyName;
  const address = process.env.TENANT_ADDRESS?.trim() || null;
  const phone = process.env.TENANT_PHONE?.trim() || null;
  const licenseType = process.env.TENANT_LICENSE_TYPE?.trim() || "YEARLY";

  if (password.length < 8) {
    console.error("TENANT_PASSWORD en az 8 karakter olmalıdır.");
    process.exit(1);
  }
  if (!(licenseType in LICENSE_DURATION_DAYS)) {
    console.error(`TENANT_LICENSE_TYPE geçersiz: ${licenseType} (DEMO | MONTHLY | YEARLY)`);
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.error(`Bu e-posta zaten kayıtlı: ${email}`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const licenseExpiresAt = new Date(
      Date.now() + LICENSE_DURATION_DAYS[licenseType] * 24 * 60 * 60 * 1000,
    );

    const user = await prisma.user.create({
      data: {
        role: "CLIENT",
        email,
        password: passwordHash,
        name,
        companyName,
        address,
        phone,
        licenseType: licenseType as "DEMO" | "MONTHLY" | "YEARLY",
        licenseExpiresAt,
      },
    });

    console.log("Firma hesabı oluşturuldu:");
    console.log(`  Firma: ${user.companyName}`);
    console.log(`  E-posta: ${user.email}`);
    console.log(
      `  Lisans: ${user.licenseType} (bitiş: ${user.licenseExpiresAt?.toLocaleDateString("tr-TR")})`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
