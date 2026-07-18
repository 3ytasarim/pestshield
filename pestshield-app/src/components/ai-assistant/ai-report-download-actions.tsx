"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AiReportDownloadActions({
  pdfAvailable,
  excelAvailable,
  onDownloadPdf,
  onDownloadExcel,
  excelLoading,
}: {
  pdfAvailable: boolean;
  excelAvailable: boolean;
  onDownloadPdf: () => void;
  onDownloadExcel: () => void;
  excelLoading?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {pdfAvailable && (
        <Button type="button" size="sm" variant="outline" onClick={onDownloadPdf}>
          <FileText className="size-3.5" aria-hidden="true" />
          PDF İndir
        </Button>
      )}
      {excelAvailable && (
        <Button type="button" size="sm" variant="outline" onClick={onDownloadExcel} loading={excelLoading} startContent={<FileSpreadsheet className="size-3.5" aria-hidden="true" />}>
          Excel İndir
        </Button>
      )}
    </div>
  );
}
