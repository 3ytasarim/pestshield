import type { Metadata } from "next";
import { ActivateLicenseForm } from "@/components/auth/activate-license-form";

export const metadata: Metadata = {
  title: "Lisans Aktivasyonu · PestShield",
};

export default function ActivateLicensePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
      <ActivateLicenseForm />
    </div>
  );
}
