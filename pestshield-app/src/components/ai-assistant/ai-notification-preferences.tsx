"use client";

import { Switch } from "@/components/ui/switch";
import type { AlertSeverityLevel, NotificationPreferences } from "@/lib/ai/notifications/preferences-store";

const SEVERITY_OPTIONS: { value: AlertSeverityLevel; label: string }[] = [
  { value: "info", label: "Bilgi ve üzeri (tümü)" },
  { value: "warning", label: "Uyarı ve üzeri" },
  { value: "high", label: "Yüksek ve üzeri" },
  { value: "critical", label: "Sadece kritik" },
];

export function AiNotificationPreferences({ preferences, onChange }: { preferences: NotificationPreferences; onChange: (patch: Partial<NotificationPreferences>) => void }) {
  return (
    <div className="flex flex-col gap-4 p-3 text-xs">
      <section className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase">Bildirim Kanalları</p>
        <PreferenceRow label="Uygulama içi" checked={preferences.inAppEnabled} onCheckedChange={(v) => onChange({ inAppEnabled: v })} />
        <PreferenceRow label="E-posta" checked={preferences.emailEnabled} onCheckedChange={(v) => onChange({ emailEnabled: v })} />
        <PreferenceRow label="WhatsApp" checked={preferences.whatsappEnabled} onCheckedChange={(v) => onChange({ whatsappEnabled: v })} note="Yalnızca WhatsApp entegrasyonu yapılandırılmışsa iletilir." />
        <PreferenceRow label="Push bildirim" checked={preferences.pushEnabled} onCheckedChange={(v) => onChange({ pushEnabled: v })} note="Bu ortamda push altyapısı henüz kurulmadı — bu tercih ileride kullanılacak." disabled />
        <PreferenceRow label="Sesli yanıt oynatma" checked={preferences.voicePlaybackEnabled} onCheckedChange={(v) => onChange({ voicePlaybackEnabled: v })} />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase">Günlük Brifing</p>
        <PreferenceRow label="Günlük operasyon özeti" checked={preferences.dailyBriefingEnabled} onCheckedChange={(v) => onChange({ dailyBriefingEnabled: v })} />
        {preferences.dailyBriefingEnabled && (
          <>
            <label className="flex items-center justify-between gap-2">
              <span>Saat</span>
              <input
                type="time"
                value={preferences.dailyBriefingTime}
                onChange={(e) => onChange({ dailyBriefingTime: e.target.value })}
                className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
              />
            </label>
            <PreferenceRow label="Yalnızca hafta içi" checked={preferences.dailyBriefingWeekdaysOnly} onCheckedChange={(v) => onChange({ dailyBriefingWeekdaysOnly: v })} />
          </>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase">Sessiz Saatler</p>
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={preferences.quietHoursStart ?? ""}
            onChange={(e) => onChange({ quietHoursStart: e.target.value || null })}
            className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs"
          />
          <span className="text-muted-foreground">–</span>
          <input
            type="time"
            value={preferences.quietHoursEnd ?? ""}
            onChange={(e) => onChange({ quietHoursEnd: e.target.value || null })}
            className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs"
          />
        </div>
        <p className="text-[10px] text-muted-foreground">Bu aralıkta e-posta/WhatsApp bildirimleri gönderilmez (kritik eskalasyon kuralları hariç).</p>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase">Minimum Önem Derecesi</p>
        <select
          value={preferences.minimumSeverity}
          onChange={(e) => onChange({ minimumSeverity: e.target.value as AlertSeverityLevel })}
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
        >
          {SEVERITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </section>
    </div>
  );
}

function PreferenceRow({
  label,
  checked,
  onCheckedChange,
  note,
  disabled,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  note?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="flex items-center justify-between gap-2">
        <span className={disabled ? "text-muted-foreground" : ""}>{label}</span>
        <Switch checked={checked} onCheckedChange={onCheckedChange} size="sm" disabled={disabled} />
      </label>
      {note && <p className="text-[10px] text-muted-foreground">{note}</p>}
    </div>
  );
}
