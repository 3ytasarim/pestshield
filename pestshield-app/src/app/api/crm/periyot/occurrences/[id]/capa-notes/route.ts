import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { periyotCapaNoteSchema } from "@/lib/validations/periyot";
import { serializePeriyotCapaNote } from "@/lib/periyot/serialize";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id } = await params;
  const notes = await prisma.periyotCapaNote.findMany({
    where: { periyotOccurrenceId: id, ownerId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ capaNotes: notes.map(serializePeriyotCapaNote) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id } = await params;
  const occurrence = await prisma.periyotOccurrence.findFirst({ where: { id, ownerId } });
  if (!occurrence) {
    return NextResponse.json({ message: "Periyot ziyareti bulunamadı." }, { status: 404 });
  }

  const parsed = periyotCapaNoteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const note = await prisma.periyotCapaNote.create({
    data: { ownerId, periyotOccurrenceId: id, ...parsed.data, createdAt: new Date().toISOString() },
  });
  return NextResponse.json({ capaNote: serializePeriyotCapaNote(note) }, { status: 201 });
}
