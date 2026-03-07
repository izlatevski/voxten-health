import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { getApiAccessToken } from "@/auth/tokenManager";

export interface ThreadMessageRealtimeEvent {
  threadId: string;
  messageId: string;
  content: string;
  senderDisplayName?: string;
  senderEntraUserId?: string;
  sentAtUtc: string;
}

export interface ThreadLeftRealtimeEvent {
  threadId: string;
  entraUserId: string;
}

export interface ThreadDeletedRealtimeEvent {
  threadId: string;
  deletedBy: string;
}

export interface ThreadCreatedRealtimeEvent {
  threadId: string;
  topic: string;
  createdByEntraUserId: string;
  createdAtUtc: string;
}

let connection: HubConnection | null = null;
let startPromise: Promise<HubConnection> | null = null;

function resolveHubBaseUrl(): string {
  const configured = (import.meta.env.VITE_CHAT_API_BASE_URL || "http://localhost:5007").replace(/\/$/, "");
  return configured.endsWith("/api") ? configured.slice(0, -4) : configured;
}

async function ensureConnection(): Promise<HubConnection> {
  if (connection && connection.state === HubConnectionState.Connected) {
    return connection;
  }

  if (startPromise) {
    return startPromise;
  }

  const next = new HubConnectionBuilder()
    .withUrl(`${resolveHubBaseUrl()}/hubs/threads`, {
      accessTokenFactory: async () => (await getApiAccessToken()) ?? "",
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  connection = next;
  startPromise = next.start().then(() => next).finally(() => {
    startPromise = null;
  });

  return startPromise;
}

export async function subscribeToThreadMessages(
  threadId: string,
  onMessage: (message: ThreadMessageRealtimeEvent) => void,
): Promise<() => void> {
  const conn = await ensureConnection();
  const handler = (payload: ThreadMessageRealtimeEvent) => {
    if (!payload?.threadId || payload.threadId !== threadId) return;
    onMessage(payload);
  };

  conn.on("messageReceived", handler);
  await conn.invoke("JoinThread", threadId);

  return () => {
    conn.off("messageReceived", handler);
    void conn.invoke("LeaveThread", threadId).catch(() => undefined);
  };
}

export async function subscribeToThreadLifecycle(
  threadIds: string[],
  handlers: {
    onThreadDeleted?: (event: ThreadDeletedRealtimeEvent) => void;
    onThreadLeft?: (event: ThreadLeftRealtimeEvent) => void;
  },
): Promise<() => void> {
  const conn = await ensureConnection();
  const uniqueThreadIds = Array.from(new Set(threadIds.filter(Boolean)));

  const onThreadDeleted = (payload: ThreadDeletedRealtimeEvent) => {
    if (!payload?.threadId) return;
    handlers.onThreadDeleted?.(payload);
  };
  const onThreadLeft = (payload: ThreadLeftRealtimeEvent) => {
    if (!payload?.threadId) return;
    handlers.onThreadLeft?.(payload);
  };

  conn.on("threadDeleted", onThreadDeleted);
  conn.on("threadLeft", onThreadLeft);

  await Promise.all(
    uniqueThreadIds.map((threadId) =>
      conn.invoke("JoinThread", threadId).catch(() => undefined)),
  );

  return () => {
    conn.off("threadDeleted", onThreadDeleted);
    conn.off("threadLeft", onThreadLeft);
    void Promise.all(
      uniqueThreadIds.map((threadId) =>
        conn.invoke("LeaveThread", threadId).catch(() => undefined)),
    );
  };
}

export async function subscribeToUserThreadEvents(handlers: {
  onThreadCreated?: (event: ThreadCreatedRealtimeEvent) => void;
}): Promise<() => void> {
  const conn = await ensureConnection();

  const onThreadCreated = (payload: ThreadCreatedRealtimeEvent) => {
    if (!payload?.threadId) return;
    handlers.onThreadCreated?.(payload);
  };

  conn.on("threadCreated", onThreadCreated);

  return () => {
    conn.off("threadCreated", onThreadCreated);
  };
}
