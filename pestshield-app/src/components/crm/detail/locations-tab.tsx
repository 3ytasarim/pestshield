"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MapIcon, MoreHorizontal, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RiskBadge } from "@/components/crm/crm-badges";
import { formatDate } from "@/components/crm/crm-format";
import { LocationForm } from "@/components/crm/detail/location-form";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { LOCATION_TYPE_LABELS } from "@/components/crm/crm-labels";
import { getBranches, getLocations, type Location } from "@/lib/mock/crm";
import type { LocationFormValues } from "@/lib/validations/crm";

function comingSoon(feature: string) {
  toast.info(`${feature} Operasyon modülü bağlandığında kullanıma açılacak.`);
}

export function LocationsTab({ customerId }: { customerId: string }) {
  const [locations, setLocations] = useState<Location[]>(() => getLocations(customerId));
  const branchOptions = getBranches(customerId).map((b) => b.name);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [deleting, setDeleting] = useState<Location | null>(null);

  function handleSubmit(values: LocationFormValues) {
    if (editing) {
      setLocations((prev) => prev.map((l) => (l.id === editing.id ? { ...l, ...values } : l)));
      setEditing(null);
      return;
    }
    setLocations((prev) => [
      {
        ...values,
        id: `${customerId}-location-${Date.now()}`,
        customerId,
        stationCount: 0,
        lastCheckDate: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Lokasyonlar</h2>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Yeni Lokasyon Ekle
        </Button>
      </div>

      {locations.length === 0 ? (
        <EmptyState icon={MapIcon} title="Henüz lokasyon eklenmemiş" description="Pest operasyonu için lokasyon ekleyin." />
      ) : (
        <div className="rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lokasyon Adı</TableHead>
                <TableHead className="hidden sm:table-cell">Lokasyon Tipi</TableHead>
                <TableHead className="hidden lg:table-cell">Bağlı Şube</TableHead>
                <TableHead>Risk Seviyesi</TableHead>
                <TableHead className="hidden md:table-cell">İstasyon Sayısı</TableHead>
                <TableHead className="hidden lg:table-cell">Son Kontrol Tarihi</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{LOCATION_TYPE_LABELS[location.type]}</TableCell>
                  <TableCell className="hidden lg:table-cell">{location.branchName}</TableCell>
                  <TableCell>
                    <RiskBadge level={location.riskLevel} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{location.stationCount}</TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDate(location.lastCheckDate)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => comingSoon("İstasyonlar")}>İstasyonları Gör</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => comingSoon("Kroki görüntüleme")}>Kroki Görüntüle</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => comingSoon("Risk değerlendirme")}>Risk Değerlendirme</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(location);
                            setFormOpen(true);
                          }}
                        >
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(location)}>
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <LocationForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={handleSubmit}
        branchOptions={branchOptions}
        defaultValues={editing ?? undefined}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lokasyonu sil</AlertDialogTitle>
            <AlertDialogDescription>&ldquo;{deleting?.name}&rdquo; kalıcı olarak silinecek.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                setLocations((prev) => prev.filter((l) => l.id !== deleting?.id));
                setDeleting(null);
              }}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
