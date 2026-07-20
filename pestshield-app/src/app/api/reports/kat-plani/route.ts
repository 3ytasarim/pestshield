import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { buildStationReportRows } from "@/lib/kat-plani-report-server";
import { serializeKrokiSketch } from "@/lib/kroki/serialize";

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const serviceOrderId = searchParams.get("serviceOrderId");
  const sketchId = searchParams.get("sketchId");
  if (!serviceOrderId || !sketchId) {
    return NextResponse.json({ message: "serviceOrderId ve sketchId zorunludur." }, { status: 400 });
  }

  const sketchRecord = await prisma.krokiSketch.findFirst({
    where: { id: sketchId, ownerId, serviceOrderId },
    include: { stations: true },
  });
  if (!sketchRecord) {
    return NextResponse.json({ message: "Kroki bulunamadı." }, { status: 404 });
  }

  const sketch = serializeKrokiSketch(sketchRecord);
  const rows = await buildStationReportRows(ownerId, serviceOrderId, sketch);
  return NextResponse.json({ rows });
}
