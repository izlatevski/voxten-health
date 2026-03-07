import { issueAcsTokenForUser, SESSION_ACS_USER_ID_KEY, SESSION_ACS_USER_TOKEN_KEY } from "@/lib/chatApi";

type UserIdentity = {
  oid?: string;
  tenantId?: string;
};

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

function readJwtExp(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const parsed = JSON.parse(decodeBase64Url(payload)) as { exp?: unknown };
    return typeof parsed.exp === "number" ? parsed.exp : null;
  } catch {
    return null;
  }
}

function isExpiringSoon(token: string, skewSeconds = 90): boolean {
  const exp = readJwtExp(token);
  if (!exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return exp <= now + skewSeconds;
}

export function clearAcsTokenCache(): void {
  sessionStorage.removeItem(SESSION_ACS_USER_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_ACS_USER_ID_KEY);
}

export async function getAcsTokenForCurrentUser(
  user: UserIdentity | null | undefined,
  options?: { forceRefresh?: boolean },
): Promise<{ token: string; userId: string } | null> {
  const token = sessionStorage.getItem(SESSION_ACS_USER_TOKEN_KEY);
  const userId = sessionStorage.getItem(SESSION_ACS_USER_ID_KEY) || "";

  if (!options?.forceRefresh && token && !isExpiringSoon(token)) {
    return { token, userId };
  }

  if (!user?.tenantId || !user?.oid) {
    return null;
  }

  const issued = await issueAcsTokenForUser({
    tenantId: user.tenantId,
    entraUserId: user.oid,
    includeVoip: false,
  });

  sessionStorage.setItem(SESSION_ACS_USER_TOKEN_KEY, issued.token);
  sessionStorage.setItem(SESSION_ACS_USER_ID_KEY, issued.userId);
  return { token: issued.token, userId: issued.userId };
}
