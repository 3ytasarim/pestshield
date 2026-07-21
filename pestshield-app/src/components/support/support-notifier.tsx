"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { playNotificationSound } from "@/lib/sound/notification-sound";
import { getSupportLastSeen } from "@/lib/support/last-seen";

const POLL_INTERVAL_MS = 25_000;

/**
 * Görünmez, her zaman mount edilen polling bileşeni. Panel açık ama kullanıcı
 * o an bakmıyor olsa bile yeni destek mesajını gözden kaçırmasın diye
 * bildirim + ses tetikler. Mevcut Bildirim Merkezi'nden tamamen izole.
 */
export function SupportNotifier({ href }: { href: string }) {
  const router = useRouter();
  const lastCountRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const since = getSupportLastSeen();
        const res = await fetch(`/api/support/unread-count?since=${encodeURIComponent(since)}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const count: number = data.count ?? 0;

        if (lastCountRef.current !== null && count > lastCountRef.current) {
          playNotificationSound();
          toast.info("Yeni destek mesajı", {
            description: "Okumak için tıklayın",
            action: { label: "Aç", onClick: () => router.push(href) },
          });
        }
        lastCountRef.current = count;
      } catch {
        // sessizce geç — bir sonraki taramada tekrar denenir
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [href, router]);

  return null;
}
