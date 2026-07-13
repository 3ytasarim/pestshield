import { Suspense } from "react";
import { StationScanPage } from "@/components/operations/station-scan-page";

export default function TechScanPage() {
  return (
    <Suspense>
      <StationScanPage />
    </Suspense>
  );
}
