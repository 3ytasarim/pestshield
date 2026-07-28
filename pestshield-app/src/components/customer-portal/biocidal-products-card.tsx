"use client";

import { useEffect, useState } from "react";
import { FileText, FlaskConical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/crm/detail/empty-state";

interface PortalBiocidalProduct {
  id: string;
  name: string;
  licenseFileDataUrl: string | null;
  licenseFileName: string | null;
  msdsFileDataUrl: string | null;
  msdsFileName: string | null;
}

export function BiocidalProductsCard() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<PortalBiocidalProduct[]>([]);

  useEffect(() => {
    fetch("/api/portal/biocidal-products")
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data: { products?: PortalBiocidalProduct[] }) => setProducts(data.products ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="rounded-2xl">
      <CardContent>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Biyosidal Ürünler</h2>
        {!loading && products.length === 0 ? (
          <EmptyState icon={FlaskConical} title="Henüz ürün yok" description="Teknisyen ziyarette biyosidal ürün kullandığında burada görünür." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead className="text-center">Ürün Ruhsatı</TableHead>
                  <TableHead className="text-center">Ürün Msds</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, i) => (
                  <TableRow key={product.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                    <TableCell className="text-center">
                      <FileLink dataUrl={product.licenseFileDataUrl} />
                    </TableCell>
                    <TableCell className="text-center">
                      <FileLink dataUrl={product.msdsFileDataUrl} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FileLink({ dataUrl }: { dataUrl: string | null }) {
  if (!dataUrl) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
      title="Belgeyi görüntüle"
      onClick={() => window.open(dataUrl, "_blank", "noopener,noreferrer")}
    >
      <FileText className="size-4" />
    </button>
  );
}
