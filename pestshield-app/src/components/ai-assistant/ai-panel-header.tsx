"use client";

import { ClipboardList, FileClock, History, Plus, Settings, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AiPanelHeader({
  userName,
  ready,
  onToggleHistory,
  onToggleReports,
  onToggleActions,
  onToggleSettings,
  onNewConversation,
  onClose,
}: {
  userName: string;
  ready: boolean;
  onToggleHistory: () => void;
  onToggleReports: () => void;
  onToggleActions: () => void;
  onToggleSettings: () => void;
  onNewConversation: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-gradient-to-br from-primary/10 to-transparent px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="size-4" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">PestShield AI</p>
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className={`size-1.5 rounded-full ${ready ? "bg-success" : "bg-muted-foreground/40"}`} aria-hidden="true" />
            {ready ? "Hazır" : "Yapılandırılmadı"} · {userName}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon-sm" title="Konuşma Geçmişi" aria-label="Konuşma geçmişini göster" onClick={onToggleHistory}>
          <History className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" title="Rapor Geçmişi" aria-label="Rapor geçmişini göster" onClick={onToggleReports}>
          <FileClock className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" title="Aksiyon Geçmişi" aria-label="Aksiyon geçmişini göster" onClick={onToggleActions}>
          <ClipboardList className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" title="Bildirim Ayarları" aria-label="Bildirim ayarlarını göster" onClick={onToggleSettings}>
          <Settings className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" title="Yeni Sohbet" aria-label="Yeni sohbet başlat" onClick={onNewConversation}>
          <Plus className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" title="Kapat" aria-label="AI panelini kapat" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
