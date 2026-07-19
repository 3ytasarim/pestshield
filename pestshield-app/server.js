// LiteSpeed/cPanel "Setup Node.js App" gibi hosting'lerin Node adaptörü, giriş
// dosyasını doğrudan `node server.js` ile çalıştırmak yerine kendi wrapper'ı
// (ör. lsnode.js) üzerinden require() eder. Next.js'in `output: "standalone"`
// ile ürettiği server.js bu kullanım şeklini desteklemiyor (bkz. next.config.ts
// notu). Bunun yerine klasik, require()-güvenli custom server kalıbı:
// https://nextjs.org/docs/pages/guides/custom-server
// LSAPI/Passenger tarzı adaptörler uygulamayı BEKLENMEDIK bir calisma
// dizininden (cwd) baslatabilir - bu, Next.js'in ".next/cache" gibi GORECELI
// yollara yazma girisimlerinin, elle "node server.js" ile calistirdigimizda
// hic gormedigimiz "open EEXIST" hatalarina yol acmasini acikliyor olabilir.
// cwd'yi bu dosyanin GERCEK konumuna sabitleyerek bu belirsizligi ortadan
// kaldiriyoruz (Passenger'in kendi dokumantasyonunda da onerilen yontem).
process.chdir(__dirname);
console.error(`[server.js] cwd sabitlendi: ${process.cwd()} (__dirname: ${__dirname})`);

const { createServer } = require("node:http");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port);
});
