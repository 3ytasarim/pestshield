import "server-only";
import crypto from "node:crypto";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSegment(length: number): string {
  let out = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

/** İnsan tarafından okunup elle girilebilecek biçimde lisans kodu üretir: PSF-XXXX-XXXX-XXXX */
export function generateLicenseCode(): string {
  return `PSF-${randomSegment(4)}-${randomSegment(4)}-${randomSegment(4)}`;
}
