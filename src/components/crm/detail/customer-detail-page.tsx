"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, FileSignature, FileSpreadsheet, FileUp, StickyNote, Wallet, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerSummaryCard } from "@/components/crm/detail/customer-summary-card";
import { CustomerTabs } from "@/components/crm/detail/customer-tabs";
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

  function goToTab(tab: string) {
    setActiveTab(tab);
    document.getElementById("customer-tabs-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex flex-col gap-6">
      <CustomerSummaryCard customer={customer} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        {QUICK_ACTIONS.map((action) => (
          <Button key={action.label} variant="outline" size="sm" onClick={() => goToTab(action.tab)}>
            <action.icon className="size-3.5" />
            {action.label}
          </Button>
        ))}
      </motion.div>

      <div id="customer-tabs-anchor">
        <CustomerTabs customer={customer} value={activeTab} onValueChange={setActiveTab} />
      </div>
    </div>
  );
}
