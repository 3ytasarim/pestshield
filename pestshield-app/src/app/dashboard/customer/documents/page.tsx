"use client";

import { useEffect, useState } from "react";
import { Download, Eye, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { formatDate, formatFileSize } from "@/components/crm/crm-format";

interface CompanyDocumentRow {
  id: string;
  name: string;
  fileDataUrl: string;
  fileName: string;
  fileSizeKb: number;
  createdAt: string;
}

interface TechnicianDocumentRow {
  id: string;
  name: string;
  fileDataUrl: string;
  fileName: string;
  fileSizeKb: number;
  createdAt: string;
  technician: { name: string };
}

interface VehicleDocumentRow {
  id: string;
  name: string;
  fileDataUrl: string;
  fileName: string;
  fileSizeKb: number;
  createdAt: string;
  vehicle: { plate: string };
}

type ViewDoc = { title: string; subtitle?: string; fileDataUrl: string; fileName: string };

function isPdf(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".pdf");
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function CustomerPortalDocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [companyDocs, setCompanyDocs] = useState<CompanyDocumentRow[]>([]);
  const [technicianDocs, setTechnicianDocs] = useState<TechnicianDocumentRow[]>([]);
  const [vehicleDocs, setVehicleDocs] = useState<VehicleDocumentRow[]>([]);
  const [viewDoc, setViewDoc] = useState<ViewDoc | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [companyRes, technicianRes, vehicleRes] = await Promise.all([
          fetch("/api/portal/company-documents"),
          fetch("/api/portal/technician-documents"),
          fetch("/api/portal/vehicle-documents"),
        ]);
        const companyData = companyRes.ok ? await companyRes.json() : { documents: [] };
        const technicianData = technicianRes.ok ? await technicianRes.json() : { documents: [] };
        const vehicleData = vehicleRes.ok ? await vehicleRes.json() : { documents: [] };
        setCompanyDocs(companyData.documents ?? []);
        setTechnicianDocs(technicianData.documents ?? []);
        setVehicleDocs(vehicleData.documents ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-foreground">Firmalar ve Belgeleri</h1>
        <p className="text-sm text-muted-foreground">İlaçlama firmanıza ait firma, personel ve araç belgeleri.</p>
      </div>

      <Card className="rounded-2xl">
        <CardContent>
          <Tabs defaultValue="firma">
            <TabsList variant="line">
              <TabsTrigger value="firma">FİRMA BELGELERİ</TabsTrigger>
              <TabsTrigger value="personel">PERSONEL BELGELERİ</TabsTrigger>
              <TabsTrigger value="arac">ARAÇ BELGELERİ</TabsTrigger>
            </TabsList>

            <TabsContent value="firma" className="mt-4">
              {!loading && companyDocs.length === 0 ? (
                <EmptyState icon={FileText} title="Henüz belge yok" description="Firma belgeleri eklendiğinde burada görünür." />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Belge Adı</TableHead>
                        <TableHead>Boyut</TableHead>
                        <TableHead className="w-20 text-right">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyDocs.map((doc, i) => (
                        <TableRow key={doc.id}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell>{formatDate(doc.createdAt)}</TableCell>
                          <TableCell className="font-medium text-primary">{doc.name}</TableCell>
                          <TableCell className="text-muted-foreground">{formatFileSize(doc.fileSizeKb)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                title="Görüntüle"
                                onClick={() => setViewDoc({ title: doc.name, fileDataUrl: doc.fileDataUrl, fileName: doc.fileName })}
                              >
                                <Eye className="size-4" />
                              </Button>
                              <Button size="icon-sm" variant="ghost" title="İndir" onClick={() => downloadDataUrl(doc.fileDataUrl, doc.fileName)}>
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

            <TabsContent value="personel" className="mt-4">
              {!loading && technicianDocs.length === 0 ? (
                <EmptyState icon={FileText} title="Henüz belge yok" description="Personel belgeleri eklendiğinde burada görünür." />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Personel</TableHead>
                        <TableHead>Belge Adı</TableHead>
                        <TableHead>Boyut</TableHead>
                        <TableHead className="w-20 text-right">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {technicianDocs.map((doc, i) => (
                        <TableRow key={doc.id}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell>{formatDate(doc.createdAt)}</TableCell>
                          <TableCell className="font-medium text-foreground">{doc.technician.name}</TableCell>
                          <TableCell className="font-medium text-primary">{doc.name}</TableCell>
                          <TableCell className="text-muted-foreground">{formatFileSize(doc.fileSizeKb)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                title="Görüntüle"
                                onClick={() =>
                                  setViewDoc({ title: doc.name, subtitle: doc.technician.name, fileDataUrl: doc.fileDataUrl, fileName: doc.fileName })
                                }
                              >
                                <Eye className="size-4" />
                              </Button>
                              <Button size="icon-sm" variant="ghost" title="İndir" onClick={() => downloadDataUrl(doc.fileDataUrl, doc.fileName)}>
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

            <TabsContent value="arac" className="mt-4">
              {!loading && vehicleDocs.length === 0 ? (
                <EmptyState icon={FileText} title="Henüz belge yok" description="Araç belgeleri eklendiğinde burada görünür." />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Araç</TableHead>
                        <TableHead>Belge Adı</TableHead>
                        <TableHead>Boyut</TableHead>
                        <TableHead className="w-20 text-right">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicleDocs.map((doc, i) => (
                        <TableRow key={doc.id}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell>{formatDate(doc.createdAt)}</TableCell>
                          <TableCell className="font-medium text-foreground">{doc.vehicle.plate}</TableCell>
                          <TableCell className="font-medium text-primary">{doc.name}</TableCell>
                          <TableCell className="text-muted-foreground">{formatFileSize(doc.fileSizeKb)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                title="Görüntüle"
                                onClick={() =>
                                  setViewDoc({ title: doc.name, subtitle: doc.vehicle.plate, fileDataUrl: doc.fileDataUrl, fileName: doc.fileName })
                                }
                              >
                                <Eye className="size-4" />
                              </Button>
                              <Button size="icon-sm" variant="ghost" title="İndir" onClick={() => downloadDataUrl(doc.fileDataUrl, doc.fileName)}>
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
    </div>
  );
}
