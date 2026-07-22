"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AlertTriangle, Pencil, Plus, Truck, User, Warehouse as WarehouseIcon, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatDate } from "@/components/crm/crm-format";
import { VehicleStatusBadge } from "@/components/operations/operations-badges";
import { VehicleForm } from "@/components/operations/vehicle-form";
import { isVehicleDueSoon, type Vehicle, type Technician } from "@/lib/mock/operations";
import type { VehicleFormValues } from "@/lib/validations/operations";
import { cn } from "@/lib/utils";

export function VehiclesPage({
  initialVehicles,
  initialTechnicians,
}: {
  initialVehicles: Vehicle[];
  initialTechnicians: Technician[];
}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [technicians] = useState<Technician[]>(initialTechnicians);
  const [formOpen, setFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const activeCount = useMemo(() => vehicles.filter((v) => v.status === "active").length, [vehicles]);
  const dueSoonCount = useMemo(() => vehicles.filter(isVehicleDueSoon).length, [vehicles]);

  async function handleCreate(values: VehicleFormValues) {
    const res = await fetch("/api/operations/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "Araç eklenemedi");
      return;
    }
    setVehicles((prev) => [data.vehicle, ...prev]);
    toast.success("Araç eklendi");
  }

  async function handleUpdate(values: VehicleFormValues) {
    if (!editingVehicle) return;
    const res = await fetch(`/api/operations/vehicles/${editingVehicle.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "Araç güncellenemedi");
      return;
    }
    setVehicles((prev) => prev.map((v) => (v.id === data.vehicle.id ? data.vehicle : v)));
    toast.success("Araç güncellendi");
  }

  function openEdit(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setFormOpen(true);
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open);
    if (!open) setEditingVehicle(null);
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
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Araçlar</h1>
          <p className="max-w-xl text-sm text-muted-foreground">Filo yönetimi: atama, muayene ve sigorta takibi.</p>
        </div>
        <Button
          onClick={() => {
            setEditingVehicle(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Yeni Araç Ekle
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Toplam Araç" value={vehicles.length} description="Kayıtlı filo aracı" changePercent={4} icon={Truck} accent="blue" delay={0.05} />
        <CrmKpiCard label="Aktif Araç" value={activeCount} description="Sahada kullanımda" changePercent={6} icon={Truck} accent="emerald" delay={0.1} />
        <CrmKpiCard label="Yaklaşan Muayene/Sigorta/Ruhsat" value={dueSoonCount} description="30 gün içinde son tarih" changePercent={dueSoonCount > 0 ? 15 : -15} icon={AlertTriangle} accent="amber" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((vehicle, index) => {
          const technician = technicians.find((t) => t.id === vehicle.assignedTechnicianId);
          const dueSoon = isVehicleDueSoon(vehicle);
          return (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(index, 9) * 0.04, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className={cn(GLASS_CARD, "h-full rounded-2xl")}>
                <CardContent className="flex flex-col gap-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Truck className="size-5" />
                      </div>
                      <div>
                        <p className="font-semibold leading-tight text-foreground">{vehicle.plate}</p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.brand} {vehicle.model}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <VehicleStatusBadge status={vehicle.status} />
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(vehicle)} title="Düzenle">
                        <Pencil className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <User className="size-3.5" />
                      {technician ? technician.name : "Atanmadı"}
                    </span>
                    {vehicle.warehouseName && (
                      <span className="flex items-center gap-1.5">
                        <WarehouseIcon className="size-3.5" />
                        {vehicle.warehouseName}
                      </span>
                    )}
                  </div>

                  <div className={cn("rounded-xl p-2.5 text-xs", dueSoon ? "bg-destructive/5 text-destructive" : "bg-muted/30 text-muted-foreground")}>
                    <p className="flex items-center gap-1.5 font-semibold uppercase">
                      <Wrench className="size-3" />
                      Muayene: {formatDate(vehicle.inspectionDue)}
                    </p>
                    <p className="mt-0.5">Sigorta: {formatDate(vehicle.insuranceDue)}</p>
                    <p className="mt-0.5">
                      Ruhsat No: {vehicle.registrationNumber} · Geçerlilik: {formatDate(vehicle.registrationExpiry)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <VehicleForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        onSubmit={editingVehicle ? handleUpdate : handleCreate}
        editing={editingVehicle}
      />
    </div>
  );
}
