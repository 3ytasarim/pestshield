import type { Role } from "@/generated/prisma";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
    /** Gerçekte giriş yapan kullanıcının kendi id'si. Alt kullanıcı (CompanyUser) girişlerinde `id`'den farklıdır — `id` her zaman kiracı (tenant) sahibinin id'sidir. */
    actingUserId: string;
    /** Alt kullanıcının atanmış CompanyRole id'si. `null` = kiracı sahibi, sınırsız erişim. */
    companyRoleId: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      actingUserId: string;
      companyRoleId: string | null;
    } & DefaultSession["user"];
  }
}

// next-auth/jwt sadece @auth/core/jwt'yi re-export ediyor; declaration
// merge'in gerçekten tutması için asıl modülü augment ediyoruz.
declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
    id: string;
    actingUserId: string;
    companyRoleId: string | null;
  }
}
