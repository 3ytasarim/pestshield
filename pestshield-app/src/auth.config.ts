import type { NextAuthConfig } from "next-auth";
import { getDashboardPathForRole } from "@/lib/dashboard-path";
import type { Role } from "@/generated/prisma/enums";

/**
 * Edge-safe config: middleware bunu kullanır. Prisma (Node.js) burada
 * KESİNLİKLE import edilmemeli - middleware Edge runtime'da çalışır ve
 * Prisma Client edge'de çalışmaz. Credentials provider ve adapter,
 * sadece Node runtime'da çalışan `src/auth.ts`'e eklenir.
 */
export const authConfig = {
  // Vercel dışı hosting'lerde (ör. cPanel/Passenger) Auth.js gelen isteğin
  // Host header'ını otomatik güvenilir saymaz - aksi halde NEXTAUTH_URL doğru
  // olsa bile "UntrustedHost" hatasıyla tüm auth istekleri 500 döner.
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id!;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role as Role | undefined;
      const path = nextUrl.pathname;
      const isDashboard = path.startsWith("/dashboard");

      if (isDashboard && !isLoggedIn) {
        return false; // next-auth otomatik olarak /login'e yönlendirir
      }

      if (isLoggedIn && path === "/login") {
        return Response.redirect(
          new URL(getDashboardPathForRole(role!), nextUrl),
        );
      }

      if (isDashboard && role) {
        const ownPrefix = getDashboardPathForRole(role);
        if (!path.startsWith(ownPrefix)) {
          return Response.redirect(new URL(ownPrefix, nextUrl));
        }
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
