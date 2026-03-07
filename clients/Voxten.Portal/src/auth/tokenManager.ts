import {loginRequest, msalInstance, SESSION_JWT_KEY} from "@/auth/entra";

type AccessTokenCache = {
  token: string;
  expiresAtEpochSeconds: number;
};

let inMemoryToken: AccessTokenCache | null = null;
let inFlightTokenRequest: Promise<string | null> | null = null;
let inFlightRedirectHandling: Promise<void> | null = null;
let inFlightInitialization: Promise<void> | null = null;

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

function setCachedToken(token: string): void {
  const exp = readJwtExp(token) ?? Number.MAX_SAFE_INTEGER;
  inMemoryToken = {
    token,
    expiresAtEpochSeconds: exp,
  };
  sessionStorage.setItem(SESSION_JWT_KEY, token);
}

function getCachedToken(): string | null {
  if (inMemoryToken && inMemoryToken.expiresAtEpochSeconds > Math.floor(Date.now() / 1000) + 90) {
    return inMemoryToken.token;
  }

  const sessionToken = sessionStorage.getItem(SESSION_JWT_KEY);
  if (!sessionToken || isExpiringSoon(sessionToken)) {
    return null;
  }

  setCachedToken(sessionToken);
  return sessionToken;
}

function readTokenSecret(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as { secret?: string };
    return typeof parsed.secret === "string" && parsed.secret ? parsed.secret : null;
  } catch {
    return null;
  }
}

function readBestAccessTokenFromMsalStorage(): string | null {
  let best: { token: string; exp: number } | null = null;
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i);
    if (!key || !key.includes("-accesstoken-")) continue;
    const raw = sessionStorage.getItem(key);
    if (!raw) continue;
    const token = readTokenSecret(raw);
    if (!token || isExpiringSoon(token)) continue;
    const exp = readJwtExp(token) ?? Number.MAX_SAFE_INTEGER;
    if (!best || exp > best.exp) {
      best = { token, exp };
    }
  }
  if (!best) return null;
  setCachedToken(best.token);
  return best.token;
}

async function ensureRedirectHandled(): Promise<void> {
  if (!inFlightRedirectHandling) {
    inFlightRedirectHandling = msalInstance
      .handleRedirectPromise()
      .then((result) => {
        if (result?.account) {
          msalInstance.setActiveAccount(result.account);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        inFlightRedirectHandling = null;
      });
  }

  await inFlightRedirectHandling;
}

async function ensureMsalInitialized(): Promise<void> {
  if (!inFlightInitialization) {
    inFlightInitialization = msalInstance
      .initialize()
      .catch(() => undefined)
      .finally(() => {
        inFlightInitialization = null;
      });
  }

  await inFlightInitialization;
}

function resolveAccount() {
  return msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0] ?? null;
}

async function acquireToken(forceRefresh: boolean): Promise<string | null> {
  const account = resolveAccount();
  if (!account) return null;

  const result = await msalInstance.acquireTokenSilent({
    ...loginRequest,
    account,
    forceRefresh,
  });

  const token = result.accessToken || null;
  if (!token || isExpiringSoon(token)) {
    return null;
  }

  setCachedToken(token);
  return token;
}

export async function getApiAccessToken(options?: { forceRefresh?: boolean }): Promise<string | null> {
  const forceRefresh = options?.forceRefresh === true;
  if (!forceRefresh) {
    const cached = getCachedToken();
    if (cached) {
      return cached;
    }
  }
  else {
    inFlightTokenRequest = null;
  }

  await ensureMsalInitialized();
  await ensureRedirectHandled();

  if (!inFlightTokenRequest) {
    inFlightTokenRequest = acquireToken(forceRefresh)
      .catch(() => {
          return readBestAccessTokenFromMsalStorage();
      })
      .finally(() => {
        inFlightTokenRequest = null;
      });
  }

  const resolved = await inFlightTokenRequest;
  if (resolved) return resolved;

  return readBestAccessTokenFromMsalStorage();
}

export function invalidateApiAccessToken(): void {
  inMemoryToken = null;
  sessionStorage.removeItem(SESSION_JWT_KEY);
}
