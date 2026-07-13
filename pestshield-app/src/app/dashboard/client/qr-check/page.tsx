import { Suspense } from "react";
import { QrCheckPage } from "@/components/operations/qr-check-page";

export default function Page() {
  return (
    <Suspense>
      <QrCheckPage />
    </Suspense>
  );
}
