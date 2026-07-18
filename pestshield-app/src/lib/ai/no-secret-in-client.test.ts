import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// AI_API_KEY sadece sunucu-only dosyalarda (route.ts, providers/get-model-provider.ts,
// providers/anthropic-model-provider.ts — hepsi "server-only" import eder) okunmalı.
// Bu test, "use client" işaretli veya components/ altındaki hiçbir dosyanın
// AI_API_KEY'e doğrudan referans vermediğini statik olarak doğrular.

const SRC_DIR = join(__dirname, "..", "..");
const ALLOWED_FILES = ["get-model-provider.ts", "anthropic-model-provider.ts", "route.ts"];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts")) {
      out.push(full);
    }
  }
  return out;
}

describe("AI_API_KEY frontend bundle sızıntı kontrolü", () => {
  it("sadece server-only dosyalar AI_API_KEY'e referans verir", () => {
    const files = walk(join(SRC_DIR, "components"))
      .concat(walk(join(SRC_DIR, "app")))
      .filter((f) => !ALLOWED_FILES.includes(f.split(/[\\/]/).pop()!));

    const offenders = files.filter((f) => readFileSync(f, "utf-8").includes("AI_API_KEY"));
    expect(offenders).toEqual([]);
  });

  it("client component'ler (\"use client\") hiçbir yerde process.env.AI_API_KEY okumaz", () => {
    const files = walk(join(SRC_DIR, "components"));
    const offenders = files.filter((f) => {
      const content = readFileSync(f, "utf-8");
      return content.includes('"use client"') && content.includes("process.env.AI_API_KEY");
    });
    expect(offenders).toEqual([]);
  });
});

// Faz 4 — ses (VOICE_STT_API_KEY/VOICE_TTS_API_KEY) ve WhatsApp
// (WHATSAPP_ACCESS_TOKEN/WHATSAPP_APP_SECRET) sırları da AYNI kuralla test edilir.
describe("Faz 4 sırları frontend bundle sızıntı kontrolü", () => {
  const PHASE4_SECRET_ENV_VARS = ["VOICE_STT_API_KEY", "VOICE_TTS_API_KEY", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_APP_SECRET", "WHATSAPP_WEBHOOK_VERIFY_TOKEN"];

  it("\"use client\" işaretli hiçbir dosya Faz 4 sır ortam değişkenlerini okumaz", () => {
    const files = walk(join(SRC_DIR, "components")).concat(walk(join(SRC_DIR, "lib", "voice"))).concat(walk(join(SRC_DIR, "lib", "whatsapp")));
    const offenders = files.filter((f) => {
      const content = readFileSync(f, "utf-8");
      if (!content.includes('"use client"')) return false;
      return PHASE4_SECRET_ENV_VARS.some((key) => content.includes(`process.env.${key}`));
    });
    expect(offenders).toEqual([]);
  });

  it("Faz 4 sırlarını okuyan her dosya server-only olarak işaretlenmiştir (route.ts veya \"server-only\" import)", () => {
    const files = walk(join(SRC_DIR, "lib", "voice")).concat(walk(join(SRC_DIR, "lib", "whatsapp"))).concat(walk(join(SRC_DIR, "app", "api")));
    const offenders = files.filter((f) => {
      const content = readFileSync(f, "utf-8");
      const readsSecret = PHASE4_SECRET_ENV_VARS.some((key) => content.includes(`process.env.${key}`));
      if (!readsSecret) return false;
      const isServerMarked = content.includes('import "server-only"') || f.endsWith("route.ts");
      return !isServerMarked;
    });
    expect(offenders).toEqual([]);
  });
});
