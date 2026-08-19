import { Suspense } from "react";
import { auth } from "@/auth";
import { StationScanPage } from "@/components/operations/station-scan-page";

export default async function TechScanPage() {
  const session = await auth();

  return (
    <Suspense>
      <StationScanPage technicianName={session?.user?.name ?? "Teknisyen"} />
    </Suspense>
  );
}
