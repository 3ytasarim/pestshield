"use client";

import { useEffect, useState } from "react";
import { Download, Eye, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { formatDate, formatFileSize } from "@/components/crm/crm-format";
import { printEk1Form, type Ek1PrintFormFields } from "@/lib/pdf/ek1-report";
import type { PeriyotOccurrence } from "@/lib/mock/crm";

interface PortalReport {
  id: string;
  updatedAt: string;
  batchName: string;
  occurrence: Pick<PeriyotOccurrence, "periodDate" | "startTime" | "endTime">;
  form: Ek1PrintFormFields;
}

interface PortalFileDocument {
  id: string;
  fileDataUrl: string;
  fileName: string | null;
  fileSizeKb: number;
  createdAt: string;
  name?: string;
}

interface DocumentsCardProps {
  customerName: string;
}

function isPdf(fileName: string | null | undefined): boolean {
  return (fileName ?? "").toLowerCase().endsWith(".pdf");
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function DocumentsCard({ customerName }: DocumentsCardProps) {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<PortalReport[]>([]);
  const [serviceDocuments, setServiceDocuments] = useState<PortalFileDocument[]>([]);
  const [companyDocuments, setCompanyDocuments] = useState<PortalFileDocument[]>([]);
  const [viewDoc, setViewDoc] = useState<{ title: string } & PortalFileDocument | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [reportsRes, serviceRes, companyRes] = await Promise.all([
          fetch("/api/portal/reports"),
          fetch("/api/portal/service-documents"),
          fetch("/api/portal/company-documents"),
        ]);
        const reportsData = reportsRes.ok ? await reportsRes.json() : { reports: [] };
        const serviceData = serviceRes.ok ? await serviceRes.json() : { documents: [] };
        const companyData = companyRes.ok ? await companyRes.json() : { documents: [] };
        setReports(reportsData.reports ?? []);
        setServiceDocuments(serviceData.documents ?? []);
        setCompanyDocuments(companyData.documents ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handlePrintReport(report: PortalReport) {
    printEk1Form(report.form, report.occurrence, customerName, report.batchName);
  }

  return (
    <>
      <Card className="rounded-2xl">
        <CardContent>
          <Tabs defaultValue="raporlar">
            <TabsList variant="line">
              <TabsTrigger value="raporlar">RAPORLAR</TabsTrigger>
              <TabsTrigger value="hizmet">HİZMET BELGELERİ</TabsTrigger>
              <TabsTrigger value="firma">FİRMA BELGELERİ</TabsTrigger>
            </TabsList>

            <TabsContent value="raporlar" className="mt-4">
              {!loading && reports.length === 0 ? (
                <EmptyState icon={FileText} title="Henüz rapor yok" description="Teknisyen ziyaret raporu oluşturduğunda burada görünür." />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/60">
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
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell>{formatDate(report.updatedAt)}</TableCell>
                          <TableCell className="font-medium text-primary">
                            Biyosidal Ürün Uygulama Raporu ({customerName})
                          </TableCell>
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
                </div>
              )}
            </TabsContent>

            <TabsContent value="hizmet" className="mt-4">
              {!loading && serviceDocuments.length === 0 ? (
                <EmptyState icon={FileText} title="Henüz belge yok" description="Teklif kabul edildiğinde eklenen belge burada görünür." />
              ) : (
                <FileDocumentTable
                  rows={serviceDocuments}
                  typeLabel="Teklif Kabul"
                  onView={(doc) => setViewDoc({ ...doc, title: "Teklif Kabul" })}
                />
              )}
            </TabsContent>

            <TabsContent value="firma" className="mt-4">
              {!loading && companyDocuments.length === 0 ? (
                <EmptyState icon={FileText} title="Henüz belge yok" description="Firma belgeleri eklendiğinde burada görünür." />
              ) : (
                <FileDocumentTable
                  rows={companyDocuments}
                  onView={(doc) => setViewDoc({ ...doc, title: doc.name ?? doc.fileName ?? "Belge" })}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!viewDoc} onOpenChange={(open) => !open && setViewDoc(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewDoc?.title}</DialogTitle>
          </DialogHeader>
          {viewDoc &&
            (isPdf(viewDoc.fileName) ? (
              <iframe src={viewDoc.fileDataUrl} className="h-[70vh] w-full rounded-lg border border-border" title={viewDoc.title} />
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
                <FileText className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Bu dosya türü için tarayıcı içi önizleme desteklenmiyor.</p>
                <Button onClick={() => window.open(viewDoc.fileDataUrl, "_blank", "noopener,noreferrer")}>
                  <Eye className="size-4" />
                  Yeni Sekmede Aç
                </Button>
              </div>
            ))}
        </DialogContent>
      </Dialog>
    </>
  );
}

function FileDocumentTable({
  rows,
  typeLabel,
  onView,
}: {
  rows: PortalFileDocument[];
  typeLabel?: string;
  onView: (doc: PortalFileDocument) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Tarih</TableHead>
            <TableHead>{typeLabel ? "Belge Türü" : "Belge Adı"}</TableHead>
            <TableHead>Boyut</TableHead>
            <TableHead className="w-20 text-right">İşlem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((doc, i) => (
            <TableRow key={doc.id}>
              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
              <TableCell>{formatDate(doc.createdAt)}</TableCell>
              <TableCell className="font-medium text-primary">{typeLabel ?? doc.name}</TableCell>
              <TableCell className="text-muted-foreground">{formatFileSize(doc.fileSizeKb)}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button size="icon-sm" variant="ghost" title="Görüntüle" onClick={() => onView(doc)}>
                    <Eye className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    title="İndir"
                    onClick={() => downloadDataUrl(doc.fileDataUrl, doc.fileName || doc.name || "belge")}
                  >
                    <Download className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
