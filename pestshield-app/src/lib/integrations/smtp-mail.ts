// E-posta (SMTP) entegrasyonu — servis raporları, hatırlatma ve bildirim
// e-postalarının gönderileceği SMTP sunucu bilgileri.
//
// ÖNEMLİ: SMTP kimlik bilgileri (özellikle şifre) bu ortamda tarayıcının
// localStorage'ında saklanır — gerçek bir üretim ortamında bu bilgiler sunucu
// tarafında (ör. şifrelenmiş ortam değişkeni) tutulmalıdır. "Test Maili Gönder"
// butonu, girilen bilgilerle gerçek bir SMTP bağlantısı kurup test e-postası
// gönderen sunucu tarafı /api/integrations/test-mail uç noktasını çağırır.

const STORAGE_KEY = "pestshield.integrations.smtpMail";

export type SmtpEncryption = "none" | "ssl" | "tls";

export interface SmtpMailConnection {
  connected: boolean;
  host: string;
  port: string;
  username: string;
  password: string;
  encryption: SmtpEncryption;
  fromName: string;
  fromEmail: string;
  connectedAt: string | null;
}

const DEFAULT_CONNECTION: SmtpMailConnection = {
  connected: false,
  host: "",
  port: "587",
  username: "",
  password: "",
  encryption: "tls",
  fromName: "",
  fromEmail: "",
  connectedAt: null,
};

export function getSmtpMailConnection(): SmtpMailConnection {
  if (typeof window === "undefined") return DEFAULT_CONNECTION;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONNECTION;
    return { ...DEFAULT_CONNECTION, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONNECTION;
  }
}

export function saveSmtpMailConnection(conn: SmtpMailConnection) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conn));
}

export function disconnectSmtpMail() {
  saveSmtpMailConnection(DEFAULT_CONNECTION);
}
