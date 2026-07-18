import { Suspense } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { QrCheckPage } from "@/components/operations/qr-check-page";
import { serializeStation } from "@/lib/operations/serialize";

async function QrCheckPageData() {
  const session = await auth();
  const ownerId = session!.user.id;
  const [stations, customers] = await Promise.all([
    prisma.station.findMany({
      where: { ownerId },
      include: { customer: { select: { id: true, companyName: true } } },
      orderBy: { label: "asc" },
    }),
    prisma.customer.findMany({ where: { ownerId }, select: { id: true, companyName: true }, orderBy: { companyName: "asc" } }),
  ]);

  return (
    <QrCheckPage
      initialStations={stations.map((s) => ({ ...serializeStation(s), customer: s.customer }))}
      customers={customers}
    />
  );
}

export default function Page() {
  return (
    <Suspense>
      <QrCheckPageData />
    </Suspense>
  );
}
