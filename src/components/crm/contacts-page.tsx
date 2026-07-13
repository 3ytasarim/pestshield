"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, Phone, Search, Star, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { getAllContacts, getCustomerById } from "@/lib/mock/crm";
import { cn } from "@/lib/utils";

type PrimaryFilter = "all" | "primary";

export function ContactsPage() {
  const [search, setSearch] = useState("");
  const [primaryFilter, setPrimaryFilter] = useState<PrimaryFilter>("all");

  const contacts = useMemo(
    () => getAllContacts().map((c) => ({ ...c, customer: getCustomerById(c.customerId) })),
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (primaryFilter === "primary" && !c.isPrimary) return false;
      if (
        q &&
        !c.name.toLowerCase().includes(q) &&
        !c.customer?.companyName.toLowerCase().includes(q) &&
        !c.email.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [contacts, search, primaryFilter]);

  const primaryCount = useMemo(() => contacts.filter((c) => c.isPrimary).length, [contacts]);
  const uniqueCustomers = useMemo(() => new Set(contacts.map((c) => c.customerId)).size, [contacts]);

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">İletişim Kişileri</h1>
        <p className="max-w-xl text-sm text-muted-foreground">Tüm müşterilere ait iletişim kişilerinin tek merkezden görünümü.</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Toplam Kişi" value={contacts.length} description="Tüm müşteriler genelinde" changePercent={5} icon={Users} accent="blue" delay={0.05} />
        <CrmKpiCard label="Birincil Kişi" value={primaryCount} description="Karar verici olarak işaretli" changePercent={4} icon={Star} accent="emerald" delay={0.1} />
        <CrmKpiCard label="Müşteri Kapsamı" value={uniqueCustomers} description="Kişi kaydı bulunan müşteri sayısı" changePercent={3} icon={Phone} accent="purple" delay={0.15} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="İsim, e-posta veya müşteri ara…" className="h-11 rounded-xl pl-10" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setPrimaryFilter("all")}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              primaryFilter === "all" ? "border-primary/20 bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            Tümü
          </button>
          <button
            type="button"
            onClick={() => setPrimaryFilter("primary")}
            className={cn(
              "flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              primaryFilter === "primary" ? "border-primary/20 bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            <Star className="size-3.5" />
            Sadece Birincil
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="Kişi bulunamadı" description="Seçili filtrelere uyan iletişim kişisi yok." />
      ) : (
        <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
            <span className="text-sm font-semibold text-foreground">Kişi Listesi</span>
            <span className="text-xs font-medium text-muted-foreground">{filtered.length} kayıt</span>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead className="hidden sm:table-cell">Ünvan</TableHead>
                  <TableHead className="hidden md:table-cell">Telefon</TableHead>
                  <TableHead className="hidden lg:table-cell">E-posta</TableHead>
                  <TableHead className="hidden lg:table-cell">Departman</TableHead>
                  <TableHead>Birincil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell>
                      {contact.customer ? (
                        <Link href={`/dashboard/client/customers/${contact.customer.id}`} className="hover:text-primary hover:underline">
                          {contact.customer.companyName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{contact.title}</TableCell>
                    <TableCell className="hidden md:table-cell">{contact.phone}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="flex items-center gap-1.5">
                        <Mail className="size-3.5 text-muted-foreground" />
                        {contact.email}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{contact.department || "—"}</TableCell>
                    <TableCell>{contact.isPrimary && <Star className="size-4 fill-amber-400 text-amber-400" />}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
