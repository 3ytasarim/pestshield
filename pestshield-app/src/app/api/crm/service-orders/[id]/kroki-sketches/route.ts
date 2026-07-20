import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { createKrokiSketchSchema } from "@/lib/validations/kroki";
import { serializeKrokiSketch } from "@/lib/kroki/serialize";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id: serviceOrderId } = await params;
  const sketches = await prisma.krokiSketch.findMany({
    where: { serviceOrderId, ownerId },
    include: { stations: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ krokiSketches: sketches.map(serializeKrokiSketch) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id: serviceOrderId } = await params;
  const serviceOrder = await prisma.serviceOrder.findFirst({ where: { id: serviceOrderId, ownerId } });
  if (!serviceOrder) {
    return NextResponse.json({ message: "Hizmet kaydı bulunamadı." }, { status: 404 });
  }

  const parsed = createKrokiSketchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const [sketch] = await prisma.$transaction([
    prisma.krokiSketch.create({
      data: { ownerId, serviceOrderId, ...parsed.data, createdAt: new Date().toISOString() },
      include: { stations: true },
    }),
    prisma.serviceOrder.update({ where: { id: serviceOrderId }, data: { sketchCount: { increment: 1 } } }),
  ]);

  return NextResponse.json({ krokiSketch: serializeKrokiSketch(sketch) }, { status: 201 });
}
