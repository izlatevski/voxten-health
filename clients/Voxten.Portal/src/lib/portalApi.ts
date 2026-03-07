import { fetchWithAuth } from "@/lib/fetchWithAuth";

export interface EntraUserSearchItem {
  id: string;
  displayName: string;
  mail?: string;
  userPrincipalName?: string;
  jobTitle?: string;
}

function baseUrl(): string {
  return (import.meta.env.VITE_PORTAL_API_BASE_URL || "http://localhost:5008").replace(/\/$/, "");
}

export async function searchEntraUsers(query: string, top = 20): Promise<EntraUserSearchItem[]> {
  const endpoint = `${baseUrl()}/api/entra/users?q=${encodeURIComponent(query)}&top=${top}`;
  const response = await fetchWithAuth(endpoint, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Portal API request failed (${response.status}): ${body || response.statusText}`);
  }

  const body = (await response.json()) as { items?: EntraUserSearchItem[] };
  return body.items || [];
}
