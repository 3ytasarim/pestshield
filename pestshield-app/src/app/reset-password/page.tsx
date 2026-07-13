import type { Metadata } from "next";
import { Suspense } from "react";
import { SimpleAuthCard } from "@/components/auth/simple-auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Şifre Sıfırla · PestShield",
};

export default function ResetPasswordPage() {
  return (
    <SimpleAuthCard title="Yeni Şifre Belirleyin">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </SimpleAuthCard>
  );
}
