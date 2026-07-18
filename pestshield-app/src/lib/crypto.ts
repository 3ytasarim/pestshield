import "server-only";
import crypto from "node:crypto";

// Sunucu tarafında saklanan üçüncü parti sırlar (OAuth client secret, access/refresh
// token) için geri döndürülebilir şifreleme — bcrypt gibi tek yönlü hash DEĞİL,
// çünkü bu değerler daha sonra ilgili API'ye (örn. Paraşüt) tekrar gönderilmek üzere
// çözülebilmelidir. Anahtar `SECRETS_ENCRYPTION_KEY` ortam değişkeninden (32 byte,
// base64) okunur; ayarlanmamışsa şifreleme/çözme işlemi hata fırlatır — hiçbir
// sahte/düz-metin geri dönüş yapılmaz.

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.SECRETS_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("SECRETS_ENCRYPTION_KEY ayarlanmamış — sır şifreleme kullanılamaz.");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("SECRETS_ENCRYPTION_KEY 32 byte (base64) olmalıdır.");
  }
  return key;
}

/** Düz metni AES-256-GCM ile şifreler, `iv:authTag:ciphertext` formatında (base64 parçalar) tek string döner. */
export function encryptSecret(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(":");
}

/** encryptSecret ile üretilmiş bir string'i çözer. */
export function decryptSecret(encoded: string): string {
  const key = getKey();
  const [ivB64, authTagB64, ciphertextB64] = encoded.split(":");
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error("Geçersiz şifreli sır formatı.");
  }
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString("utf8");
}

/** SECRETS_ENCRYPTION_KEY ayarlanmış mı — route'larda erken, anlaşılır hata dönmek için. */
export function isSecretsEncryptionConfigured(): boolean {
  return !!process.env.SECRETS_ENCRYPTION_KEY;
}
