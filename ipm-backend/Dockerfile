# syntax=docker/dockerfile:1

# ============================================================
# 1) deps: bağımlılıkları tek yerde kur, katman cache'inden
#    faydalanmak için sadece package*.json kopyalanır.
# ============================================================
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ============================================================
# 2) development: Cloud Code / Skaffold yerel debug hedefi.
#    Kaynak kod bind-mount + hot-reload (nest start --watch) ile
#    çalışır; Node inspector 0.0.0.0'a bind edilir ki container
#    dışından (skaffold portForward: 9229) debugger bağlanabilsin.
# ============================================================
FROM node:18-alpine AS development
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000 9229
CMD ["node", "--inspect=0.0.0.0:9229", "node_modules/.bin/nest", "start", "--watch"]

# ============================================================
# 3) build: production kodunu derler, sonra dev bağımlılıklarını
#    prune eder (production stage'e sadece gerekli olan geçer).
# ============================================================
FROM node:18-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build \
  && npm prune --omit=dev

# ============================================================
# 4) production: Cloud Run'a giden minimal, non-root imaj.
#    Sadece derlenmiş çıktı (dist) + prune edilmiş node_modules.
# ============================================================
FROM node:18-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

# tini: Node.js PID 1 olarak SIGTERM/SIGINT'i doğru yönetmez;
# Cloud Run graceful shutdown gönderdiğinde (revizyon güncelleme,
# scale-to-zero vb.) sinyalin doğru forward edilmesini garantiler.
RUN apk add --no-cache tini \
  && addgroup -S nodegrp && adduser -S nodeusr -G nodegrp

COPY --from=build --chown=nodeusr:nodegrp /app/package.json ./package.json
COPY --from=build --chown=nodeusr:nodegrp /app/node_modules ./node_modules
COPY --from=build --chown=nodeusr:nodegrp /app/dist ./dist

USER nodeusr

# Cloud Run PORT env var'ını enjekte eder (varsayılan 8080);
# main.ts zaten process.env.PORT'u okuyor, burada sadece dokümantasyon
# amaçlı 8080 expose ediyoruz.
EXPOSE 8080

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
