/** Web Audio API ile üretilen kısa iki tonlu "ding" — harici ses dosyası gerektirmez. */
export function playNotificationSound() {
  if (typeof window === "undefined") return;
  const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;

  try {
    const ctx = new AudioContextCtor();
    const now = ctx.currentTime;

    const playTone = (frequency: number, startOffset: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now + startOffset);
      gain.gain.setValueAtTime(0, now + startOffset);
      gain.gain.linearRampToValueAtTime(0.2, now + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now + startOffset);
      oscillator.stop(now + startOffset + duration + 0.05);
    };

    playTone(880, 0, 0.15);
    playTone(1174.66, 0.15, 0.2);

    setTimeout(() => ctx.close().catch(() => {}), 600);
  } catch {
    // sessizce geç — tarayıcı otomatik oynatma kısıtlaması gibi durumlarda bildirim sesi kritik değil
  }
}
