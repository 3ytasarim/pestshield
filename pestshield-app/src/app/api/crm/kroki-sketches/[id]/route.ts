import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { updateKrokiSketchSchema } from "@/lib/validations/kroki";
import { serializeKrokiSketch } from "@/lib/kroki/serialize";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.krokiSketch.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Kroki bulunamadı." }, { status: 404 });
  }

  const parsed = updateKrokiSketchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }
  const { layerVisibility, stations, ...rest } = parsed.data;

  const sketch = await prisma.$transaction(async (tx) => {
    await tx.krokiSketch.update({
      where: { id },
      data: {
        ...rest,
        ...(layerVisibility?.zehirli !== undefined ? { zehirliVisible: layerVisibility.zehirli } : {}),
        ...(layerVisibility?.zehirsiz !== undefined ? { zehirsizVisible: layerVisibility.zehirsiz } : {}),
        ...(layerVisibility?.ic_uckun !== undefined ? { icUckunVisible: layerVisibility.ic_uckun } : {}),
        ...(layerVisibility?.dis_uckun !== undefined ? { disUckunVisible: layerVisibility.dis_uckun } : {}),
      },
    });

    if (stations) {
      await tx.krokiStation.deleteMany({ where: { krokiSketchId: id } });
      if (stations.length > 0) {
        await tx.krokiStation.createMany({
          data: stations.map((s) => ({ ownerId, krokiSketchId: id, type: s.type, x: s.x, y: s.y, stationId: s.stationId })),
        });
      }
    }

    return tx.krokiSketch.findUniqueOrThrow({ where: { id }, include: { stations: true } });
  });

  return NextResponse.json({ krokiSketch: serializeKrokiSketch(sketch) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.krokiSketch.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Kroki bulunamadı." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.krokiSketch.delete({ where: { id } }),
    prisma.serviceOrder.update({
      where: { id: existing.serviceOrderId },
      data: { sketchCount: { decrement: 1 } },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
