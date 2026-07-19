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
};

export default nextConfig;
