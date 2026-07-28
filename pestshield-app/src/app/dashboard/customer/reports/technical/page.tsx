"use client";

import { useEffect, useState } from "react";
import { Download, Eye, FileBarChart } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { formatDate } from "@/components/crm/crm-format";
import { printEk1Form, type Ek1PrintFormFields } from "@/lib/pdf/ek1-report";
import type { PeriyotOccurrence } from "@/lib/mock/crm";

interface PortalReport {
  id: string;
  updatedAt: string;
  batchName: string;
  occurrence: Pick<PeriyotOccurrence, "periodDate" | "startTime" | "endTime">;
  form: Ek1PrintFormFields;
}

export default function CustomerPortalTechnicalReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<PortalReport[]>([]);
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/portal/reports"), fetch("/api/portal/profile")])
      .then(async ([reportsRes, profileRes]) => {
        const reportsData = reportsRes.ok ? await reportsRes.json() : { reports: [] };
        const profileData = profileRes.ok ? await profileRes.json() : { customer: null };
        setReports(reportsData.reports ?? []);
        setCustomerName(profileData.customer?.companyName ?? "");
      })
      .finally(() => setLoading(false));
  }, []);

  function handlePrintReport(report: PortalReport) {
    printEk1Form(report.form, report.occurrence, customerName, report.batchName);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-foreground">Teknik Raporlar</h1>
        <p className="text-sm text-muted-foreground">Teknisyenin ziyaretlerinizde oluşturduğu Biyosidal Ürün Uygulama Raporları.</p>
      </div>

      {!loading && reports.length === 0 ? (
        <EmptyState icon={FileBarChart} title="Henüz rapor yok" description="Teknisyen ziyaret raporu oluşturduğunda burada görünür." />
      ) : (
        <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
            <span className="text-sm font-semibold text-foreground">Rapor Listesi</span>
            <span className="text-xs font-medium text-muted-foreground">{reports.length} kayıt</span>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Belge Türü</TableHead>
                  <TableHead className="w-20 text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report, i) => (
                  <TableRow key={report.id}>
                    <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>{formatDate(report.updatedAt)}</TableCell>
                    <TableCell className="font-medium text-primary">Biyosidal Ürün Uygulama Raporu ({customerName})</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon-sm" variant="ghost" title="Görüntüle" onClick={() => handlePrintReport(report)}>
                          <Eye className="size-4" />
                        </Button>
                        <Button size="icon-sm" variant="ghost" title="İndir" onClick={() => handlePrintReport(report)}>
                          <Download className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
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
