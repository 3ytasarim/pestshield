"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, ShieldQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { getDashboardPathForRole } from "@/lib/dashboard-path";

const SESSION_KEY = "pestshield:pending-2fa";

interface PendingLogin {
  email: string;
  password: string;
}

export function TwoFactorForm() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingLogin | null>(null);
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      toast.error("Önce e-posta ve şifrenizle giriş yapmalısınız");
      router.push("/login");
      return;
    }
    setPending(JSON.parse(raw) as PendingLogin);
  }, [router]);

  async function handleVerify() {
    if (!pending || otp.length !== 6) return;
    setIsSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email: pending.email,
        password: pending.password,
        otp,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Kod hatalı veya süresi doldu");
        setOtp("");
        return;
      }

      sessionStorage.removeItem(SESSION_KEY);
      toast.success("Doğrulandı, yönlendiriliyorsunuz…");
      const session = await getSession();
      router.push(getDashboardPathForRole(session!.user.role));
      router.refresh();
    } catch {
      toast.error("Bir şeyler ters gitti, lütfen tekrar deneyin");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!pending) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <ShieldQuestion className="size-8 text-emerald-600" />
      <p className="text-center text-sm text-muted-foreground">
        Kimlik doğrulama uygulamanızdaki 6 haneli kodu girin
      </p>

      <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus>
        <InputOTPGroup>
          {Array.from({ length: 6 }).map((_, index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTPGroup>
      </InputOTP>

      <Button
        className="h-11 w-full rounded-full"
        disabled={otp.length !== 6 || isSubmitting}
        onClick={handleVerify}
      >
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Doğrula
      </Button>
    </div>
  );
}
