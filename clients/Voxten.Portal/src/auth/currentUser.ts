import type { AccountInfo } from "@azure/msal-browser";
import type { CurrentUser } from "@/stores/appStore";

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    return JSON.parse(decodeBase64Url(parts[1])) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  if (typeof value === "string") {
    return value.split(/[,\s]+/).map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

function initialsFromName(name: string, email: string): string {
  const source = name || email;
  if (!source) return "U";

  const words = source
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function buildCurrentUser(account: AccountInfo | null, jwtToken: string | null): CurrentUser | null {
  if (!account && !jwtToken) return null;
  const tokenClaims = jwtToken ? decodeJwtPayload(jwtToken) : null;
  const idClaims = (account?.idTokenClaims ?? {}) as Record<string, unknown>;

  const displayName =
    readString(idClaims.name) ||
    readString(tokenClaims?.name) ||
    account?.name ||
    "Entra User";

  const email =
    readString(idClaims.preferred_username) ||
    readString(idClaims.upn) ||
    readString(tokenClaims?.preferred_username) ||
    readString(tokenClaims?.upn) ||
    account?.username ||
    "";

  const roles = Array.from(
    new Set([
      ...readStringArray(idClaims.roles),
      ...readStringArray(tokenClaims?.roles),
    ]),
  );

  const scopes = Array.from(
    new Set(readStringArray(tokenClaims?.scp)),
  );

  const jobTitle =
    readString(idClaims.jobTitle) ||
    readString(tokenClaims?.jobTitle) ||
    undefined;

  const oid =
    readString(idClaims.oid) ||
    readString(tokenClaims?.oid) ||
    undefined;

  const tenantId =
    readString(idClaims.tid) ||
    readString(tokenClaims?.tid) ||
    account?.homeAccountId?.split(".")[1] ||
    undefined;

  return {
    displayName,
    email,
    roles,
    scopes,
    jobTitle,
    username: account?.username,
    oid,
    tenantId,
    initials: initialsFromName(displayName, email),
  };
}
