import { getApiAccessToken, invalidateApiAccessToken } from "@/auth/tokenManager";

function withAuthHeader(init?: RequestInit, token?: string | null): RequestInit {
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    headers.delete("Authorization");
  }

  return {
    ...init,
    headers,
  };
}

export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let token = await getApiAccessToken();
  if (!token) {
    await new Promise((resolve) => window.setTimeout(resolve, 150));
    token = await getApiAccessToken();
  }

  const first = await fetch(input, withAuthHeader(init, token));
  if (first.status !== 401) {
    return first;
  }

  invalidateApiAccessToken();
  const refreshed = await getApiAccessToken({ forceRefresh: true });
  if (!refreshed) {
    return first;
  }
  return fetch(input, withAuthHeader(init, refreshed));
}
