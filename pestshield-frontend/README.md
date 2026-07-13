# PestShield — Marketing Site (pestshield.com)

Next.js 15 + React 19 + TypeScript. Bu proje **sadece pazarlama sitesidir**
(`pestshield.com`) — hiçbir auth/veritabanı bağımlılığı yoktur. Uygulama
(login, dashboard, tüm auth akışları) `app.pestshield.com` altında **ayrı
bir proje** olan [`pestshield-app`](../pestshield-app) içindedir.

## Teknoloji

Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) ·
Framer Motion · Zod · React Hook Form

## Kurulum

```bash
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_APP_URL'i doldur
npm run dev
```

## Domain ayrımı

- `pestshield.com` (bu proje) → sadece landing page, hiçbir kullanıcı verisi
  tutmaz.
- `app.pestshield.com` (`pestshield-app`) → login, şifremi unuttum, şirket
  kodu, 2FA, e-posta doğrulama, dashboard.

Navbar/Pricing/Footer'daki "Giriş Yap" ve "Ücretsiz Demo" CTA'ları
`NEXT_PUBLIC_APP_URL` ortam değişkeniyle (yerelde `http://localhost:3200`,
prod'da `https://app.pestshield.com`) cross-origin `<a>` linki olarak
`pestshield-app`'e yönlendirir — Next.js `<Link>` kullanılmaz çünkü hedef
başka bir origin'dir.

## Sayfa

```
src/app/page.tsx   → tek sayfa: Hero, Özellikler, AI, Audit Ready,
                     Dashboard Önizleme, Referanslar, Paketler, SSS, Footer
src/components/landing/   → tüm bölümler + motion/ (scroll reveal, tilt,
                             counter, parallax)
```

## Not

`pestshield-frontend-legacy/` klasörü, bu projenin Supabase tabanlı ilk
mimarisinin arşividir (artık kullanılmıyor, referans için duruyor).
