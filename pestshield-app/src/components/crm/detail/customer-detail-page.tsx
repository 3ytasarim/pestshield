"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ClipboardList, FileSignature, FileSpreadsheet, FileUp, Pencil, StickyNote, Wallet, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerSummaryCard } from "@/components/crm/detail/customer-summary-card";
import { CustomerTabs } from "@/components/crm/detail/customer-tabs";
import { CustomerForm } from "@/components/crm/customer-form";
import type { CustomerFormValues } from "@/lib/validations/crm";
import type { Customer } from "@/lib/mock/crm";

interface CustomerDetailPageProps {
  customer: Customer;
  initialTab: string;
}

const VALID_TABS = [
  "overview",
  "branches",
  "locations",
  "stations",
  "work-history",
  "hizmetler",
  "offers",
  "contracts",
  "photos",
  "files",
  "notes",
  "account",
  "audit",
  "ai-insights",
];

const QUICK_ACTIONS = [
  { label: "İş Emri Oluştur", tab: "work-history", icon: ClipboardList },
  { label: "Hizmet Ekle", tab: "hizmetler", icon: Wrench },
  { label: "Teklif Oluştur", tab: "offers", icon: FileSpreadsheet },
  { label: "Sözleşme Ekle", tab: "contracts", icon: FileSignature },
  { label: "Not Ekle", tab: "notes", icon: StickyNote },
  { label: "Dosya Yükle", tab: "files", icon: FileUp },
  { label: "Cari Hesap", tab: "account", icon: Wallet },
];

export function CustomerDetailPage({ customer, initialTab }: CustomerDetailPageProps) {
  const [activeTab, setActiveTab] = useState(VALID_TABS.includes(initialTab) ? initialTab : "overview");
  const [customerData, setCustomerData] = useState(customer);
  const [editOpen, setEditOpen] = useState(false);

  function goToTab(tab: string) {
    setActiveTab(tab);
    document.getElementById("customer-tabs-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleEditSubmit(values: CustomerFormValues) {
    const res = await fetch(`/api/crm/customers/${customerData.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "Müşteri güncellenemedi");
      return;
    }
    setCustomerData(data.customer);
    toast.success("Müşteri güncellendi");
  }

  return (
    <div className="flex flex-col gap-6">
      <CustomerSummaryCard customer={customerData} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="size-3.5" />
          Müşteriyi Düzenle
        </Button>
        {QUICK_ACTIONS.map((action) => (
          <Button key={action.label} variant="outline" size="sm" onClick={() => goToTab(action.tab)}>
            <action.icon className="size-3.5" />
            {action.label}
          </Button>
        ))}
      </motion.div>

      <div id="customer-tabs-anchor">
        <CustomerTabs customer={customerData} value={activeTab} onValueChange={setActiveTab} />
      </div>

      <CustomerForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEditSubmit}
        defaultValues={customerData}
        customer={customerData}
      />
    </div>
  );
}
