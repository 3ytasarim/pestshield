import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cPanel/Passenger gibi Node.js hosting'lerde `node server.js` ile doğrudan
  // çalıştırılabilen, gerekli node_modules'ı içine alan minimal bir build üretir.
  output: "standalone",
};

export default nextConfig;
