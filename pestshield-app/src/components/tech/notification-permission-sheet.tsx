"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "pestshield.tech.notification-prompt-dismissed";

export function NotificationPermissionSheet() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(STORAGE_KEY) === "1";
    const alreadyDecided = typeof Notification !== "undefined" && Notification.permission !== "default";
    if (!dismissed && !alreadyDecided) setVisible(true);
  }, []);

  function dismiss() {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  async function enable() {
    if (typeof Notification === "undefined") {
      toast.error("Bu tarayıcı bildirimleri desteklemiyor");
      dismiss();
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast.success("Bildirimler açıldı");
    } else {
      toast.info("Bildirim izni verilmedi");
    }
    dismiss();
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-20 mx-auto max-w-md px-4">
      <Card className={cn(GLASS_CARD, "rounded-2xl shadow-lg")}>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bell className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">Bildirimleri Aç</p>
              <p className="text-xs text-muted-foreground">Size yeni iş atandığında anında haberdar olun.</p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Kapat"
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="flex-1" onClick={dismiss}>
              Şimdi Değil
            </Button>
            <Button className="flex-1" onClick={enable}>
              Bildirimleri Aç
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
