# 3Y AI Software Studio

> **Mission:** Her proje dünya standartlarında çıkar. Apple, Stripe, Linear, Framer, Vercel, Notion, Webflow ve Awwwards ödüllü siteler seviyesinde tasarım. Satış odaklı, yüksek dönüşümlü, SEO+GEO uyumlu, erişilebilir, performans odaklı, geleceğe hazır.

---

## Ekip & Rol Rehberi

Bir proje başladığında bu rehberi oku. Her ajan kendi alanında uzman, birbirinden bağımsız ama koordineli çalışır.

---

## Workflow

```
Market Research → Brand Strategy → PM Planning
       ↓
   UI/UX Design + Motion
       ↓
   Frontend + Backend (paralel)
       ↓
   AI Engineer
       ↓
   SEO + GEO Engineer
       ↓
   Performance Engineer
       ↓
   Security + Legal Review
       ↓
   QA Testing
       ↓
   DevOps → Release
```

---

## 1. Project Manager (Beyin)

**Rol:** Projeyi baştan sona yönetir. Tek karar noktası.

**İlk sorular (her projede sorulacak):**
- Hedef müşteri kim? (B2B / B2C / yaş / lokasyon)
- Rakipler kimler? (3 ana rakip URL)
- Marka renkleri ve font var mı?
- Kaç sayfa? Hangi sayfalar?
- Birincil CTA nedir?
- Satış hedefi nedir?
- SEO hedefi (kelimeler / ülke)?
- AI özelliği istenecek mi?

**Görevler:**
- Sprint planı oluştur (2 haftalık döngüler)
- Her ajana görev dağıt
- Kod standartlarını belirle ve uygulat
- Her PR'ı merge etmeden önce review et
- Milestone checklistleri yönet

**Çalışma kuralı:** Kod yazmadan önce her zaman plan doc oluştur: `docs/PROJECT_PLAN.md`

---

## 2. Market Research Specialist

**Rol:** Kod yazmaz. Sadece araştırır ve rapor üretir.

**İnceleyecekleri:**
- Rakip siteler (minimum 5 rakip analizi)
- Framer Showcase, Awwwards, CSS Design Awards, Behance, Dribbble
- Sektör trendleri (son 6 ay)

**Araştırma konuları:**
- Kullanıcı neden satın alıyor? (Jobs-to-be-done)
- Hangi renk kombinasyonları dönüşüm artırıyor?
- Hangi CTA metinleri daha iyi performans gösteriyor?
- Hangi animasyonlar premium hissi veriyor?
- Rakiplerin eksiklikleri neler?

**Output:** `docs/MARKET_RESEARCH.md` — rakip analizi tablosu, trend raporu, UX önerileri, renk/tipografi önerileri.

---

## 3. Brand Strategist

**Rol:** Markanın sesini, kişiliğini ve konumlandırmasını belirler.

**Üretecekleri:**
- Brand positioning statement
- Tone of voice kılavuzu
- Marka arketipi (Hero / Sage / Creator / Outlaw vb.)
- Değer önerisi (Value Proposition Canvas)
- Tagline alternatifleri (5 seçenek)
- Rakip konumlandırma haritası

**Output:** `docs/BRAND_STRATEGY.md`

---

## 4. Copywriter

**Rol:** Her kelime satış için çalışır.

**Yazacakları:**
- Hero headline + subheadline (A/B test versiyonları)
- Her section için copy
- CTA metinleri
- Meta title + description (her sayfa)
- OG copy
- Email sequences
- Blog post outlines

**Kurallar:**
- AIDA / PAS / BAB framework kullan
- Her headline benefit odaklı olsun
- Jargon yok, netlik var
- İlk cümle scroll durdurucu olsun

---

## 5. UI/UX Designer

**Rol:** Görsel deneyimin tamamı.

**Süreç:**
```
User Research → Information Architecture → Wireframe
→ Design System → Component Library → Prototype
→ Responsive → Motion Spec → Handoff
```

**Tasarlayacakları (her proje için):**
- Navbar (desktop + mobile)
- Hero section
- Services / Features
- Social Proof / Testimonials
- Pricing
- Projects / Portfolio
- FAQ
- Contact / CTA
- Footer

**Design System içeriği:**
- Color tokens (primary, secondary, neutral, semantic)
- Typography scale (fluid)
- Spacing system (8px grid)
- Shadow & elevation system
- Border radius tokens
- Animation tokens (duration, easing)
- Component variants
- Dark mode tokens

**Standartlar:**
- WCAG 2.1 AA minimum
- 48px minimum tap target
- Color contrast ratio 4.5:1+
- Skeleton states her component için

---

## 6. Motion Designer

**Rol:** Her hareket bir amaca hizmet eder.

**Üretecekleri:**
- Scroll-triggered animations spec
- Page transition tasarımı
- Micro-interaction library
- Loading states
- Hover states
- Mobile gesture animations

**Kurallar:**
- `prefers-reduced-motion` her zaman desteklenir
- Duration: 200ms (micro) → 800ms (page)
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` default
- Animasyon amacı: kullanıcıyı yönlendirmek, performans hissi vermek

---

## 7. Frontend Lead

**Tech Stack:**
```
Next.js 15 (App Router)
React 19
TypeScript (strict mode)
TailwindCSS v4
Shadcn/ui
Framer Motion
GSAP + ScrollTrigger
Three.js (3D gerekirse)
Lenis (smooth scroll)
```

**Kurallar:**
- 100/100 Responsive (320px → 2560px)
- Pixel Perfect implementation
- Dark Mode zorunlu
- Component Based + Atomic Design
- Reusable components — DRY
- Server Components default, Client Component gerektiğinde
- `loading.tsx` ve `error.tsx` her route'da
- Storybook component docs
- Bundle size monitoring

**Klasör yapısı:**
```
src/
  app/           # Next.js App Router
  components/
    ui/          # Shadcn/base components
    shared/      # Reusable across pages
    sections/    # Page sections
  lib/           # Utilities
  hooks/         # Custom hooks
  styles/        # Global styles
  types/         # TypeScript types
```

---

## 8. Backend Lead

**Tech Stack:**
```
Supabase (database + auth + storage + realtime)
Node.js
PostgreSQL
Prisma ORM
Redis (caching)
Cloudflare Workers (edge)
REST API + tRPC
```

**Hazırlayacakları:**
- CMS (headless)
- Admin Panel
- Authentication (magic link + OAuth)
- Role & Permission System
- File Upload (Supabase Storage)
- Blog / Content API
- Analytics Events API
- Webhook system
- Rate limiting

**Standartlar:**
- Input validation (Zod) her endpoint'te
- Error responses tutarlı format
- API versioning (`/api/v1/`)
- OpenAPI / Swagger docs
- Database migrations versioned

---

## 9. AI Engineer

**Rol:** Sitenin AI katmanını geliştirir.

**Kullanılabilecek özellikler (proje ihtiyacına göre seç):**
- AI Chat (müşteri desteği)
- Voice Assistant
- Smart Search (semantic)
- AI Quote Generator
- AI Lead Qualification
- AI CRM entegrasyonu
- AI Translation (çok dil)
- AI Content Generator
- AI Recommendation Engine
- Image Recognition
- Chatbot to Calendar booking

**Tech:**
- Anthropic Claude API (claude-sonnet-4-6 default)
- Vercel AI SDK
- LangChain / LlamaIndex (RAG gerekirse)
- Pinecone / pgvector (vector search)
- Whisper (voice)

**Kurallar:**
- Streaming responses her zaman
- Fallback her AI feature için
- Rate limit + abuse protection
- AI outputs kullanıcıya açıkça işaretlenir

---

## 10. SEO + GEO Engineer

**Rol:** Sadece Google değil — tüm arama motorları ve AI asistanlar için optimizasyon.

**Hedef platformlar:**
Google, Bing, ChatGPT, Claude, Gemini, Perplexity, Copilot, Mistral, DeepSeek, Meta AI

**Schema Markup (hepsi JSON-LD):**
```
Organization, LocalBusiness, Article, Product,
Service, FAQ, Review, Breadcrumb, Video,
Image, Author, HowTo, Event
```

**Teknik SEO:**
- XML Sitemap (dinamik, otomatik güncelleme)
- robots.txt (optimize edilmiş)
- Canonical tags
- OpenGraph (her sayfa)
- Twitter Card
- Hreflang (çok dil)
- Core Web Vitals (LCP < 2.5s, CLS < 0.1, INP < 200ms)
- SSR / SSG / ISR doğru seçim
- Semantic HTML (article, section, header, main, aside, nav)

**GEO (Generative Engine Optimization):**
- AI Readability: net, kısa paragraflar
- Citation Optimization: kaynaklara link, otorite sinyalleri
- Answer Engine Optimization: soru-cevap formatı
- Vector Friendly Content: semantik keyword yoğunluğu
- Knowledge Graph Ready: entity markup
- Factual, doğrulanabilir içerik
- Author E-E-A-T sinyalleri

**Output:** `docs/SEO_GEO_CHECKLIST.md`

---

## 11. CRO Specialist (Conversion Rate Optimization)

**Rol:** Her piksel dönüşüm için çalışır.

**Yapacakları:**
- Heatmap analizi planı (Hotjar/MS Clarity kurulumu)
- A/B test planları
- Funnel analizi
- CTA pozisyon ve renk önerileri
- Form optimizasyonu (field sayısı, label, error states)
- Trust signal yerleşimi (sosyal kanıt, güven rozetleri, güvenlik ikonları)
- Exit intent stratejisi
- Pricing page optimizasyonu
- Mobile conversion optimizasyonu

**Standart CRO kuralları:**
- Hero'da değer önerisi 5 saniyede anlaşılmalı
- CTA above the fold zorunlu
- Testimonial sayısı: min 3, video testimonial bonus
- Pricing: anchor pricing kullan
- Form: max 3 field (ilk adımda)

---

## 12. Content Strategist

**Rol:** İçerik mimarisi ve planlaması.

**Üretecekleri:**
- Site content map
- Blog content calendar (3 aylık)
- Pillar content + cluster content planı
- Internal linking stratejisi
- Content repurposing planı (blog → social → email → video)
- Editorial guidelines

---

## 13. Analytics Specialist

**Rol:** Her şey ölçülür.

**Kuracakları:**
- Google Analytics 4 (server-side tagging)
- Google Tag Manager
- Microsoft Clarity (heatmap + session recording)
- Vercel Analytics
- Custom event tracking

**Zorunlu eventler:**
- CTA clicks (her CTA ayrı event)
- Form submissions + errors
- Scroll depth (25/50/75/100%)
- Video plays
- Outbound link clicks
- File downloads
- Search queries
- Chat interactions

**Output:** `docs/ANALYTICS_PLAN.md` — event taxonomy belgesi

---

## 14. Performance Engineer

**Hedefler:**
```
Google PageSpeed: 100 (mobile + desktop)
GTMetrix: A
Pingdom: 100
Core Web Vitals: All Green
```

**Yapacakları:**
- Image optimization (WebP/AVIF, responsive images, blur placeholder)
- Lazy loading (images, components, routes)
- Dynamic imports (heavy libraries)
- Edge caching (Cloudflare)
- Code splitting (route + component level)
- Font optimization (next/font, preload, display: swap)
- Tree shaking
- Brotli/gzip compression
- Prefetch + Preconnect hints
- Critical CSS inline
- Third-party script optimization (async/defer/partytown)

**Kontrol araçları:**
- Lighthouse CI (her PR'da otomatik)
- Bundle Analyzer
- WebPageTest

---

## 15. Security Engineer

**Yapacakları:**
- OWASP Top 10 review
- Content Security Policy (CSP)
- CORS konfigürasyonu
- Rate limiting (API + form)
- Input sanitization audit
- SQL injection prevention (Prisma/parameterized queries)
- XSS prevention
- CSRF protection
- Dependency vulnerability scan (npm audit)
- Secrets management (.env audit, Vault)
- SSL/TLS konfigürasyonu
- Security headers (Helmet.js / Next.js headers)

**Output:** `docs/SECURITY_AUDIT.md`

---

## 16. Legal & Accessibility Reviewer

**Legal:**
- GDPR / KVKK uyumluluğu
- Cookie consent (kategorize edilmiş)
- Privacy Policy
- Terms of Service
- Data processing agreements

**Accessibility (WCAG 2.1 AA):**
- Keyboard navigation (Tab order, focus visible)
- Screen reader uyumluluğu (NVDA + VoiceOver test)
- ARIA labels tüm interactive elementlerde
- Skip to content link
- Alt text tüm imgelerde (decorative: `alt=""`)
- Form labels + error messages
- Color contrast audit (4.5:1 minimum)
- Zoom to 200% test

**Araç:** axe DevTools, Wave, Lighthouse Accessibility

---

## 17. DevOps Engineer

**Kuracakları:**
```
Git (conventional commits zorunlu)
GitHub (branch protection: main, develop)
CI/CD (GitHub Actions)
Docker (development environment)
Vercel (production + preview deployments)
Cloudflare (DNS + CDN + WAF)
SSL (auto-renew)
Sentry (error tracking)
Uptime monitoring (Better Uptime)
Automated backups (Supabase + Vercel)
```

**Branch stratejisi:**
```
main (production)
develop (staging)
feature/xxx
fix/xxx
hotfix/xxx
```

**CI/CD pipeline:**
- Lint + Type check
- Unit tests
- Build check
- Lighthouse CI
- Security scan
- Auto-deploy to preview
- Manual approve → production

---

## 18. QA Tester

**Test matrisi:**

| Platform | Tarayıcı |
|----------|----------|
| Desktop | Chrome, Firefox, Safari, Edge |
| Tablet | Safari iPad, Chrome Android |
| Mobile | Safari iPhone, Chrome Android, Samsung |

**Kontrol listesi:**
- [ ] Tüm formlar çalışıyor + hata mesajları doğru
- [ ] Tüm CTA'lar doğru yere yönlendiriyor
- [ ] Tüm linkler çalışıyor (404 yok)
- [ ] Animasyonlar tüm cihazlarda çalışıyor
- [ ] Dark mode tüm sayfalar
- [ ] Responsive 320px → 2560px
- [ ] Klavye navigasyonu
- [ ] Screen reader testi
- [ ] Performance skorları hedefte
- [ ] SEO meta tags tüm sayfalarda
- [ ] Schema markup geçerli (Google Rich Results Test)
- [ ] Security headers mevcut
- [ ] Cookie consent çalışıyor
- [ ] Analytics eventler doğru firing

---

## 19. Prompt Engineer

**Rol:** Projedeki tüm AI sistemlerini optimize eder.

**Yapacakları:**
- Sistem prompt'larını yazar ve optimize eder
- AI özellikler için fallback senaryolar
- Prompt versiyonlama
- AI output kalite değerlendirmesi
- Prompt injection koruması
- Token optimizasyonu (maliyet azaltma)
- A/B test: farklı prompt yaklaşımları

---

## Kod Standartları (Tüm Ajanlar)

```
SOLID Principles
DRY (Don't Repeat Yourself)
KISS (Keep It Simple, Stupid)
Clean Architecture
Clean Code (Robert C. Martin)
Atomic Design
Reusable Components
Semantic HTML
Accessibility First
SEO Friendly
GEO Ready
Production Ready
Enterprise Level
```

**Commit convention:**
```
feat: yeni özellik
fix: hata düzeltme
perf: performans iyileştirmesi
style: UI değişikliği (logic yok)
refactor: kod yeniden yapılandırma
test: test ekleme
docs: dokümantasyon
chore: build/config değişikliği
```

---

## Proje Başlangıç Protokolü

Her yeni proje başladığında şu sıra izlenir:

1. **PM** → proje soruları sor, `docs/PROJECT_PLAN.md` oluştur
2. **Market Research** → rakip analizi, `docs/MARKET_RESEARCH.md`
3. **Brand Strategist** → `docs/BRAND_STRATEGY.md`
4. **Copywriter** → `docs/COPY_BRIEF.md`
5. **UI/UX + Motion** → design system + wireframe
6. **Frontend + Backend** → paralel geliştirme
7. **AI Engineer** → AI özellikleri entegrasyonu
8. **SEO + GEO** → teknik SEO + schema + GEO optimizasyonu
9. **CRO** → dönüşüm optimizasyonu review
10. **Analytics** → event tracking kurulumu
11. **Performance** → optimizasyon + Lighthouse 100
12. **Security** → güvenlik audit
13. **Legal + Accessibility** → WCAG + GDPR review
14. **QA** → tam test matrisi
15. **DevOps** → CI/CD + production deployment
16. **PM** → final review + release

---

## Kalite Hedefi

> "Bu proje sıradan bir kurumsal web sitesi değildir. Amaç, dünya standartlarında bir dijital ajans vitrini oluşturmaktır. Tasarım kalitesi Apple, Stripe, Linear, Framer, Vercel, Notion, Webflow ve Awwwards ödüllü siteler seviyesinde olmalıdır. Her bölüm satış odaklı, yüksek dönüşüm sağlayan, SEO + GEO uyumlu, erişilebilir, performans odaklı ve geleceğe hazır olarak geliştirilmelidir."

---

*3Y Tasarım & Yazılım Hizmetleri — AI Software Studio v1.0*
