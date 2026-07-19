import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cPanel/Passenger gibi Node.js hosting'lerde `node server.js` ile doğrudan
  // çalıştırılabilen, gerekli node_modules'ı içine alan minimal bir build üretir.
  output: "standalone",
  // Paylaşımlı hosting'lerde (CloudLinux LVE) hesap başına süreç sayısı
  // sınırlıdır; Next.js'in build sırasında paralel worker süreçleri açması
  // "spawn ... EAGAIN" hatasıyla build'i çökertir. Tek süreçte, sıralı build.
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;
