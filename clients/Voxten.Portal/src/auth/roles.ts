import type { AccountInfo } from "@azure/msal-browser";
import type { CurrentUser } from "@/stores/appStore";

export type AppRole =
  | "Admin"
  | "Security"
  | "Compliance"
  | "Clinician"
  | "ReadOnly";

const PORTAL_ACCESS_ROLES: AppRole[] = [
  "Admin",
  "Security",
  "Compliance",
  "Clinician",
  "ReadOnly",
];

function normalizeRole(role: string): AppRole | null {
  const value = role.trim();
  if (!value) return null;

  const canonical = value
    .replace(/^Voxten\./i, "")
    .replace(/[\s_.-]+/g, "")
    .toLowerCase();

  if (canonical === "admin") return "Admin";
  if (canonical === "security") return "Security";
  if (canonical === "compliance" || canonical === "complianceadmin") return "Compliance";
  if (canonical === "clinical" || canonical === "clinican" || canonical === "clinician") return "Clinician";
  if (canonical === "readonly" || canonical === "read") return "ReadOnly";

  return null;
}

function normalizedRoleSet(userRoles: string[]): Set<AppRole> {
  return new Set(
    userRoles
      .map(normalizeRole)
      .filter((role): role is AppRole => role !== null),
  );
}

export function getUserRoles(account: AccountInfo | null | undefined): string[] {
  const claims = account?.idTokenClaims as { roles?: string[] } | undefined;
  return claims?.roles ?? [];
}

export function hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
  if (requiredRoles.length === 0) return true;
  const actual = normalizedRoleSet(userRoles);
  return requiredRoles
    .map(normalizeRole)
    .some((role) => role !== null && actual.has(role));
}

export function hasPortalAccessRole(userRoles: string[]): boolean {
  const actual = normalizedRoleSet(userRoles);
  return PORTAL_ACCESS_ROLES.some((role) => actual.has(role));
}

export function isPrivilegedPortalRole(userRoles: string[]): boolean {
  const actual = normalizedRoleSet(userRoles);
  return actual.has("Admin") || actual.has("Compliance") || actual.has("Security");
}

export function isClinicianOnlyRole(userRoles: string[]): boolean {
  const actual = normalizedRoleSet(userRoles);
  return actual.has("Clinician") && !isPrivilegedPortalRole(userRoles);
}

export function isPrivilegedPortalUser(user: CurrentUser | null | undefined): boolean {
  const roles = user?.roles ?? [];
  return isPrivilegedPortalRole(roles);
}

export function isClinicianOnlyUser(user: CurrentUser | null | undefined): boolean {
  if (!user) return false;
  return isClinicianOnlyRole(user.roles);
}
