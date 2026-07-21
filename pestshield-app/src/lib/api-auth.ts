import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/** CLIENT rolündeki firma hesapları için API route yetkilendirmesi — kiracı verisini `ownerId` ile izole eder. */
export async function requireClientOwner(): Promise<
  { ownerId: string; error: null } | { ownerId: null; error: NextResponse }
> {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") {
    return { ownerId: null, error: NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 }) };
  }
  return { ownerId: session.user.id, error: null };
}

/** TECH rolündeki saha personeli için API route yetkilendirmesi — gerçek Technician kaydına (ve onun firma ownerId'sine) çözümler. */
export async function requireTechnician(): Promise<
  { technicianId: string; ownerId: string; error: null } | { technicianId: null; ownerId: null; error: NextResponse }
> {
  const session = await auth();
  if (!session?.user || session.user.role !== "TECH") {
    return { technicianId: null, ownerId: null, error: NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 }) };
  }
  const technician = await prisma.technician.findUnique({ where: { userId: session.user.id } });
  if (!technician) {
    return { technicianId: null, ownerId: null, error: NextResponse.json({ message: "Teknisyen kaydı bulunamadı." }, { status: 403 }) };
  }
  return { technicianId: technician.id, ownerId: technician.ownerId, error: null };
}

/** CLIENT (firma) veya TECH (o firmanın teknisyeni) rolündeki kullanıcılar için ortak `ownerId` çözümlemesi — okuma amaçlı, paylaşılan uçlarda kullanılır. */
export async function requireClientOrTechOwner(): Promise<
  { ownerId: string; error: null } | { ownerId: null; error: NextResponse }
> {
  const session = await auth();
  if (!session?.user) {
    return { ownerId: null, error: NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 }) };
  }
  if (session.user.role === "CLIENT") {
    return { ownerId: session.user.id, error: null };
  }
  if (session.user.role === "TECH") {
    const technician = await prisma.technician.findUnique({ where: { userId: session.user.id } });
    if (!technician) {
      return { ownerId: null, error: NextResponse.json({ message: "Teknisyen kaydı bulunamadı." }, { status: 403 }) };
    }
    return { ownerId: technician.ownerId, error: null };
  }
  return { ownerId: null, error: NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 }) };
}

/** CUSTOMER rolündeki müşteri portalı girişleri için API route yetkilendirmesi — gerçek Customer kaydına (ve onun firma ownerId'sine) çözümler. */
export async function requireCustomerOwner(): Promise<
  { customerId: string; ownerId: string; error: null } | { customerId: null; ownerId: null; error: NextResponse }
> {
  const session = await auth();
  if (!session?.user || session.user.role !== "CUSTOMER") {
    return { customerId: null, ownerId: null, error: NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 }) };
  }
  const customer = await prisma.customer.findUnique({ where: { userId: session.user.id } });
  if (!customer) {
    return { customerId: null, ownerId: null, error: NextResponse.json({ message: "Müşteri kaydı bulunamadı." }, { status: 403 }) };
  }
  return { customerId: customer.id, ownerId: customer.ownerId, error: null };
}

export type CompanyPermissionAction = "view" | "create" | "edit" | "delete";

export interface SessionPermissions {
  ownerId: string;
  actingUserId: string;
  /** Alt kullanıcının atanmış CompanyRole id'si, kiracı sahibi için `null`. */
  companyRoleId: string | null;
  isOwner: boolean;
  /** `null` = kiracı sahibi, her şeyi görür. */
  visibleNavHrefs: string[] | null;
  can(href: string, action: CompanyPermissionAction): boolean;
}

/**
 * CLIENT oturumunun (sahip veya alt kullanıcı) sidebar görünürlüğünü ve modül
 * bazlı eylem izinlerini çözer. `companyRoleId` her zaman CANLI DB'den okunur
 * (JWT'de önbelleklenmez) — böylece bir rol düzenlendiğinde zaten oturum açmış
 * alt kullanıcılara bir sonraki istekte hemen yansır.
 */
export async function getSessionPermissions(): Promise<SessionPermissions | null> {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") {
    return null;
  }

  const { id: ownerId, actingUserId, companyRoleId } = session.user;

  if (!companyRoleId) {
    return {
      ownerId,
      actingUserId,
      companyRoleId: null,
      isOwner: true,
      visibleNavHrefs: null,
      can: () => true,
    };
  }

  const role = await prisma.companyRole.findUnique({ where: { id: companyRoleId } });
  if (!role) {
    return {
      ownerId,
      actingUserId,
      companyRoleId,
      isOwner: false,
      visibleNavHrefs: [],
      can: () => false,
    };
  }

  const permissions = role.permissions as Record<
    string,
    Partial<Record<CompanyPermissionAction, boolean>>
  >;

  return {
    ownerId,
    actingUserId,
    companyRoleId,
    isOwner: false,
    visibleNavHrefs: role.visibleNavHrefs,
    can(href, action) {
      if (!role.visibleNavHrefs.includes(href)) return false;
      if (action === "view") return true;
      return permissions[href]?.[action] ?? true;
    },
  };
}
