import { Suspense } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { QrCheckPage } from "@/components/operations/qr-check-page";

async function QrCheckPageData() {
  const session = await auth();
  const ownerId = session!.user.id;
  const krokiStations = await prisma.krokiStation.findMany({
    where: { ownerId },
    include: {
      krokiSketch: {
        select: {
          name: true,
          serviceOrder: { select: { description: true, customer: { select: { id: true, companyName: true } } } },
        },
      },
    },
    orderBy: { number: "asc" },
  });

  const stations = krokiStations.map((s) => ({
    id: s.id,
    type: s.type,
    number: s.number,
    stationId: s.stationId,
    sketchName: s.krokiSketch.name,
    serviceName: s.krokiSketch.serviceOrder.description,
    customer: s.krokiSketch.serviceOrder.customer,
  }));

  return <QrCheckPage initialStations={stations} />;
}

export default function Page() {
  return (
    <Suspense>
      <QrCheckPageData />
    </Suspense>
  );
}
