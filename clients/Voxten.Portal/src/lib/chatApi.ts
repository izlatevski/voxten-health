import { ChatClient } from "@azure/communication-chat";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export type ComplianceVerdict = "allowed" | "redacted" | "blocked";

export interface IssueAcsTokenRequest {
  includeVoip?: boolean;
  tenantId: string;
  entraUserId: string;
}

export interface IssueAcsTokenResponse {
  userId: string;
  token: string;
  expiresOn: string;
}

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

export interface UpsertUserIdentityMapRequest {
  tenantId: string;
  entraUserId: string;
  acsUserId: string;
}

export interface ChatThreadMessageItem {
  id: string;
  content: string;
  senderDisplayName?: string;
  senderId?: string;
  createdOnUtc?: string;
}

export interface AcsThreadItem {
  id: string;
  topic?: string;
  createdOnUtc?: string;
}

export interface AcsIncomingMessage {
  id: string;
  threadId: string;
  content: string;
  senderDisplayName?: string;
  senderId?: string;
  createdOnUtc?: string;
}

function extractAcsTextMessage(payload: any): string {
  const fromMessage = typeof payload?.message === "string" ? payload.message : "";
  const fromContentMessage = typeof payload?.content?.message === "string" ? payload.content.message : "";
  const fromContent = typeof payload?.content === "string" ? payload.content : "";
  const fromText = typeof payload?.text === "string" ? payload.text : "";
  return (fromMessage || fromContentMessage || fromContent || fromText || "").trim();
}

export interface CreateChatThreadRequest {
  creatorToken: string;
  topic: string;
  tenantId: string;
  participants: Array<{
    communicationUserId: string;
    entraUserId: string;
    displayName?: string;
    role?: string;
  }>;
}

export interface CreateChatThreadResponse {
  threadId: string;
}

export interface SendChatMessageRequest {
  senderToken: string;
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

export const SESSION_ACS_USER_TOKEN_KEY = "voxten.chat.acs.token";
export const SESSION_ACS_USER_ID_KEY = "voxten.chat.acs.userId";

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

export async function issueAcsTokenForUser(payload: IssueAcsTokenRequest): Promise<IssueAcsTokenResponse> {
  const response = await fetchWithAuth(apiUrl("/chat/tokens"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return readJsonOrError<IssueAcsTokenResponse>(response);
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

export async function sendChatMessage(payload: SendChatMessageRequest): Promise<SendChatMessageResponse> {
  const response = await fetchWithAuth(apiUrl("/chat/messages"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return readJsonOrError<SendChatMessageResponse>(response);
}

export async function getChatThreadMessagesFromAcs(threadId: string, userToken: string, pageSize = 100): Promise<ChatThreadMessageItem[]> {
  const endpoint = import.meta.env.VITE_ACS_ENDPOINT;
  if (!endpoint) {
    throw new Error("VITE_ACS_ENDPOINT is not configured.");
  }

  const chatClient = new ChatClient(endpoint, new AzureCommunicationTokenCredential(userToken));
  const threadClient = chatClient.getChatThreadClient(threadId);
  const items: ChatThreadMessageItem[] = [];

  for await (const message of threadClient.listMessages()) {
    const content = extractAcsTextMessage(message);
    if (!content) {
      continue;
    }

    const sender = (message as any).senderCommunicationIdentifier;
    items.push({
      id: message.id || "",
      content,
      senderDisplayName: message.senderDisplayName || undefined,
      senderId: sender?.communicationUserId || sender?.phoneNumber || sender?.rawId || undefined,
      createdOnUtc: message.createdOn ? new Date(message.createdOn).toISOString() : undefined,
    });

    if (items.length >= pageSize) {
      break;
    }
  }

  return items.sort((a, b) => {
    const left = a.createdOnUtc ? new Date(a.createdOnUtc).getTime() : 0;
    const right = b.createdOnUtc ? new Date(b.createdOnUtc).getTime() : 0;
    return left - right;
  });
}

export async function getUserChatThreadsFromAcs(userToken: string, pageSize = 200): Promise<AcsThreadItem[]> {
  const endpoint = import.meta.env.VITE_ACS_ENDPOINT;
  if (!endpoint) {
    throw new Error("VITE_ACS_ENDPOINT is not configured.");
  }

  const chatClient = new ChatClient(endpoint, new AzureCommunicationTokenCredential(userToken));
  const items: AcsThreadItem[] = [];

  for await (const thread of chatClient.listChatThreads()) {
    items.push({
      id: thread.id,
      topic: thread.topic || undefined,
      createdOnUtc: thread.createdOn ? new Date(thread.createdOn).toISOString() : undefined,
    });

    if (items.length >= pageSize) {
      break;
    }
  }

  return items;
}

export async function deleteChatThreadFromAcs(threadId: string, userToken: string): Promise<void> {
  const endpoint = import.meta.env.VITE_ACS_ENDPOINT;
  if (!endpoint) {
    throw new Error("VITE_ACS_ENDPOINT is not configured.");
  }

  const chatClient = new ChatClient(endpoint, new AzureCommunicationTokenCredential(userToken));
  await chatClient.deleteChatThread(threadId);
}

export async function subscribeToAcsIncomingMessages(
  userToken: string,
  onMessage: (message: AcsIncomingMessage) => void,
  onError?: (error: unknown) => void,
): Promise<() => void> {
  const endpoint = import.meta.env.VITE_ACS_ENDPOINT;
  if (!endpoint) {
    throw new Error("VITE_ACS_ENDPOINT is not configured.");
  }

  const chatClient = new ChatClient(endpoint, new AzureCommunicationTokenCredential(userToken));

  const handler = (event: any) => {
    try {
      const content = extractAcsTextMessage(event);
      if (!content) {
        return;
      }

      const sender = event?.senderCommunicationIdentifier;
      onMessage({
        id: event?.id || event?.messageId || "",
        threadId: event?.threadId || event?.chatThreadId || "",
        content,
        senderDisplayName: event?.senderDisplayName || undefined,
        senderId: sender?.communicationUserId || sender?.phoneNumber || sender?.rawId || undefined,
        createdOnUtc: event?.createdOn ? new Date(event.createdOn).toISOString() : undefined,
      });
    } catch (error) {
      onError?.(error);
    }
  };

  await chatClient.startRealtimeNotifications();
  chatClient.on("chatMessageReceived", handler);

  return () => {
    chatClient.off("chatMessageReceived", handler);
    void chatClient.stopRealtimeNotifications();
  };
}

export async function createChatThread(payload: CreateChatThreadRequest): Promise<CreateChatThreadResponse> {
  const response = await fetchWithAuth(apiUrl("/chat/threads"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return readJsonOrError<CreateChatThreadResponse>(response);
}

export async function getMappedAcsUserId(tenantId: string, entraUserId: string): Promise<string | null> {
  const endpoint = apiUrl(`/mappings/users/${encodeURIComponent(entraUserId)}?tenantId=${encodeURIComponent(tenantId)}`);
  const response = await fetchWithAuth(endpoint, { headers: { Accept: "application/json" } });

  if (response.status === 404) {
    return null;
  }

  const body = await readJsonOrError<{ acsUserId?: string }>(response);
  return body.acsUserId || null;
}

export async function upsertUserIdentityMap(payload: UpsertUserIdentityMapRequest): Promise<void> {
  const response = await fetchWithAuth(apiUrl("/mappings/users"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await readJsonOrError<Record<string, never>>(response);
}

export async function ensureAcsUserIdForEntra(tenantId: string, entraUserId: string): Promise<string> {
  const mapped = await getMappedAcsUserId(tenantId, entraUserId);
  if (mapped) return mapped;

  const issued = await issueAcsTokenForUser({
    tenantId,
    entraUserId,
    includeVoip: false,
  });

  return issued.userId;
}
