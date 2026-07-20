import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  try {
    return new PrismaClient();
  } catch (err) {
    // Gecici tani: Next.js'in kendi hata formatlayicisi "open EEXIST" hatasinin
    // tam stack trace'ini bastirip sadece "at get (<anonymous>)" gosteriyor.
    // Burada ham hatayi (tam stack ile) yakalayip stderr'a yaziyoruz.
    console.error("[PRISMA-INIT-HATA]", err);
    throw err;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
