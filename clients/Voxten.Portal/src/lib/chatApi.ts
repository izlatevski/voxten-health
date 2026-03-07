import { fetchWithAuth } from "@/lib/fetchWithAuth";

export type ComplianceVerdict = "allowed" | "redacted" | "blocked";

export interface UserThreadIndexItem {
  threadId: string;
  topic: string;
  lastMessagePreview: string;
  lastMessageAtUtc: string;
  unreadCount: number;
  status: string;
  complianceState: string;
}

export interface ThreadParticipant {
  entraUserId: string;
  acsUserId: string;
  displayName: string;
  role: string;
  joinedUtc: string;
}

export interface ChatThreadMessageItem {
  id: string;
  content: string;
  senderDisplayName?: string;
  senderId?: string;
  createdOnUtc?: string;
}

export interface ThreadMetadata {
  tenantId: string;
  threadId: string;
  topic: string;
  createdByEntraUserId: string;
  createdUtc: string;
  updatedUtc: string;
}

export interface CreateChatThreadRequest {
  creatorToken?: string;
  topic: string;
  tenantId: string;
  participants: Array<{
    communicationUserId?: string;
    entraUserId: string;
    displayName?: string;
    role?: string;
  }>;
}

export interface CreateChatThreadResponse {
  threadId: string;
}

export interface SendChatMessageRequest {
  senderToken?: string;
  threadId: string;
  content: string;
  senderDisplayName?: string;
  tenantId?: string;
  senderEntraUserId?: string;
  complianceState?: string;
}

export interface SendChatMessageResponse {
  messageId: string;
  sentAt: string;
}

function baseUrl(): string {
  return (import.meta.env.VITE_CHAT_API_BASE_URL || "http://localhost:5007").replace(/\/$/, "");
}

function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (baseUrl().endsWith("/api")) {
    return `${baseUrl()}${normalizedPath}`;
  }
  return `${baseUrl()}/api${normalizedPath}`;
}

async function readJsonOrError<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Communications API request failed (${response.status}): ${body || response.statusText}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export async function getThreadsForUser(tenantId: string, entraUserId: string, pageSize = 50): Promise<UserThreadIndexItem[]> {
  const endpoint = apiUrl(`/users/${encodeURIComponent(entraUserId)}/threads?tenantId=${encodeURIComponent(tenantId)}&pageSize=${pageSize}`);
  const response = await fetchWithAuth(endpoint, {
    headers: { Accept: "application/json" },
  });

  const body = await readJsonOrError<{ items: UserThreadIndexItem[] }>(response);
  return body.items || [];
}

export async function getThreadParticipants(tenantId: string, threadId: string): Promise<ThreadParticipant[]> {
  const endpoint = apiUrl(`/threads/${encodeURIComponent(threadId)}/participants?tenantId=${encodeURIComponent(tenantId)}`);
  const response = await fetchWithAuth(endpoint, {
    headers: { Accept: "application/json" },
  });

  const body = await readJsonOrError<{ items: ThreadParticipant[] }>(response);
  return body.items || [];
}

export async function getThreadMetadata(tenantId: string, threadId: string): Promise<ThreadMetadata | null> {
  const endpoint = apiUrl(`/threads/${encodeURIComponent(threadId)}/metadata?tenantId=${encodeURIComponent(tenantId)}`);
  const response = await fetchWithAuth(endpoint, {
    headers: { Accept: "application/json" },
  });

  if (response.status === 404) {
    return null;
  }

  return readJsonOrError<ThreadMetadata>(response);
}

export async function getChatThreadMessages(threadId: string, pageSize = 100): Promise<ChatThreadMessageItem[]> {
  const endpoint = apiUrl(`/chat/threads/${encodeURIComponent(threadId)}/messages?pageSize=${pageSize}`);
  const response = await fetchWithAuth(endpoint, {
    headers: { Accept: "application/json" },
  });

  const body = await readJsonOrError<{ items: ChatThreadMessageItem[] }>(response);
  return body.items || [];
}

export async function sendChatMessage(payload: SendChatMessageRequest): Promise<SendChatMessageResponse> {
  const response = await fetchWithAuth(apiUrl("/chat/messages"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return readJsonOrError<SendChatMessageResponse>(response);
}

export async function createChatThread(payload: CreateChatThreadRequest): Promise<CreateChatThreadResponse> {
  const response = await fetchWithAuth(apiUrl("/chat/threads"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return readJsonOrError<CreateChatThreadResponse>(response);
}

export async function leaveChatThread(threadId: string, tenantId: string): Promise<void> {
  const endpoint = apiUrl(`/chat/threads/${encodeURIComponent(threadId)}/leave?tenantId=${encodeURIComponent(tenantId)}`);
  const response = await fetchWithAuth(endpoint, { method: "POST" });
  await readJsonOrError<Record<string, never>>(response);
}

export async function deleteChatThread(threadId: string, tenantId: string): Promise<void> {
  const endpoint = apiUrl(`/chat/threads/${encodeURIComponent(threadId)}?tenantId=${encodeURIComponent(tenantId)}`);
  const response = await fetchWithAuth(endpoint, { method: "DELETE" });
  await readJsonOrError<Record<string, never>>(response);
}
