import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Giriş Yap · PestShield",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Tekrar hoş geldiniz"
      subtitle="Devam etmek için hesabınıza giriş yapın"
      footer={
        <>
          Hesabınız yok mu?{" "}
          <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
            Kayıt olun
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
