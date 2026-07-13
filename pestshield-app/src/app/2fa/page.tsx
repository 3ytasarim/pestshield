import type { Metadata } from "next";
import { SimpleAuthCard } from "@/components/auth/simple-auth-card";
import { TwoFactorForm } from "@/components/auth/two-factor-form";

export const metadata: Metadata = {
  title: "İki Adımlı Doğrulama · PestShield",
};

export default function TwoFactorPage() {
  return (
    <SimpleAuthCard title="İki Adımlı Doğrulama">
      <TwoFactorForm />
    </SimpleAuthCard>
  );
}
