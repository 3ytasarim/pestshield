import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner, getSessionPermissions } from "@/lib/api-auth";
import { companyRoleUpdateSchema } from "@/lib/validations/system";
import { serializeCompanyRole, type CompanyRolePermissions } from "@/lib/system/serialize";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const sessionPermissions = await getSessionPermissions();
  if (!sessionPermissions) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const existing = await prisma.companyRole.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Rol bulunamadı." }, { status: 404 });
  }

  // Kazara kendi erişimini kilitlememesi için: bir alt kullanıcı kendi rolünü düzenleyemez.
  if (sessionPermissions.companyRoleId === id) {
    return NextResponse.json(
      { message: "Kendi rolünüzü düzenleyemezsiniz." },
      { status: 403 },
    );
  }

  const parsed = companyRoleUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const touchesRoleFields = parsed.data.name !== undefined || parsed.data.visibleNavHrefs !== undefined;
  const touchesPermissions = parsed.data.permissions !== undefined;

  if (touchesRoleFields && !sessionPermissions.can("/dashboard/client/roles", "edit")) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }
  if (touchesPermissions && !sessionPermissions.can("/dashboard/client/permissions", "edit")) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const role = await prisma.companyRole.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.visibleNavHrefs !== undefined ? { visibleNavHrefs: parsed.data.visibleNavHrefs } : {}),
      ...(parsed.data.permissions !== undefined
        ? { permissions: parsed.data.permissions as CompanyRolePermissions }
        : {}),
    },
    include: { companyUsers: { select: { id: true } } },
  });

  return NextResponse.json({ role: serializeCompanyRole(role) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const sessionPermissions = await getSessionPermissions();
  if (!sessionPermissions?.can("/dashboard/client/roles", "delete")) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  if (sessionPermissions.companyRoleId === id) {
    return NextResponse.json(
      { message: "Kendi rolünüzü silemezsiniz." },
      { status: 403 },
    );
  }

  const existing = await prisma.companyRole.findFirst({
    where: { id, ownerId },
    include: { companyUsers: { select: { id: true } } },
  });
  if (!existing) {
    return NextResponse.json({ message: "Rol bulunamadı." }, { status: 404 });
  }

  if (existing.companyUsers.length > 0) {
    return NextResponse.json(
      { message: `${existing.companyUsers.length} kullanıcı bu role atanmış, önce başka bir role taşıyın.` },
      { status: 409 },
    );
  }

  await prisma.companyRole.delete({ where: { id } });
  return NextResponse.json({ message: "Rol silindi." });
}
