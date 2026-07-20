import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { verify as verifyTotp } from "otplib";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";
import { loginSchema } from "@/lib/validations/auth";
import { TWO_FACTOR_REQUIRED } from "@/lib/auth-constants";

// Auth.js sadece `CredentialsSignin` (ve türevlerini) istemciye "code" alanıyla
// birlikte iletir - düz `throw new Error(...)` her zaman `CallbackRouteError`e
// sarılıp istemciye "Configuration" olarak düşer (bkz. @auth/core/errors
// isClientError). Bu yüzden 2FA sinyali `code` üzerinden taşınıyor.
class TwoFactorRequiredError extends CredentialsSignin {
  code = TWO_FACTOR_REQUIRED;
}

function initAuth() {
  try {
    return NextAuth({
      ...authConfig,
      adapter: PrismaAdapter(prisma),
      providers: [
        Credentials({
          credentials: {
            email: { label: "E-posta", type: "email" },
            password: { label: "Şifre", type: "password" },
            otp: { label: "2FA Kodu", type: "text" },
          },
          async authorize(credentials) {
            const parsed = loginSchema.safeParse(credentials);
            if (!parsed.success) {
              return null;
            }

            const user = await prisma.user.findUnique({
              where: { email: parsed.data.email },
            });
            if (!user?.password || !user.isActive) {
              return null;
            }

            const passwordMatches = await bcrypt.compare(
              parsed.data.password,
              user.password,
            );
            if (!passwordMatches) {
              return null;
            }

            if (user.twoFactorEnabled) {
              if (!parsed.data.otp) {
                // Login formu result.code'u yakalayıp /2fa'ya yönlendirir.
                throw new TwoFactorRequiredError();
              }
              const result = await verifyTotp({
                secret: user.twoFactorSecret!,
                token: parsed.data.otp,
              });
              if (!result.valid) {
                return null;
              }
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          },
        }),
      ],
      callbacks: {
        ...authConfig.callbacks,
      },
    });
  } catch (err) {
    // Gecici tani: NextAuth()/PrismaAdapter() kurulumu sirasinda senkron bir
    // hata olursa tam stack trace'i (Next.js'in formatlayicisina ugramadan)
    // yakalamak icin.
    console.error("[AUTH-INIT-HATA]", err);
    throw err;
  }
}

export const { handlers, auth, signIn, signOut } = initAuth();
