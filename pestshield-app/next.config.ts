import type { NextConfig } from "next";

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
};

export default nextConfig;
