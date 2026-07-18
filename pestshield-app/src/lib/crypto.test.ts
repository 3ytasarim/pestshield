import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { decryptSecret, encryptSecret, isSecretsEncryptionConfigured } from "@/lib/crypto";

const TEST_KEY = "nXPr7UaUz1fdO5s/KjJDea1B640DEi4rH2KAUvJcdtY=";

describe("crypto secret encryption", () => {
  const originalKey = process.env.SECRETS_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.SECRETS_ENCRYPTION_KEY = TEST_KEY;
  });

  afterEach(() => {
    process.env.SECRETS_ENCRYPTION_KEY = originalKey;
  });

  it("round-trips a plain string through encrypt/decrypt", () => {
    const plain = "sk-super-secret-parasut-token";
    const encrypted = encryptSecret(plain);
    expect(encrypted).not.toContain(plain);
    expect(decryptSecret(encrypted)).toBe(plain);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    const a = encryptSecret("same-value");
    const b = encryptSecret("same-value");
    expect(a).not.toBe(b);
  });

  it("reports configured when key is set", () => {
    expect(isSecretsEncryptionConfigured()).toBe(true);
  });

  it("reports not configured when key is missing", () => {
    delete process.env.SECRETS_ENCRYPTION_KEY;
    expect(isSecretsEncryptionConfigured()).toBe(false);
  });

  it("throws when encrypting without a configured key", () => {
    delete process.env.SECRETS_ENCRYPTION_KEY;
    expect(() => encryptSecret("x")).toThrow();
  });

  it("throws when decrypting a tampered ciphertext", () => {
    const encrypted = encryptSecret("original");
    const parts = encrypted.split(":");
    parts[2] = Buffer.from("tampered-data").toString("base64");
    expect(() => decryptSecret(parts.join(":"))).toThrow();
  });
});
