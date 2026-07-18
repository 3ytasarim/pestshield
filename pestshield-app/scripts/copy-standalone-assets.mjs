// `next build` (output: "standalone") .next/standalone/server.js üretir ama
// statik varlıkları (public/, .next/static/) OTOMATİK KOPYALAMAZ — Next.js'in
// kendi dokümantasyonu bunu build sonrası elle yapılması gereken bir adım
// olarak tanımlıyor. Bu script o adımı platform bağımsız (Windows/Linux)
// şekilde otomatikleştirir; `npm run build` sonrası `postbuild` ile çalışır.

import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const standaloneDir = join(root, ".next", "standalone");

if (!existsSync(standaloneDir)) {
  console.log("`.next/standalone` bulunamadı — output:'standalone' ile build alındığından emin olun. Atlanıyor.");
  process.exit(0);
}

function copyIfExists(from, to) {
  if (!existsSync(from)) return;
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
  console.log(`Kopyalandı: ${from} -> ${to}`);
}

copyIfExists(join(root, "public"), join(standaloneDir, "public"));
copyIfExists(join(root, ".next", "static"), join(standaloneDir, ".next", "static"));

console.log("Standalone varlık kopyalama tamamlandı.");
