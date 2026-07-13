import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthSwitchShell } from "@/components/auth/auth-switch-shell";

export const metadata: Metadata = {
  title: "Giriş Yap · PestShield",
};

export default function LoginPage() {
  return (
    <Suspense>
      <AuthSwitchShell />
    </Suspense>
  );
}
