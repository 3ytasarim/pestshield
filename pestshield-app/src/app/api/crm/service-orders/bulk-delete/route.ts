import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";

const bulkDeleteSchema = z.object({ ids: z.array(z.string().min(1)).min(1) });

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = bulkDeleteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  await prisma.serviceOrder.deleteMany({ where: { id: { in: parsed.data.ids }, ownerId } });
  return NextResponse.json({ success: true });
}
