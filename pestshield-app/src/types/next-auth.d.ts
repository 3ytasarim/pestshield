import type { Role } from "@/generated/prisma";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

// next-auth/jwt sadece @auth/core/jwt'yi re-export ediyor; declaration
// merge'in gerçekten tutması için asıl modülü augment ediyoruz.
declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
    id: string;
  }
}
