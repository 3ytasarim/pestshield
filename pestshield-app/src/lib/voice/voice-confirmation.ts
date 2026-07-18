// PestShield AI Command Center — Faz 4 sesli onay eşleştirici.
//
// GÜVENLİK: Bu liste KASITLI OLARAK dar tutulur. Sesli "onay" asla LLM'e
// yorumlatılmaz (LLM'in "kullanıcı onayladı" demesi hiçbir şey ifade etmez —
// bkz. system-prompt.ts kural 7a) — sadece burada, sabit, önceden tanımlı
// bir eşleşme kontrolü yapılır ve SADECE ekranda GÖRÜNÜR, hâlâ
// pending_confirmation durumundaki bir öneri varsa uygulanır (bkz.
// ai-command-center.tsx). Belirsiz/kısa ifadeler ("tamam", "olur", "peki")
// KASITLI OLARAK reddedilir — bunlar spesifikasyonda açıkça geçersiz
// sayılmıştır.

const VALID_PATTERNS = [
  /^evet,?\s*bu (servisi|atamay[ıi]|de[gğ]i[sş]ikli[gğ]i)\s*(olu[sş]tur|onayl[ıi]yorum|uygula)/i,
  /^bu (atamay[ıi]|servisi|görevi|de[gğ]i[sş]ikli[gğ]i)\s*onayl[ıi]yorum/i,
  /^mesaj[ıi]\s*(bu al[ıi]c[ıi]ya\s*)?g[oö]nder/i,
  /^de[gğ]i[sş]ikli[gğ]i\s*uygula/i,
  /^onayl[ıi]yorum$/i,
  /^onayla ve (olu[sş]tur|güncelle|ata|gönder)/i,
];

const INVALID_EXACT = new Set(["tamam", "olur", "güzel", "devam et", "peki", "olabilir", "bakarız", "sonra", "devam"]);

export function isValidVoiceConfirmation(rawTranscript: string): boolean {
  const text = rawTranscript.trim().toLocaleLowerCase("tr");
  if (!text) return false;
  if (INVALID_EXACT.has(text)) return false;
  return VALID_PATTERNS.some((pattern) => pattern.test(text));
}
