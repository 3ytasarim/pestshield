import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { createDocumentSchema } from "@/lib/validations/documents";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const documents = await prisma.document.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = createDocumentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const document = await prisma.document.create({
    data: { ownerId, ...parsed.data },
  });
  return NextResponse.json({ document }, { status: 201 });
}
