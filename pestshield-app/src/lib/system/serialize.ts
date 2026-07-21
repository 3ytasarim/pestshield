import type { CompanyRole as PrismaCompanyRole, CompanyUser as PrismaCompanyUser } from "@/generated/prisma";
import type { CompanyPermissionAction } from "@/lib/api-auth";

export type CompanyRolePermissions = Record<string, Partial<Record<CompanyPermissionAction, boolean>>>;

export interface CompanyRole {
  id: string;
  name: string;
  visibleNavHrefs: string[];
  permissions: CompanyRolePermissions;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
  createdAt: string;
}

export function serializeCompanyRole(
  role: PrismaCompanyRole & { companyUsers?: { id: string }[] },
): CompanyRole {
  return {
    id: role.id,
    name: role.name,
    visibleNavHrefs: role.visibleNavHrefs,
    permissions: (role.permissions ?? {}) as CompanyRolePermissions,
    userCount: role.companyUsers?.length ?? 0,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}

export function serializeCompanyUser(
  companyUser: PrismaCompanyUser & { role: PrismaCompanyRole; user: { isActive: boolean } },
): CompanyUser {
  return {
    id: companyUser.id,
    name: companyUser.name,
    email: companyUser.email,
    roleId: companyUser.roleId,
    roleName: companyUser.role.name,
    isActive: companyUser.user.isActive,
    createdAt: companyUser.createdAt.toISOString(),
  };
}
