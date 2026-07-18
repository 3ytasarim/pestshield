import { describe, expect, it } from "vitest";
import { isValidVoiceConfirmation } from "@/lib/voice/voice-confirmation";
import { labelForConfidence, confidenceLabelText } from "@/lib/voice/types";

describe("Faz 4 — sesli onay ifadesi eşleştirici", () => {
  it("spesifikasyonda geçerli sayılan ifadeleri kabul eder", () => {
    expect(isValidVoiceConfirmation("Evet, bu servisi oluştur")).toBe(true);
    expect(isValidVoiceConfirmation("Bu atamayı onaylıyorum")).toBe(true);
    expect(isValidVoiceConfirmation("Mesajı bu alıcıya gönder")).toBe(true);
    expect(isValidVoiceConfirmation("Değişikliği uygula")).toBe(true);
  });

  it("spesifikasyonda AÇIKÇA geçersiz sayılan kısa ifadeleri reddeder", () => {
    expect(isValidVoiceConfirmation("tamam")).toBe(false);
    expect(isValidVoiceConfirmation("olur")).toBe(false);
    expect(isValidVoiceConfirmation("güzel")).toBe(false);
    expect(isValidVoiceConfirmation("devam et")).toBe(false);
    expect(isValidVoiceConfirmation("peki")).toBe(false);
  });

  it("boş veya alakasız metni reddeder", () => {
    expect(isValidVoiceConfirmation("")).toBe(false);
    expect(isValidVoiceConfirmation("yarın kaç servis var")).toBe(false);
  });

  it("büyük/küçük harf ve baştaki/sondaki boşluklardan etkilenmez", () => {
    expect(isValidVoiceConfirmation("  EVET, BU SERVİSİ OLUŞTUR  ")).toBe(true);
  });
});

describe("Faz 4 — güven etiketi eşleme (uydurma yüzde YOK)", () => {
  it("sağlayıcı skor sunmuyorsa (tarayıcı API) her zaman 'kontrol_gerekli' döner", () => {
    expect(labelForConfidence(null)).toBe("kontrol_gerekli");
  });

  it("yüksek skor 'net', düşük skor 'belirsiz' etiketine karşılık gelir", () => {
    expect(labelForConfidence(0.95)).toBe("net");
    expect(labelForConfidence(0.3)).toBe("belirsiz");
  });

  it("her etiket için Türkçe metin tanımlıdır", () => {
    expect(confidenceLabelText("net")).toBe("Net algılandı");
    expect(confidenceLabelText("tekrar_soyleyin")).toBe("Tekrar söyleyin");
  });
});
