# IPM Backend — Pest Control (BRCGS/HACCP)

NestJS + TypeORM + Supabase (PostgreSQL + Auth) backend. Şema detayları
için [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md).

## Kurulum

```bash
npm install
cp .env.example .env   # Supabase DB şifresi, SERVICE_ROLE_KEY, JWT_SECRET'ı doldur
npm run start:dev
```

Gerekli değerler Supabase Dashboard'dan alınır:
- `DB_PASSWORD` → Project Settings > Database
- `SUPABASE_SERVICE_ROLE_KEY` → Project Settings > API
- `SUPABASE_JWT_SECRET` → Project Settings > API > JWT Settings

## Auth

Bu backend **token üretmez**. Login/signup/refresh/logout Supabase Auth
client SDK'sı (`@supabase/supabase-js`) üzerinden frontend'de yapılır.
Backend sadece gelen Supabase access token'ını doğrular
(`src/modules/auth/strategies/jwt.strategy.ts`) ve `public.users`
profilini okuyup `request.user`'ı doldurur.

Yeni kullanıcı oluşturma (admin panelinden) Supabase Admin API ile yapılır:

```ts
await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { role: 'tech' }, // 'admin' | 'tech' | 'client'
});
```

`handle_new_auth_user()` DB trigger'ı bu kullanıcı için otomatik olarak
`public.users` profilini açar.

Diğer tüm endpoint'ler `Authorization: Bearer <supabase-access-token>`
gerektirir (`@Public()` ile işaretlenenler hariç).

## Roller ve kapsam

| Rol | Kapsam |
|---|---|
| `admin` | Tüm kullanıcılar, cihazlar, kontrol kayıtları |
| `tech` | Cihaz oluşturma/güncelleme, kendi `activity_logs` kayıtları |
| `client` | Sadece kendi cihazları ve kontrol geçmişi (read-only) |

## Modül yapısı

```
src/modules/
  auth/             Supabase JWT doğrulama (Passport strategy)
  users/            Kullanıcı profili (admin/tech/client)
  devices/          QR kodlu saha ekipmanı (rodent_box / live_trap / eft_fly)
  activity-logs/    Trend analizi ana tablosu — UPDATE/DELETE ucu yok
```

## Mobil QR akışı (saha personeli)

1. `GET /devices/qr/:qrCode` (`admin`, `tech`) — cihazı ve izlenebilirlik
   için son 5 `activity_logs` kaydını döner: `{ device, recentActivityLogs }`
2. `POST /activity-logs` (**sadece `tech`**) — body: `deviceId`,
   `consumptionLevel` (`Yok`\|`Az`\|`Orta`\|`Tam`), `pestCount`,
   `actionTaken` (zorunlu), `pestType`/`checkedAt` (opsiyonel).
   `technicianId` body'den alınmaz, her zaman JWT'deki kimlikten set edilir.

## Docker / Cloud Code / Cloud Run

`Dockerfile` 4 aşamalıdır: `deps` → `development` (hot-reload + Node
inspector, Cloud Code debug için) → `build` → `production` (non-root,
`tini` ile PID 1, sadece prod bağımlılıkları).

```bash
# yerelde manuel build/test (Docker kuruluysa)
docker build --target production -t ipm-backend .
docker run -p 8080:8080 --env-file .env ipm-backend
```

`skaffold.yaml`, Cloud Code eklentisinin "Run/Debug on Cloud Run" akışını
tetikler: varsayılan olarak `development` hedefini kullanır, `3000`
(uygulama) ve `9229` (Node inspector, VS Code/Cloud Code "Attach"
için) portlarını forward eder.

**Doldurmanız gerekenler** (`skaffold.yaml` içinde `YOUR_GCP_PROJECT_ID`
ve region `europe-west1` placeholder'ları):
- Artifact Registry imaj adı: `<REGION>-docker.pkg.dev/<PROJECT_ID>/<REPO>/ipm-backend`
- `deploy.cloudrun.projectid` / `region`

Gerçek Cloud Run'a dağıtım (production imajıyla):

```bash
skaffold run -p production
```

> Not: Skaffold'un yerleşik Cloud Run deployer'ı (`deploy.cloudrun`)
> nispeten yeni/gelişmekte olan bir özelliktir. Bu sandbox'ta Docker/
> Skaffold/gcloud CLI çalıştıramadığım için `skaffold.yaml`'ı gerçek
> projenize karşı test edemedim — ilk kullanımda `skaffold diagnose`
> ile doğrulamanızı, gerekirse Cloud Code'un "New Application > Cloud
> Run" şablonuyla ürettiği güncel şemayla karşılaştırmanızı öneririm.
