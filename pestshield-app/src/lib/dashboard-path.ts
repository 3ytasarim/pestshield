import type { Role } from "@/generated/prisma/enums";

const ROLE_DASHBOARD_PATH: Record<Role, string> = {
  ADMIN: "/dashboard/admin",
  TECH: "/dashboard/tech",
  CLIENT: "/dashboard/client",
};

export function getDashboardPathForRole(role: Role): string {
  return ROLE_DASHBOARD_PATH[role];
}
