import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { saveStationInspectionsSchema } from "@/lib/validations/kroki";
import { serializeStationInspection } from "@/lib/kroki/serialize";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id } = await params;
  const inspections = await prisma.stationInspection.findMany({ where: { periyotOccurrenceId: id, ownerId } });
  return NextResponse.json({ inspections: inspections.map(serializeStationInspection) });
}

/** Verilen periyot ziyareti için tüm kayıtları tek seferde kaydeder (var olanların yerine geçer). */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id } = await params;
  const occurrence = await prisma.periyotOccurrence.findFirst({ where: { id, ownerId } });
  if (!occurrence) {
    return NextResponse.json({ message: "Periyot ziyareti bulunamadı." }, { status: 404 });
  }

  const parsed = saveStationInspectionsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const inspections = await prisma.$transaction(async (tx) => {
    await tx.stationInspection.deleteMany({ where: { periyotOccurrenceId: id } });
    if (parsed.data.inspections.length > 0) {
      await tx.stationInspection.createMany({
        data: parsed.data.inspections.map((i) => ({ ownerId, periyotOccurrenceId: id, ...i })),
      });
    }
    return tx.stationInspection.findMany({ where: { periyotOccurrenceId: id } });
  });

  return NextResponse.json({ inspections: inspections.map(serializeStationInspection) });
}
