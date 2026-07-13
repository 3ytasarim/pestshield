import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Kayıt Ol · PestShield",
};

export default function SignupPage() {
  return (
    <AuthShell
      title="Firmanızı kaydedin"
      subtitle="Kayıt onaylandıktan sonra lisansınızı aktive edebilirsiniz"
      footer={
        <>
          Zaten hesabınız var mı?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Giriş yapın
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
