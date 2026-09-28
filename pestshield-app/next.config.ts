import type { NextConfig } from "next";

// Next.js'in Rust tabanlı derleyicisi (SWC/lightningcss), `rayon` paralel iş
// parçacığı havuzunu CPU çekirdek sayısı kadar (bu sunucuda 40) açmaya
// çalışıyor — paylaşımlı hosting'in süreç/kaynak kısıtı altında bu "Resource
// temporarily unavailable" panik hatasıyla build'i çökertiyor. Tek thread'e
// sabitliyoruz; zaten yukarıdaki experimental.cpus=1 ile build tek süreçte
// sıralı çalışıyor, ek paralellik gerekmiyor.
process.env.RAYON_NUM_THREADS = process.env.RAYON_NUM_THREADS || "1";
// Aynı kaynak kısıtı "Generating static pages" aşamasında da vuruyor — orada
// çöken thread havuzu rayon değil, doğrudan Node'un kendi libuv thread pool'u
// ("pthread_create: Resource temporarily unavailable"). Aynı şekilde 1'e
// sabitliyoruz; bu build tek CPU'da sıralı çalıştığı için ek thread'e zaten
// ihtiyaç yok.
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || "1";

const nextConfig: NextConfig = {
  // NOT: "standalone" kasıtlı olarak KULLANILMIYOR. LiteSpeed'in Node
  // adaptörü (lsnode.js) uygulama giriş dosyasını doğrudan çalıştırmak yerine
  // require() ediyor - Next.js'in ürettiği standalone server.js ise doğrudan
  // çalıştırılmak üzere tasarlandığı için require() edildiğinde bazı iç
  // başlatma adımları (lazy getter'lar) çift/hatalı tetiklenip "open EEXIST"
  // hatasına yol açıyordu. Bunun yerine kökteki server.js (klasik custom
  // server) + normal `next build` çıktısı kullanılıyor, bkz. server.js.
  // Paylaşımlı hosting'lerde (CloudLinux LVE) hesap başına süreç sayısı
  // sınırlıdır; Next.js'in build sırasında paralel worker süreçleri açması
  // "spawn ... EAGAIN" hatasıyla build'i çökertir. Tek süreçte, sıralı build.
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
  // `next build`, kaynak koddan bağımsız ayrı bir worker process'te ESLint +
  // TypeScript tip kontrolünü tekrar çalıştırıyor — bu paylaşımlı sunucuda
  // bellek baskısı altında bu worker "SIGABRT" ile çöküp build'i çökertiyor.
  // Bu kontroller zaten her push öncesi yerelde (`tsc --noEmit` + `eslint`)
  // ayrıca ve güvenilir şekilde çalıştırılıyor — build sırasında tekrarı
  // gereksiz, bu sunucuda ise doğrudan risk. Devre dışı bırakılıyor.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Next.js'in yerleşik next/image optimizasyonu, .next/cache/images altına
  // resimleri islerken ayri worker thread'ler kullanir (experimental.cpus/
  // workerThreads bunu KAPSAMAZ - o sadece build-time webpack worker'lari
  // icin). strace ile dogrulandi: iki farkli worker thread ayni onbellek
  // dosyasina neredeyse esanli erisince "open EEXIST" olusuyordu. Bu
  // paylasimli hosting'de guvenli olmadigi icin optimizasyonu tamamen
  // kapatiyoruz - resimler orijinal haliyle (optimize edilmeden) sunulur.
  images: {
    unoptimized: true,
  },
  // pdfjs-dist, Node.js ortamı için opsiyonel bir "canvas" bağımlılığına
  // (@napi-rs/canvas, native .node binary) sahip. Bu paket sadece tarayıcıda
  // (client component içinde dynamic import ile) kullanılıyor, hiçbir zaman
  // Node tarafında çalışmıyor — ama webpack build sırasında bu native modülü
  // yine de çözmeye/bundle etmeye çalışıyor ve Windows'ta EPERM/glob
  // hatasıyla build'i çökertiyor. Standart çözüm: webpack'e bu modülü hiç
  // çözmemesini söylemek.
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      "@napi-rs/canvas": false,
    };
    return config;
  },
};

export default nextConfig;
