import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Edge runtime'da çalışır - sadece authConfig (Prisma'sız) kullanılır.
 * Rol bazlı yönlendirme mantığı authConfig.callbacks.authorized içindedir.
 */
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
