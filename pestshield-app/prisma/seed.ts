import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

/**
 * Sprint 0'da self-service kayıt akışı yok (bu bir sonraki sprintte
 * gelecek); test için üç rolde de birer kullanıcı burada oluşturulur.
 */
async function main() {
  const passwordHash = await bcrypt.hash("Sprint0!23", 10);

  const users = [
    { email: "admin@pestshield.app", name: "Ayşe Yılmaz", role: "ADMIN" as const },
    { email: "tech@pestshield.app", name: "Mehmet Demir", role: "TECH" as const },
    { email: "client@pestshield.app", name: "ABC Liman A.Ş.", role: "CLIENT" as const },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, password: passwordHash },
    });
  }

  console.log("Seed tamamlandı. Şifre (hepsi için): Sprint0!23");

  /** 3Y süper admin hesabı — kayıtlı firmaları görür, lisans üretir. */
  const superAdminPasswordHash = await bcrypt.hash("Onur2805Y!!!", 10);
  await prisma.user.upsert({
    where: { email: "superadmin@pestshield.app" },
    update: {},
    create: {
      email: "superadmin@pestshield.app",
      name: "3Y Süper Admin",
      role: "ADMIN",
      password: superAdminPasswordHash,
    },
  });
  console.log("Süper admin hesabı hazır: superadmin@pestshield.app");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
