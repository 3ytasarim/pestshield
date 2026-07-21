const STORAGE_KEY = "pestshield:support:lastSeen";

/** Destek mesajları için istemci tarafında tutulan "son görülen zaman" — polling bildirimlerinde yeni/eski ayrımı için. */
export function getSupportLastSeen(): string {
  if (typeof window === "undefined") return new Date(0).toISOString();
  return localStorage.getItem(STORAGE_KEY) ?? new Date(0).toISOString();
}

export function setSupportLastSeen(iso: string = new Date().toISOString()) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, iso);
}
