"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Clock3,
  FileClock,
  Plus,
  UserCheck,
  UserX,
  Users,
  Wallet,
} from "lucide-react";
import { RainbowButton } from "@/components/ui/rainbow-button";
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
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { toast } from "sonner";
import { CustomerFilters } from "@/components/crm/customer-filters";
import { CustomerTable } from "@/components/crm/customer-table";
import { CustomerPreviewPanel } from "@/components/crm/customer-preview-panel";
import { CustomerForm } from "@/components/crm/customer-form";
import { HizmetForm, type ContractFileValue } from "@/components/crm/detail/hizmet-form";
import { matchesFilter, matchesSearch, type CustomerFilterKey } from "@/components/crm/crm-filter-logic";
import { formatCurrency } from "@/components/crm/crm-format";
import type { Customer, ContractStatus } from "@/lib/mock/crm";
import type { CustomerFormValues, HizmetFormValues } from "@/lib/validations/crm";

export function CustomerManagementPage({
  initialCustomers,
  contractStatusByCustomer,
  pendingOfferCustomerIds,
}: {
  initialCustomers: Customer[];
  contractStatusByCustomer: Record<string, ContractStatus>;
  pendingOfferCustomerIds: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const pendingOfferIdSet = useMemo(() => new Set(pendingOfferCustomerIds), [pendingOfferCustomerIds]);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [activeFilters, setActiveFilters] = useState<Set<CustomerFilterKey>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(searchParams.get("new") === "1");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [serviceCustomer, setServiceCustomer] = useState<Customer | null>(null);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);

  const filterContext = useMemo(() => ({ pendingOfferCustomerIds: pendingOfferIdSet }), [pendingOfferIdSet]);

  const filtered = useMemo(() => {
    return customers.filter((customer) => {
      if (!matchesSearch(customer, search)) return false;
      for (const key of activeFilters) {
        if (!matchesFilter(customer, key, filterContext)) return false;
      }
      return true;
    });
  }, [customers, search, activeFilters, filterContext]);

  const selectedCustomer = customers.find((c) => c.id === selectedId) ?? null;

  const kpis = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.status === "active").length;
    const passive = customers.filter((c) => c.status === "passive").length;
    const contractEnding = customers.filter((c) => matchesFilter(c, "contract_expiring")).length;
    const pendingOffers = customers.filter((c) => matchesFilter(c, "pending_offer", filterContext)).length;
    const pendingCollectionTotal = customers.reduce((sum, c) => sum + c.pendingCollection, 0);
    return { total, active, passive, contractEnding, pendingOffers, pendingCollectionTotal };
  }, [customers, filterContext]);

  function toggleFilter(key: CustomerFilterKey) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleCreateCustomer(values: CustomerFormValues) {
    if (editingCustomer) {
      const res = await fetch(`/api/crm/customers/${editingCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Müşteri güncellenemedi");
        return;
      }
      setCustomers((prev) => prev.map((c) => (c.id === editingCustomer.id ? data.customer : c)));
      setEditingCustomer(null);
      return;
    }

    const res = await fetch("/api/crm/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "Müşteri oluşturulamadı");
      return;
    }
    setCustomers((prev) => [data.customer, ...prev]);
    setSelectedId(data.customer.id);
  }

  function handleEdit(customer: Customer) {
    setEditingCustomer(customer);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deletingCustomer) return;
    const res = await fetch(`/api/crm/customers/${deletingCustomer.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Müşteri silinemedi");
      return;
    }
    setCustomers((prev) => prev.filter((c) => c.id !== deletingCustomer.id));
    if (selectedId === deletingCustomer.id) setSelectedId(null);
    setDeletingCustomer(null);
  }

  function goToTab(customer: Customer, tab: string) {
    router.push(`/dashboard/client/customers/${customer.id}?tab=${tab}`);
  }

  async function handleCreateService(values: HizmetFormValues, contract: ContractFileValue) {
    if (!serviceCustomer) return;
    const res = await fetch("/api/crm/service-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, customerId: serviceCustomer.id, contractFileDataUrl: contract.fileDataUrl, contractFileName: contract.fileName }),
    });
    if (!res.ok) {
      toast.error("Hizmet kaydedilemedi");
      return;
    }
    toast.success(`${serviceCustomer.companyName} için hizmet kaydedildi`);
    setServiceCustomer(null);
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
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">
            Müşteri Yönetimi
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Müşteriler, şubeler, lokasyonlar, sözleşmeler, teklifler ve geçmiş işlemleri tek merkezden yönetin.
          </p>
        </div>
        <RainbowButton
          onClick={() => {
            setEditingCustomer(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Yeni Müşteri
        </RainbowButton>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <CrmKpiCard
          label="Toplam Müşteri"
          value={kpis.total}
          description="Kayıtlı tüm müşteriler"
          changePercent={4}
          icon={Users}
          accent="blue"
          delay={0.05}
        />
        <CrmKpiCard
          label="Aktif Müşteri"
          value={kpis.active}
          description="Hizmet devam ediyor"
          changePercent={6}
          icon={UserCheck}
          accent="emerald"
          delay={0.1}
        />
        <CrmKpiCard
          label="Pasif Müşteri"
          value={kpis.passive}
          description="Hizmet durduruldu"
          changePercent={-2}
          icon={UserX}
          accent="amber"
          delay={0.15}
        />
        <CrmKpiCard
          label="Sözleşmesi Bitenler"
          value={kpis.contractEnding}
          description="30 gün içinde bitiyor"
          changePercent={12}
          icon={FileClock}
          accent="purple"
          delay={0.2}
        />
        <CrmKpiCard
          label="Bekleyen Teklifler"
          value={kpis.pendingOffers}
          description="Yanıt bekleyen teklif"
          changePercent={8}
          icon={Clock3}
          accent="amber"
          delay={0.25}
        />
        <CrmKpiCard
          label="Tahsilat Bekleyenler"
          value={kpis.pendingCollectionTotal}
          format={formatCurrency}
          description="Toplam bekleyen tutar"
          changePercent={-5}
          icon={Wallet}
          accent="blue"
          delay={0.3}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <CustomerFilters
          customers={customers}
          filterContext={filterContext}
          search={search}
          onSearchChange={setSearch}
          activeFilters={activeFilters}
          onToggleFilter={toggleFilter}
        />
        <CustomerTable
          customers={filtered}
          contractStatusByCustomer={contractStatusByCustomer}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onEdit={handleEdit}
          onDelete={setDeletingCustomer}
          onCreateOffer={(c) => goToTab(c, "offers")}
          onCreateContract={(c) => goToTab(c, "contracts")}
          onCreateWorkOrder={(c) => goToTab(c, "work-history")}
          onCreateService={(c) => {
            setServiceCustomer(c);
            setServiceFormOpen(true);
          }}
          onViewAccount={(c) => goToTab(c, "account")}
        />
      </div>

      <CustomerPreviewPanel
        customer={selectedCustomer}
        open={selectedId !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onCreateWorkOrder={(c) => goToTab(c, "work-history")}
        onCreateOffer={(c) => goToTab(c, "offers")}
        onCreateContract={(c) => goToTab(c, "contracts")}
        onViewAccount={(c) => goToTab(c, "account")}
      />

      <HizmetForm
        open={serviceFormOpen}
        onOpenChange={(open) => {
          setServiceFormOpen(open);
          if (!open) setServiceCustomer(null);
        }}
        onSubmit={handleCreateService}
        customer={serviceCustomer}
      />

      <CustomerForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingCustomer(null);
        }}
        onSubmit={handleCreateCustomer}
        defaultValues={editingCustomer ?? undefined}
        customer={editingCustomer}
      />

      <AlertDialog open={!!deletingCustomer} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-destructive" />
              Müşteriyi sil
            </AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deletingCustomer?.companyName}&rdquo; kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
