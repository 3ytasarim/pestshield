/**
 * ipm-backend'deki UserRole enum'ıyla birebir eşleşir
 * (bkz. ipm-backend/src/common/enums/user-role.enum.ts).
 */
export type UserRole = "admin" | "tech" | "client";

export type ClientCompanyStatus = "pending_approval" | "active" | "suspended";
export type LicenseStatus = "issued" | "active" | "expired" | "revoked";

export interface ClientCompanySummary {
  status: ClientCompanyStatus;
}

export interface LicenseSummary {
  status: LicenseStatus;
  expiresAt: string | null;
}

const ROLE_DASHBOARD_PATH: Record<Exclude<UserRole, "client">, string> = {
  admin: "/dashboard/admin",
  tech: "/dashboard/tech",
};

export function getDashboardPathForRole(role: UserRole): string {
  if (role !== "client") {
    return ROLE_DASHBOARD_PATH[role];
  }
  return "/dashboard/client";
}

/**
 * client rolü için sadece role bakmak yetmez: firma onayı ve lisans
 * durumu login sonrası nereye yönlendirileceğini belirler.
 */
export function getClientDestination(
  company: ClientCompanySummary,
  licenses: LicenseSummary[],
): string {
  if (company.status !== "active") {
    return "/company/pending";
  }

  const hasActiveLicense = licenses.some(
    (license) =>
      license.status === "active" &&
      license.expiresAt !== null &&
      new Date(license.expiresAt).getTime() > Date.now(),
  );

  return hasActiveLicense ? "/dashboard/client" : "/company/activate-license";
}
