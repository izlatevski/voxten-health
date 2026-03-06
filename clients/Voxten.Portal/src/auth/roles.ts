import type { AccountInfo } from "@azure/msal-browser";

export type AppRole =
  | "Voxten.Admin"
  | "Voxten.Security"
  | "Voxten.Compliance"
  | "Voxten.Clinical"
  | "Voxten.ReadOnly";

export function getUserRoles(account: AccountInfo | null | undefined): string[] {
  const claims = account?.idTokenClaims as { roles?: string[] } | undefined;
  return claims?.roles ?? [];
}

export function hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
  if (requiredRoles.length === 0) return true;
  return requiredRoles.some((role) => userRoles.includes(role));
}
