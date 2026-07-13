# PestShield — Frontend

"Denetime Hazır, Veri Odaklı Dijital Kalkan" — Next.js 16 + TypeScript +
Tailwind CSS v4 + shadcn/ui (Base UI). `ipm-backend`'in frontend'idir.

## Kurulum

```bash
npm install
cp .env.local.example .env.local   # Supabase URL/anon key + backend API URL'ini doldur
npm run dev
```

## Auth mimarisi

- **Login/Signup/Session tamamen Supabase Auth client SDK'sı ile
  yapılır** (`src/lib/supabase/client.ts`) — bu proje kendi JWT'sini
  üretmez. Session (access + refresh token) Supabase SDK tarafından
  otomatik yönetilir (varsayılan: localStorage), elle yazmaya gerek yok.
- **`src/lib/api/client.ts`** — ipm-backend'e yapılan istekler için axios
  instance'ı. İstek interceptor'ı güncel Supabase access token'ını
  `Authorization: Bearer` header'ına ekler; yanıt interceptor'ı 401'de
  oturumu kapatıp `/login`'e yönlendirir.
- **Rol bazlı yönlendirme**: login/signup sonrası `GET /users/me`
  (ipm-backend) çağrılır, dönen `role` (`admin`\|`tech`\|`client`)
  `src/lib/auth/role-redirect.ts` ile dashboard yoluna eşlenir.
  `public.users` RLS ile kilitli olduğu için rol bilgisine Supabase
  client'ından doğrudan (PostgREST ile) ulaşılamaz; bu yüzden backend'in
  `/users/me` ucu gereklidir.

## Kayıt (Sign Up) davranışı

- **Firma Tipi = Hizmet Alan Müşteri**: `supabase.auth.signUp()` çağrılır,
  DB trigger'ı hesabı otomatik `client` rolüyle açar, oturum varsa
  doğrudan `/dashboard/client`'a yönlendirilir.
- **Firma Tipi = Pak İş Personeli**: Güvenlik gereği self-signup ile
  admin/tech rolü **asla** anında atanmaz (rol sadece service_role/Admin
  API ile `app_metadata` üzerinden set edilebilir — bkz.
  `ipm-backend/docs/DATABASE_SCHEMA.md`). Hesap yine `client` rolüyle
  açılır ama kullanıcıya "yönetici onayı bekleniyor" mesajı gösterilir;
  gerçek rol ataması bir admin tarafından manuel yapılmalıdır (bu turda
  admin onay ekranı **kapsam dışı** bırakıldı).

## Sayfalar

```
src/app/
  login/page.tsx
  signup/page.tsx
  dashboard/{admin,tech,client}/page.tsx   # yer tutucu, gerçek içerik ayrı iş kalemi
```

## Doğrulama

`npx tsc --noEmit`, `npm run build` ve gerçek tarayıcı önizlemesi
(masaüstü + mobil viewport, form validasyon hataları) bu turda
çalıştırıldı — hepsi başarılı.
