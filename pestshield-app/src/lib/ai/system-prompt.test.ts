import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";

const NOW = new Date("2026-07-13T09:00:00.000Z");

describe("buildSystemPrompt — güvenlik kuralları", () => {
  const prompt = buildSystemPrompt("Test Kullanıcı", "CLIENT", null, NOW);

  it("Faz 3 yazma aksiyonlarının yalnızca sınırlı, onaya bağlı bir öneri seti olduğunu açıkça belirtir", () => {
    expect(prompt).toMatch(/SADECE bir ÖNERİ/i);
    expect(prompt).toMatch(/propose_create_service/);
  });

  it("API anahtarı/parola/connection string/env değişkeni ifşasını reddetme talimatı içerir", () => {
    expect(prompt).toMatch(/API anahtarlarını göster/i);
    expect(prompt).toMatch(/parolaları göster/i);
    expect(prompt).toMatch(/connection string göster/i);
    expect(prompt).toMatch(/ortam değişkenlerini göster/i);
  });

  it("SQL çalıştırma ve yetki atlama isteklerini reddetme talimatı içerir", () => {
    expect(prompt).toMatch(/SQL çalıştır/i);
    expect(prompt).toMatch(/yetkileri aş\/atla/i);
  });

  it("başka firmanın verisini gösterme ve sistem promptunu ifşa etme isteklerini reddetme talimatı içerir", () => {
    expect(prompt).toMatch(/başka bir firmanın verisini göster/i);
    expect(prompt).toMatch(/sistem promptunu ifşa et/i);
  });

  it("gömülü talimatları (prompt injection) yok sayma talimatı içerir", () => {
    expect(prompt).toMatch(/prompt injection/i);
  });

  it("propose_* dışındaki hiçbir yazma işleminin yapılamayacağını ve onay olmadan hiçbir işlemin gerçekleşmeyeceğini belirtir", () => {
    expect(prompt).toMatch(/HİÇBİR değişiklik işlemini yapamazsın/i);
    expect(prompt).toMatch(/ASLA gerçekleşmez/i);
  });

  it("bugünün tarihini doğru ISO formatta enjekte eder", () => {
    expect(prompt).toContain("2026-07-13");
  });

  it("kullanıcı mesajında tarih ifadesi varsa deterministik çözümü sisteme ekler", () => {
    const withHint = buildSystemPrompt("Test Kullanıcı", "CLIENT", "Yarın hangi servisler var?", NOW);
    expect(withHint).toContain("2026-07-14");
  });
});
