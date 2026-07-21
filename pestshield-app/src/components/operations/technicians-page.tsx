"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AlertTriangle, HardHat, Mail, Pencil, Phone, Plus, ShieldCheck, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatDate } from "@/components/crm/crm-format";
import { TechnicianStatusBadge } from "@/components/operations/operations-badges";
import { TechnicianForm } from "@/components/operations/technician-form";
import { isLicenseExpiringSoon, type Technician, type Vehicle } from "@/lib/mock/operations";
import type { WorkOrder } from "@/lib/mock/crm";
import type { TechnicianFormValues } from "@/lib/validations/operations";
import { cn } from "@/lib/utils";

export function TechniciansPage({
  initialTechnicians,
  initialVehicles,
  initialOpenWorkOrders,
}: {
  initialTechnicians: Technician[];
  initialVehicles: Vehicle[];
  initialOpenWorkOrders: WorkOrder[];
}) {
  const [technicians, setTechnicians] = useState<Technician[]>(initialTechnicians);
  const [vehicles] = useState<Vehicle[]>(initialVehicles);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);

  const activeCount = useMemo(() => technicians.filter((t) => t.status === "active").length, [technicians]);
  const expiringCount = useMemo(() => technicians.filter(isLicenseExpiringSoon).length, [technicians]);
  const openWorkOrders = initialOpenWorkOrders;

  function activeOrderCount(name: string) {
    return openWorkOrders.filter((w) => w.technician === name).length;
  }

  async function handleCreate(values: TechnicianFormValues) {
    const res = await fetch("/api/operations/technicians", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "Teknisyen hesabı oluşturulamadı");
      return;
    }

    setTechnicians((prev) => [data.technician, ...prev]);
    toast.success("Teknisyen eklendi — mobil panele giriş yapabilir");
  }

  async function handleUpdate(values: TechnicianFormValues) {
    if (!editingTechnician) return;
    const res = await fetch(`/api/operations/technicians/${editingTechnician.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "Teknisyen güncellenemedi");
      return;
    }

    setTechnicians((prev) => prev.map((t) => (t.id === data.technician.id ? data.technician : t)));
    toast.success("Teknisyen güncellendi");
  }

  function openEdit(technician: Technician) {
    setEditingTechnician(technician);
    setFormOpen(true);
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open);
    if (!open) setEditingTechnician(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Teknisyenler</h1>
          <p className="max-w-xl text-sm text-muted-foreground">Saha ekibi, ehliyet durumu ve iş yükü takibi.</p>
        </div>
        <Button
          onClick={() => {
            setEditingTechnician(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Yeni Teknisyen Ekle
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Aktif Teknisyen" value={activeCount} description={`${technicians.length} kayıtlı personel`} changePercent={4} icon={HardHat} accent="blue" delay={0.05} />
        <CrmKpiCard label="Ehliyet Yenileme" value={expiringCount} description="60 gün içinde dolan ehliyetler" changePercent={expiringCount > 0 ? 16 : -16} icon={AlertTriangle} accent="amber" delay={0.1} />
        <CrmKpiCard label="Açık İş Emri" value={openWorkOrders.length} description="Planlanmış veya devam eden" changePercent={6} icon={ShieldCheck} accent="emerald" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {technicians.map((tech, index) => {
          const vehicle = vehicles.find((v) => v.id === tech.vehicleId);
          const expiring = isLicenseExpiringSoon(tech);
          return (
            <motion.div
              key={tech.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(index, 9) * 0.04, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className={cn(GLASS_CARD, "h-full rounded-2xl")}>
                <CardContent className="flex flex-col gap-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {tech.name
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <p className="font-semibold leading-tight text-foreground">{tech.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TechnicianStatusBadge status={tech.status} />
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(tech)} title="Düzenle">
                        <Pencil className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3.5" />
                      {tech.phone}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="size-3.5" />
                      {tech.email}
                    </span>
                    {vehicle && (
                      <span className="flex items-center gap-1.5">
                        <Truck className="size-3.5" />
                        {vehicle.plate} — {vehicle.brand} {vehicle.model}
                      </span>
                    )}
                  </div>

                  <div className={cn("rounded-xl p-2.5 text-xs", expiring ? "bg-destructive/5 text-destructive" : "bg-muted/30 text-muted-foreground")}>
                    <p className="font-semibold uppercase">Ehliyet No: {tech.licenseNumber}</p>
                    <p className="mt-0.5">
                      Geçerlilik: {formatDate(tech.licenseExpiry)}
                      {expiring && " — yakında yenilenmeli"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs font-medium text-muted-foreground">
                    <span>Açık İş Emri</span>
                    <span className="text-sm font-semibold text-foreground">{activeOrderCount(tech.name)}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <TechnicianForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        onSubmit={editingTechnician ? handleUpdate : handleCreate}
        editing={editingTechnician}
      />
    </div>
  );
}
