import type { Metadata } from "next";
import Link from "next/link";
import { MailWarning } from "lucide-react";
import { SimpleAuthCard } from "@/components/auth/simple-auth-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "E-posta Doğrulama · PestShield",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const isInvalid = status === "invalid";

  return (
    <SimpleAuthCard title="E-posta Doğrulama">
      <div className="flex flex-col items-center gap-4 text-center">
        <MailWarning className="size-8 text-amber-500" />
        <p className="text-sm text-muted-foreground">
          {isInvalid
            ? "Bu doğrulama bağlantısının süresi dolmuş veya zaten kullanılmış."
            : "Doğrulama bağlantınızı kontrol ediliyor…"}
        </p>
        <Button nativeButton={false} render={<Link href="/login" />} className="rounded-full">
          Giriş sayfasına dön
        </Button>
      </div>
    </SimpleAuthCard>
  );
}
