# PestShield — App (app.pestshield.com)

Next.js 15 + React 19 + TypeScript. Login, dashboard ve tüm kimlik
doğrulama akışları burada — pazarlama sitesi (`pestshield.com`) ayrı bir
proje olan [`pestshield-frontend`](../pestshield-frontend)'dedir.

## Teknoloji

Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) ·
Framer Motion · Prisma · PostgreSQL · NextAuth (Auth.js v5) · React Query ·
TanStack Table · Zod · React Hook Form · UploadThing · Recharts · otplib (2FA)

## Kurulum

```bash
npm install
cp .env.example .env   # DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL doldur
npx prisma generate
npm run db:seed        # test kullanıcıları oluşturur (aşağıya bakın)
npm run dev            # varsayılan: localhost:3200
```

## Sprint 2 — Authentication sayfaları

| Sayfa | Yol | Not |
|---|---|---|
| Giriş Yap | `/login` | Şirket Kodu paneliyle aynı ekranda, kayan geçiş |
| Şirket Kodu | `/login` (sağ panel) | Yeni firma, Pak İş'in verdiği kodla katılır |
| Şifremi Unuttum | `/forgot-password` | Token üretir, **dev modunda** linki ekranda gösterir |
| Şifre Sıfırlama | `/reset-password?token=...` | |
| 2FA | `/2fa` | TOTP (otplib), `sessionStorage` üzerinden e-posta/şifreyi taşır |
| E-posta Doğrulama | `/verify-email` | `GET /api/auth/verify-email?token=...` sonucu |

`/login` sayfasının tasarımı, paylaşılan "auth-switch" bileşeninin
PestShield'e uyarlanmış hâlidir: orijinal Sign In/Sign Up kayan panel
mekaniği birebir korunmuş, sadece açık self-signup olmadığı için sağ panel
"Şirket Kodu ile Katıl" olarak yeniden amaçlandırılmıştır. Görünmeyen
panel `inert` ile klavye/ekran okuyucu erişiminden tamamen çıkarılır.

## ⚠️ Gerçek e-posta gönderimi henüz bağlı değil

`forgot-password` ve `company-code` API route'ları token'ı gerçekten
üretip veritabanına yazar, ama **gerçek bir SMTP/e-posta servisi
bağlanmadı**. Geliştirme modunda link doğrudan API yanıtında
(`devResetLink` / `devVerifyLink`) döner ve ilgili sayfada gösterilir.
Prod'a çıkmadan önce bir e-posta servisi (Resend, SMTP vb.) bağlanmalı.

## Test kullanıcıları

| E-posta | Rol | Not |
|---|---|---|
| admin@pestshield.app | ADMIN | |
| tech@pestshield.app | TECH | **2FA aktif** — TOTP secret: `M3FEIOI6VZDAYNWD2R7SOASYWPGNUWOR` (bir authenticator uygulamasına elle girip test edebilirsiniz) |
| client@pestshield.app | CLIENT | |

Hepsinin şifresi: `Sprint0!23`

Demo şirket kodu (Şirket Kodu ile Katıl akışını test etmek için):
`PESTSHIELD-DEMO`

## Veritabanı

Aynı Supabase Postgres'i kullanır (artık sadece bu proje erişiyor).
Sprint 2'de eklenenler: `users.companyName` / `twoFactorEnabled` /
`twoFactorSecret`, `password_reset_tokens`, `company_codes` tabloları.
`Company` (tam ilişkisel firma/tenant modeli), `License`, `Device`,
`ActivityLog` gibi iş alanı modelleri henüz **yok** — sonraki bir sprintte
eklenecek.

## Doğrulama

`tsc --noEmit`, `next build` ve gerçek tarayıcı testleri (login/şirket
kodu kayan geçiş, 2FA ekranı, forgot-password) bu sprintte çalıştırıldı.
Gerçek bir DB round-trip'i (Prisma → Postgres) bu sandbox'ta test
edemedim çünkü Supabase host'una DNS erişimi yok; sunucu logları hatanın
tam olarak beklenen yerde (ağ katmanı) oluştuğunu gösterdi.
