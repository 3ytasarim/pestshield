# Veritabanı Şeması — IPM / Pest Control Backend

PostgreSQL (Supabase) üzerinde, BRCGS ve HACCP izlenebilirlik ilkelerine
uygun, sade 3 tablolu bir model. Şemanın **kaynağı Supabase migration'larıdır**
(bu depodaki TypeORM entity'leri o şemayı birebir yansıtır; `synchronize`
her zaman `false`'dur).

Supabase projesi: `3ytasarim` (ref: `rluitlnbxzjuwcbabpoq`).

## Varlıklar ve İlişkiler

```
auth.users (Supabase Auth)
  └─ 1:1 ─ public.users (role: admin | tech | client)
              └─ 1:n ─ devices (role=client için, client_id)
                          └─ 1:n ─ activity_logs
              └─ 1:n ─ activity_logs (role=tech için, technician_id)
```

### 1. `users` — Kullanıcı profili (auth.users ile 1-1)
`id`, Supabase Auth'taki `auth.users.id` ile birebir aynıdır — asla
otomatik üretilmez. Yeni bir `auth.users` kaydı oluştuğunda
`handle_new_auth_user()` trigger'ı bu profili otomatik açar.

| Kolon | Tip | Not |
|---|---|---|
| `id` | uuid (PK, FK→auth.users) | |
| `email` | varchar(255) unique | |
| `role` | enum `admin`\|`tech`\|`client` | **sadece** `auth.users.raw_app_meta_data` üzerinden (service_role/Admin API) belirlenir |
| `is_active` | boolean | admin bir tech/client hesabını devre dışı bırakabilir |

- **admin**: Pak İş (ilaçlama firması) personeli/yöneticisi — tüm veriyi görür
- **tech**: Saha personeli — cihaz kontrolü yapar, `activity_logs` oluşturur
- **client**: Müşteri — sadece kendi cihazlarını ve kontrol geçmişini görür

### 2. `devices` — Sahadaki ekipman (QR kod ile okutulur)

| Kolon | Tip | Not |
|---|---|---|
| `qr_code` | varchar unique | sahada QR ile okutulan benzersiz kod |
| `type` | enum `rodent_box`\|`live_trap`\|`eft_fly` | |
| `location_zone` | varchar | serbest metin konum/bölge tanımı |
| `client_id` | uuid → `users.id` | 1 client'ın n cihazı olabilir |

`client_id` silme davranışı **RESTRICT**: cihazı/kontrol geçmişi olan bir
müşteri hesabı yanlışlıkla silinerek denetim izi kaybolmasın diye.

### 3. `activity_logs` — Trend analizinin ana tablosu

| Kolon | Tip | Not |
|---|---|---|
| `device_id` | uuid → `devices.id` (CASCADE) | |
| `technician_id` | uuid → `users.id` (RESTRICT) | |
| `consumption_level` | enum `Yok`\|`Az`\|`Orta`\|`Tam` | |
| `pest_count` | integer | |
| `pest_type` | varchar, nullable | |
| `checked_at` | timestamptz | kontrolün fiilen yapıldığı an |

`(device_id, checked_at)` üzerinde bileşik index — trend sorgularının
(bir cihazın zaman içindeki aktivite grafiği) performansı için.
Bilinçli olarak **UPDATE/DELETE ucu yoktur**: trend analizini besleyen
veri, oluşturulduktan sonra değiştirilemez.

## Supabase Auth entegrasyonu

- Kullanıcılar Supabase Auth Admin API ile oluşturulur (`app_metadata.role`
  set edilerek); `handle_new_auth_user()` trigger'ı otomatik profil açar.
- NestJS backend token **üretmez**, sadece Supabase'in imzaladığı access
  token'ı `SUPABASE_JWT_SECRET` ile doğrular (bkz. `src/modules/auth`).
- Login/refresh/logout tamamen Supabase Auth client SDK'sı üzerinden yapılır.

## RLS

Her tabloda RLS **açık**, policy **tanımlanmadı** → sadece `service_role`
(RLS'i bypass eder) erişebilir. Backend her zaman `service_role`
bağlantısıyla (doğrudan Postgres bağlantısı) çalışmalıdır; `anon`/
`authenticated` rolleriyle PostgREST üzerinden hiçbir tabloya erişim yoktur.
