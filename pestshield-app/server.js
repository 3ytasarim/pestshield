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

// Gecici tani amacli: "open EEXIST" hatasinin gercek "path" bilgisini
// Next.js'in kendi hata formatlayicisi loglara yazmiyor. fs.open/openSync'i
// sarmalayip EEXIST olustugunda hangi dosya yoluna erisilmeye calisildigini
// stderr'a yaziyoruz - orijinal davranis degismiyor, sadece gozlem ekleniyor.
const fs = require("node:fs");
const _open = fs.open, _openSync = fs.openSync;
fs.open = function (...args) {
  const cb = args[args.length - 1];
  if (typeof cb === "function") {
    args[args.length - 1] = (err, ...rest) => {
      if (err && err.code === "EEXIST") {
        console.error("[EEXIST-TANI]", { path: err.path, syscall: err.syscall, target: args[0] });
      }
      cb(err, ...rest);
    };
  }
  return _open.apply(fs, args);
};
fs.openSync = function (...args) {
  try { return _openSync.apply(fs, args); }
  catch (err) {
    if (err && err.code === "EEXIST") {
      console.error("[EEXIST-TANI-SYNC]", { path: err.path, syscall: err.syscall, target: args[0] });
    }
    throw err;
  }
};
// fs.open/openSync'te yakalanmadi - modern kod genelde fs.promises.open
// (async/await) kullanir, bu ayri bir uygulama, ayrica sarmalanmasi gerekiyor.
const _openP = fs.promises.open.bind(fs.promises);
fs.promises.open = async function (...args) {
  try { return await _openP(...args); }
  catch (err) {
    if (err && err.code === "EEXIST") {
      console.error("[EEXIST-TANI-PROMISE]", { path: err.path, syscall: err.syscall, target: args[0] });
    }
    throw err;
  }
};
// Son bir guvenlik agi: yukaridakilerin hicbiri yakalamazsa (ornegin dahili
// bir binding cagrisi), en azindan tam hata nesnesini gormek icin.
process.on("uncaughtException", (err) => {
  if (err && err.code === "EEXIST") {
    console.error("[EEXIST-TANI-UNCAUGHT]", {
      name: err.name, message: err.message, code: err.code, errno: err.errno,
      syscall: err.syscall, path: err.path, dest: err.dest, stack: err.stack,
    });
  }
});

const { createServer } = require("node:http");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port);
});
