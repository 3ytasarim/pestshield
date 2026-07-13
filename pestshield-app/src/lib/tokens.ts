import { randomBytes } from "crypto";

/** URL-safe, tahmin edilemez token (e-posta doğrulama, şifre sıfırlama için). */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}
