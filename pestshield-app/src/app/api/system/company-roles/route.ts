import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner, getSessionPermissions } from "@/lib/api-auth";
import { companyRoleFormSchema } from "@/lib/validations/system";
import { serializeCompanyRole, type CompanyRolePermissions } from "@/lib/system/serialize";
import { getClientNavHrefs } from "@/components/layout/nav-config";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const roles = await prisma.companyRole.findMany({
    where: { ownerId },
    include: { companyUsers: { select: { id: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ roles: roles.map(serializeCompanyRole) });
}

/** Tüm modüller için tam-yetki varsayılanıyla doldurulmuş permissions üretir; body'de gelen değerler bunun üzerine yazılır. */
function withDefaultPermissions(provided: CompanyRolePermissions): CompanyRolePermissions {
  const result: CompanyRolePermissions = {};
  for (const { href } of getClientNavHrefs()) {
    result[href] = {
      view: true,
      create: true,
      edit: true,
      delete: true,
      ...provided[href],
    };
  }
  return result;
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const permissions = await getSessionPermissions();
  if (!permissions?.can("/dashboard/client/roles", "create")) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const parsed = companyRoleFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const role = await prisma.companyRole.create({
    data: {
      ownerId,
      name: parsed.data.name,
      visibleNavHrefs: parsed.data.visibleNavHrefs,
      permissions: withDefaultPermissions(parsed.data.permissions as CompanyRolePermissions),
    },
    include: { companyUsers: { select: { id: true } } },
  });

  return NextResponse.json({ role: serializeCompanyRole(role) }, { status: 201 });
}
