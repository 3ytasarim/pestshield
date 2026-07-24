"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn, getSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail, Lock, Building2, User, Loader2, MailCheck } from "lucide-react";

import {
  loginSchema,
  type LoginFormValues,
  companyRegisterSchema,
  type CompanyRegisterFormValues,
} from "@/lib/validations/auth";
import { TWO_FACTOR_REQUIRED } from "@/lib/auth-constants";
import { getDashboardPathForRole } from "@/lib/dashboard-path";
import "@/components/auth/auth-switch.css";

/**
 * Paylaşılan "auth-switch" demosunun BİREBİR portu: aynı CSS (positioning,
 * geçiş süreleri, breakpoint'ler, dönen "blob" mekaniği) taşındı. Form
 * içerikleri ayrı alt bileşenlerde (LoginFormContent/CompanyRegisterFormContent)
 * render edildiği için normal `<style jsx>` scoping'i onlara ulaşmıyor. Stiller
 * `auth-switch.css` dosyasında düz CSS olarak tanımlı (benzersiz
 * `.auth-switch-scope` wrapper class'ı ile genel `.container`/`.btn`/`form`
 * gibi isimlerin uygulamanın geri kalanına sızması önleniyor) ve normal bir
 * import olarak yükleniyor - `<style jsx global>` istemci tarafında mount
 * anında enjekte edildiği için ilk yüklemede kısa süreli stilsiz görünüme
 * (FOUC) yol açıyordu; statik CSS import'u derleme zamanında sayfaya
 * bağlandığı için bu sorunu ortadan kaldırıyor. İçerik/renk aynı bırakıldı; sadece:
 *  - Sign Up formu -> gerçek "Firma Kaydı" formuna (kod gerektirmeyen,
 *    firma sahibinin kendi firmasını kaydettiği 4 alanlı form)
 *  - Statik input'lar -> react-hook-form + gerçek signIn/API çağrıları
 *  - Emoji ikonlar (📧🔒) -> lucide-react ikonları
 *  - Sosyal medya satırı kaldırıldı (backend'de OAuth desteği yok, ölü link
 *    olurdu)
 * ile değiştirildi. Renk paleti PestShield logosundan örneklenen lacivert/mavi
 * tonlarına (#0877b2/#0d4d8f) uyarlandı - orijinal demonun moru değil.
 */
/** Tek firmalı (self-hosted, müşteriye özel sunucuya kurulan) dağıtımlarda
 * `NEXT_PUBLIC_ENABLE_SELF_REGISTRATION=false` ile "Firma Kaydı" tamamen
 * kapatılır — o kurulumda zaten tek firma olacağı için kayıt ekranı anlamsız,
 * doğrudan giriş formu gösterilir. Varsayılan (env ayarlanmazsa) açıktır —
 * çok-kiracılı ana SaaS dağıtımı hiçbir değişiklik gerektirmez. */
const SELF_REGISTRATION_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SELF_REGISTRATION !== "false";

interface AuthSwitchShellProps {
  /** Standalone (tek firmalı) dağıtımlarda o firmanın kendi logosu — çok
   * kiracılı SaaS'ta hiç kullanılmaz, her zaman PestShield logosu gösterilir. */
  tenantLogoUrl?: string | null;
  tenantName?: string | null;
}

export function AuthSwitchShell({ tenantLogoUrl, tenantName }: AuthSwitchShellProps = {}) {
  if (!SELF_REGISTRATION_ENABLED) {
    return <LoginOnlyShell tenantLogoUrl={tenantLogoUrl} tenantName={tenantName} />;
  }
  return <AuthSwitchTabs />;
}

function LoginOnlyShell({ tenantLogoUrl, tenantName }: AuthSwitchShellProps) {
  return (
    <div className="auth-switch-scope">
      <div className="page">
        <div className="login-only-card">
          {tenantLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenantLogoUrl}
              alt={tenantName ?? "Firma logosu"}
              className="login-only-logo"
              style={{ objectFit: "contain" }}
            />
          ) : (
            <Image
              src="/logo-wordmark.png"
              alt="PestShield"
              width={1113}
              height={208}
              className="login-only-logo"
            />
          )}
          <LoginFormContent />
        </div>
      </div>
    </div>
  );
}

function AuthSwitchTabs() {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="auth-switch-scope">
      <div className="page">
        <div className={`container${isRegister ? " sign-up-mode" : ""}`}>
          <div className="container-before" aria-hidden />

          <div className="forms-container">
            <div className="signin-signup">
              <div className="form-slot sign-in-form">
                <LoginFormContent />
              </div>
              <div className="form-slot sign-up-form">
                <CompanyRegisterFormContent />
              </div>
            </div>
          </div>

          <div className="panels-container">
            <div className="panel left-panel">
              <div className="content">
                <Image
                  src="/logo-wordmark.png"
                  alt="PestShield"
                  width={1113}
                  height={208}
                  className="panel-logo"
                />
                <h3>Firmanız mı var?</h3>
                <p>
                  Firmanızı saniyeler içinde kaydedin, PestShield&apos;ı
                  hemen kullanmaya başlayın.
                </p>
                <button
                  type="button"
                  className="btn transparent"
                  onClick={() => setIsRegister(true)}
                >
                  Katıl
                </button>
              </div>
            </div>
            <div className="panel right-panel">
              <div className="content">
                <Image
                  src="/logo-wordmark.png"
                  alt="PestShield"
                  width={1113}
                  height={208}
                  className="panel-logo"
                />
                <h3>Zaten hesabınız var mı?</h3>
                <p>Devam etmek için e-posta ve şifrenizle giriş yapın.</p>
                <button
                  type="button"
                  className="btn transparent"
                  onClick={() => setIsRegister(false)}
                >
                  Giriş Yap
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.code === TWO_FACTOR_REQUIRED) {
        sessionStorage.setItem(
          "pestshield:pending-2fa",
          JSON.stringify({ email: values.email, password: values.password }),
        );
        router.push("/2fa");
        return;
      }

      if (result?.error) {
        toast.error("E-posta veya şifre hatalı");
        return;
      }

      toast.success("Giriş başarılı, yönlendiriliyorsunuz…");
      const session = await getSession();
      router.push(getDashboardPathForRole(session!.user.role));
      router.refresh();
    } catch {
      toast.error("Bir şeyler ters gitti, lütfen tekrar deneyin");
    } finally {
      setIsSubmitting(false);
    }
  }

  const justVerified = searchParams.get("verified") === "1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 className="title">Giriş Yap</h2>
      {justVerified && (
        <p style={{ color: "#16a34a", fontSize: "0.8rem", marginBottom: 8 }}>
          E-posta adresiniz doğrulandı.
        </p>
      )}

      <div className="input-field">
        <Mail size={18} />
        <input type="email" placeholder="E-posta" autoComplete="email" {...register("email")} />
      </div>
      {errors.email && <p className="field-error">{errors.email.message}</p>}

      <div className="input-field">
        <Lock size={18} />
        <input
          type="password"
          placeholder="Şifre"
          autoComplete="current-password"
          {...register("password")}
        />
      </div>
      {errors.password && <p className="field-error">{errors.password.message}</p>}

      <Link
        href="/forgot-password"
        style={{ fontSize: "0.8rem", color: "#888", alignSelf: "flex-end", marginTop: 4 }}
      >
        Şifremi unuttum
      </Link>

      <button type="submit" className="btn solid" disabled={isSubmitting}>
        {isSubmitting && <Loader2 size={16} className="spin" />}
        Giriş
      </button>
    </form>
  );
}

function CompanyRegisterFormContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devVerifyLink, setDevVerifyLink] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyRegisterFormValues>({ resolver: zodResolver(companyRegisterSchema) });

  async function onSubmit(values: CompanyRegisterFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/company-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message ?? "Firma kaydı oluşturulamadı");
        return;
      }

      toast.success(data.message ?? "Firma hesabınız oluşturuldu!");
      setDevVerifyLink(data.devVerifyLink ?? null);
    } catch {
      toast.error("Bir şeyler ters gitti, lütfen tekrar deneyin");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (devVerifyLink) {
    return (
      <div style={{ textAlign: "center" }}>
        <MailCheck size={32} color="#0877b2" style={{ margin: "0 auto 12px" }} />
        <h2 className="title" style={{ fontSize: "1.4rem" }}>
          E-postanızı Doğrulayın
        </h2>
        <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: 10 }}>
          Hesabınızı aktive etmek için gönderdiğimiz bağlantıya tıklayın.
        </p>
        <a href={devVerifyLink} style={{ fontSize: "0.75rem", color: "#0877b2" }}>
          (Geliştirme modu) Doğrulama bağlantısı
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 className="title" style={{ fontSize: "1.7rem" }}>
        Firma Kaydı
      </h2>

      <div className="input-field">
        <Building2 size={18} />
        <input placeholder="Firma Adı" autoComplete="organization" {...register("companyName")} />
      </div>
      {errors.companyName && <p className="field-error">{errors.companyName.message}</p>}

      <div className="input-field">
        <User size={18} />
        <input placeholder="Yetkili Ad Soyad" autoComplete="name" {...register("fullName")} />
      </div>
      {errors.fullName && <p className="field-error">{errors.fullName.message}</p>}

      <div className="input-field">
        <Mail size={18} />
        <input type="email" placeholder="E-posta" autoComplete="email" {...register("email")} />
      </div>
      {errors.email && <p className="field-error">{errors.email.message}</p>}

      <div className="input-field">
        <Lock size={18} />
        <input
          type="password"
          placeholder="Şifre"
          autoComplete="new-password"
          {...register("password")}
        />
      </div>
      {errors.password && <p className="field-error">{errors.password.message}</p>}

      <div className="input-field">
        <Lock size={18} />
        <input
          type="password"
          placeholder="Şifre (Tekrar)"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
      </div>
      {errors.confirmPassword && <p className="field-error">{errors.confirmPassword.message}</p>}

      <button type="submit" className="btn" disabled={isSubmitting}>
        {isSubmitting && <Loader2 size={16} className="spin" />}
        Katıl
      </button>
    </form>
  );
}
