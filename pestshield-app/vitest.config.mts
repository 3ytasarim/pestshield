import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // "server-only" webpack'in gerçek client/server ayrımını bilmeden throw eder;
      // Vitest Node ortamında çalıştığı için bu, gerçek bir sızıntı riski değildir —
      // no-secret-in-client.test.ts zaten bu ayrımı statik olarak ayrıca doğruluyor.
      "server-only": path.resolve(__dirname, "./src/lib/ai/test-support/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
