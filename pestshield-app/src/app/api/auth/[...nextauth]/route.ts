import type { NextRequest } from "next/server";

// Gecici tani: Statik `import { handlers } from "@/auth"` derleme anindan
// once calisiyor ve try/catch ile sarilamiyor - eger hata "@/auth" modulunun
// (veya onun bagimliliklarinin) kendi ust-seviye degerlendirmesi sirasinda
// olusuyorsa, statik import bunu hic yakalayamaz. Dinamik `import()` ise bir
// Promise dondurur ve modul degerlendirme hatalarini da reddeder (reject) -
// boylece burada yakalayabiliriz.
async function testImports() {
  const steps: Array<[string, () => Promise<unknown>]> = [
    ["next-auth", () => import("next-auth")],
    ["next-auth/providers/credentials", () => import("next-auth/providers/credentials")],
    ["@auth/prisma-adapter", () => import("@auth/prisma-adapter")],
    ["bcryptjs", () => import("bcryptjs")],
    ["otplib", () => import("otplib")],
    ["@/lib/db", () => import("@/lib/db")],
    ["@/auth.config", () => import("@/auth.config")],
    ["@/lib/validations/auth", () => import("@/lib/validations/auth")],
    ["@/lib/auth-constants", () => import("@/lib/auth-constants")],
  ];
  for (const [name, fn] of steps) {
    try {
      await fn();
      console.error(`[IMPORT-OK] ${name}`);
    } catch (err) {
      console.error(`[IMPORT-HATA] ${name}`, err);
      throw err;
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    await testImports();
    const { handlers } = await import("@/auth");
    return await handlers.GET(req);
  } catch (err) {
    console.error("[AUTH-ROUTE-GET-HATA]", err);
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { handlers } = await import("@/auth");
    return await handlers.POST(req);
  } catch (err) {
    console.error("[AUTH-ROUTE-POST-HATA]", err);
    throw err;
  }
}
