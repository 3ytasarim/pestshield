import type { Metadata } from "next";
import { SimpleAuthCard } from "@/components/auth/simple-auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Şifremi Unuttum · PestShield",
};

export default function ForgotPasswordPage() {
  return (
    <SimpleAuthCard
      title="Şifremi Unuttum"
      subtitle="E-posta adresinize bir sıfırlama bağlantısı gönderelim"
    >
      <ForgotPasswordForm />
    </SimpleAuthCard>
  );
}
