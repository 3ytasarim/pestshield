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
