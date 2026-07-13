"use client";

import {
  Building2,
  FileSignature,
  FileSpreadsheet,
  FileText,
  History,
  Image as ImageIcon,
  MapPin as MapIcon,
  MapPinned,
  ShieldCheck,
  Sparkles,
  StickyNote,
  LayoutGrid,
  Wallet,
  Wrench,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { OverviewTab } from "@/components/crm/detail/overview-tab";
import { BranchesTab } from "@/components/crm/detail/branches-tab";
import { ContactsTab } from "@/components/crm/detail/contacts-tab";
import { AddressesTab } from "@/components/crm/detail/addresses-tab";
import { LocationsTab } from "@/components/crm/detail/locations-tab";
import { StationsTab } from "@/components/crm/detail/stations-tab";
import { FilesTab } from "@/components/crm/detail/files-tab";
import { PhotosTab } from "@/components/crm/detail/photos-tab";
import { NotesTab } from "@/components/crm/detail/notes-tab";
import { ContractsTab } from "@/components/crm/detail/contracts-tab";
import { OffersTab } from "@/components/crm/detail/offers-tab";
import { WorkHistoryTab } from "@/components/crm/detail/work-history-tab";
import { HizmetlerTab } from "@/components/crm/detail/hizmetler-tab";
import { CurrentAccountTab } from "@/components/crm/detail/current-account-tab";
import { AuditTab } from "@/components/crm/detail/audit-tab";
import { AiCustomerInsights } from "@/components/crm/detail/ai-customer-insights";
import type { Customer } from "@/lib/mock/crm";

const TAB_ITEMS = [
  { value: "overview", label: "Genel", icon: LayoutGrid },
  { value: "branches", label: "Şubeler", icon: Building2 },
  { value: "locations", label: "Lokasyonlar", icon: MapIcon },
  { value: "stations", label: "İstasyonlar", icon: MapPinned },
  { value: "work-history", label: "Servisler", icon: History },
  { value: "hizmetler", label: "Hizmetler", icon: Wrench },
  { value: "offers", label: "Teklifler", icon: FileSpreadsheet },
  { value: "contracts", label: "Sözleşmeler", icon: FileSignature },
  { value: "photos", label: "Fotoğraflar", icon: ImageIcon },
  { value: "files", label: "Dosyalar", icon: FileText },
  { value: "notes", label: "Notlar", icon: StickyNote },
  { value: "account", label: "Cari Hesap", icon: Wallet },
  { value: "audit", label: "Audit", icon: ShieldCheck },
  { value: "ai-insights", label: "AI İçgörüleri", icon: Sparkles },
];

interface CustomerTabsProps {
  customer: Customer;
  value: string;
  onValueChange: (value: string) => void;
}

export function CustomerTabs({ customer, value, onValueChange }: CustomerTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onValueChange(String(v))}>
      <ScrollArea className="w-full whitespace-nowrap">
        <TabsList variant="line" className="w-max">
          {TAB_ITEMS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              <tab.icon className="size-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <TabsContent value="overview" className="mt-4 flex flex-col gap-6">
        <OverviewTab customer={customer} />
        <Separator />
        <ContactsTab customerId={customer.id} />
      </TabsContent>
      <TabsContent value="branches" className="mt-4">
        <BranchesTab customerId={customer.id} />
      </TabsContent>
      <TabsContent value="locations" className="mt-4 flex flex-col gap-6">
        <LocationsTab customerId={customer.id} />
        <Separator />
        <AddressesTab customerId={customer.id} />
      </TabsContent>
      <TabsContent value="stations" className="mt-4">
        <StationsTab customerId={customer.id} />
      </TabsContent>
      <TabsContent value="work-history" className="mt-4">
        <WorkHistoryTab customerId={customer.id} />
      </TabsContent>
      <TabsContent value="hizmetler" className="mt-4">
        <HizmetlerTab customerId={customer.id} />
      </TabsContent>
      <TabsContent value="offers" className="mt-4">
        <OffersTab customerId={customer.id} />
      </TabsContent>
      <TabsContent value="contracts" className="mt-4">
        <ContractsTab customerId={customer.id} />
      </TabsContent>
      <TabsContent value="photos" className="mt-4">
        <PhotosTab customerId={customer.id} />
      </TabsContent>
      <TabsContent value="files" className="mt-4">
        <FilesTab customerId={customer.id} />
      </TabsContent>
      <TabsContent value="notes" className="mt-4">
        <NotesTab customerId={customer.id} />
      </TabsContent>
      <TabsContent value="account" className="mt-4">
        <CurrentAccountTab customerId={customer.id} />
      </TabsContent>
      <TabsContent value="audit" className="mt-4">
        <AuditTab />
      </TabsContent>
      <TabsContent value="ai-insights" className="mt-4 max-w-2xl">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">AI İçgörüleri</h2>
          <AiCustomerInsights customerId={customer.id} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
