import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getChatThreadMessages,
} from "@/lib/chatApi";
import { subscribeToThreadMessages, type ThreadMessageRealtimeEvent } from "@/lib/realtime/threadHub";

export interface ThreadUiMessage {
  id: string;
  sender: string;
  role: string;
  content: string;
  timestamp: string;
  sortTs?: number;
  isAI: boolean;
  governance: {
    compliance: "passed" | "flagged" | "blocked" | "redacted";
    encryption: string;
    syncStatus: string;
    auditId: string;
    aiGoverned?: string;
    redactedEntities?: { type: string; rule: string }[];
  };
  priority?: "routine" | "urgent" | "stat";
  type?: "message" | "system" | "blocked";
}

type ComplianceState = ThreadUiMessage["governance"]["compliance"];

function isGuidLike(value?: string | null): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
}

function displaySenderName(displayName?: string | null, senderId?: string | null): string {
  if (displayName?.trim()) return displayName.trim();
  if (senderId?.trim() && !isGuidLike(senderId)) return senderId.trim();
  return "Participant";
}

function normalizeComplianceState(raw?: string): ComplianceState {
  if (raw === "flagged" || raw === "redacted" || raw === "blocked") return raw;
  return "passed";
}

function formatMessageTimestamp(value?: string | number | Date): string {
  if (value == null) {
    return new Date().toLocaleTimeString("en-GB", { hour12: false });
  }

  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return new Date().toLocaleTimeString("en-GB", { hour12: false });
  }

  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();

  if (isSameDay) {
    return date.toLocaleTimeString("en-GB", { hour12: false });
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface UseThreadMessagesOptions {
  selectedThreadId: string;
  onIncomingThreadActivity?: (activity: { threadId: string; content: string; complianceState?: string }) => void;
}

export function useThreadMessages({
  selectedThreadId,
  onIncomingThreadActivity,
}: UseThreadMessagesOptions) {
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [remoteMessages, setRemoteMessages] = useState<Record<string, ThreadUiMessage[]>>({});
  const [liveMessages, setLiveMessages] = useState<Record<string, ThreadUiMessage[]>>({});

  const messages = useMemo(() => {
    const remote = remoteMessages[selectedThreadId] || [];
    const live = liveMessages[selectedThreadId] || [];
    const merged = [...remote, ...live];
    const unique = new Map<string, ThreadUiMessage>();

    for (const message of merged) {
      const key = message.governance.auditId || message.id;
      if (!key) continue;
      if (!unique.has(key)) {
        unique.set(key, message);
      }
    }

    return Array.from(unique.values()).sort((a, b) => (a.sortTs ?? 0) - (b.sortTs ?? 0));
  }, [liveMessages, remoteMessages, selectedThreadId]);

  function appendLiveMessage(threadId: string, message: ThreadUiMessage) {
    setLiveMessages((prev) => ({
      ...prev,
      [threadId]: [...(prev[threadId] || []), message],
    }));
  }

  function mapAcsItemsToMessages(items: Awaited<ReturnType<typeof getChatThreadMessages>>): ThreadUiMessage[] {
    const unique = new Map<string, ThreadUiMessage>();
    for (const item of items) {
      const id = item.id || `remote-${Math.random()}`;
      const compliance = normalizeComplianceState(item.complianceState);
      const mapped: ThreadUiMessage = {
        id,
        sender: displaySenderName(item.senderDisplayName, item.senderId),
        role: "Participant",
        content: item.content || "",
        sortTs: item.createdOnUtc ? new Date(item.createdOnUtc).getTime() : Date.now(),
        timestamp: formatMessageTimestamp(item.createdOnUtc),
        isAI: false,
        governance: {
          compliance,
          encryption: "AES-256",
          syncStatus: "Synced from Communications API",
          auditId: item.auditId || item.id || "message",
        },
        type: item.messageType === "blocked" ? "blocked" : "message",
      };
      unique.set(id, mapped);
    }
    return Array.from(unique.values());
  }

  function applyFetchedMessages(threadId: string, mapped: ThreadUiMessage[]) {
    let latestNewContent = "";
    setRemoteMessages((prev) => {
      const existing = prev[threadId] || [];
      const known = new Set(existing.map((message) => message.governance.auditId || message.id).filter(Boolean));
      const incoming = mapped.filter((message) => {
        const key = message.governance.auditId || message.id;
        return !!key && !known.has(key);
      });
      if (incoming.length > 0) {
        latestNewContent = incoming[incoming.length - 1].content;
      }
      return {
        ...prev,
        [threadId]: mapped,
      };
    });

    setLiveMessages((prev) => {
      const current = prev[threadId] || [];
      if (current.length === 0) return prev;

      const fetchedIds = new Set(
        mapped.map((message) => message.governance.auditId || message.id).filter(Boolean),
      );
      const remaining = current.filter((message) => {
        const key = message.governance.auditId || message.id;
        return !key || !fetchedIds.has(key);
      });

      if (remaining.length === current.length) return prev;
      return {
        ...prev,
        [threadId]: remaining,
      };
    });

    if (latestNewContent) {
      const latestMessage = mapped[mapped.length - 1];
      onIncomingThreadActivity?.({
        threadId,
        content: latestNewContent,
        complianceState: latestMessage?.governance.compliance,
      });
    }
  }

  const loadMessages = useCallback(async (options?: { silent?: boolean }) => {
    if (!selectedThreadId) return;

    if (!options?.silent) {
      setLoadingMessages(true);
    }
    try {
      const items = await getChatThreadMessages(selectedThreadId, 100);
      const mapped = mapAcsItemsToMessages(items);
      applyFetchedMessages(selectedThreadId, mapped);
    } catch (error) {
      if (!options?.silent) {
        const message = error instanceof Error ? error.message : "Failed to load thread messages.";
        toast.error("Could not load messages", { description: message });
      }
    } finally {
      if (!options?.silent) {
        setLoadingMessages(false);
      }
    }
  }, [onIncomingThreadActivity, selectedThreadId]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (cancelled) return;
      await loadMessages();
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [loadMessages]);

  useEffect(() => {
    if (!selectedThreadId) return;

    let disposed = false;
    const intervalMs = 20000;

    const timer = window.setInterval(() => {
      if (disposed) return;
      void loadMessages({ silent: true });
    }, intervalMs);

    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [selectedThreadId, loadMessages]);

  useEffect(() => {
    if (!selectedThreadId) return;

    let disposed = false;
    let unsubscribe: (() => void) | null = null;

    function mapRealtimeEventToMessage(payload: ThreadMessageRealtimeEvent): ThreadUiMessage {
      const compliance = normalizeComplianceState(payload.complianceState);
      return {
        id: payload.messageId || `realtime-${Date.now()}`,
        sender: displaySenderName(payload.senderDisplayName),
        role: "Participant",
        content: payload.content || "",
        sortTs: payload.sentAtUtc ? new Date(payload.sentAtUtc).getTime() : Date.now(),
        timestamp: formatMessageTimestamp(payload.sentAtUtc),
        isAI: false,
        governance: {
          compliance,
          encryption: "AES-256",
          syncStatus: "Live via Communications API",
          auditId: payload.auditId || payload.messageId || "message",
        },
        type: payload.messageType === "blocked" || compliance === "blocked" ? "blocked" : "message",
      };
    }

    async function subscribe() {
      try {
        unsubscribe = await subscribeToThreadMessages(selectedThreadId, (payload) => {
          if (disposed) return;
          const next = mapRealtimeEventToMessage(payload);

          setRemoteMessages((prev) => {
            const existing = prev[payload.threadId] || [];
            if (existing.some((message) =>
              message.id === next.id || message.governance.auditId === next.governance.auditId)) {
              return prev;
            }
            return {
              ...prev,
              [payload.threadId]: [...existing, next],
            };
          });

          onIncomingThreadActivity?.({
            threadId: payload.threadId,
            content: payload.content || "",
            complianceState: payload.complianceState,
          });
        });
      } catch {
        // Keep the polling fallback active when realtime connect fails.
      }
    }

    void subscribe();
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [selectedThreadId, onIncomingThreadActivity]);

  return {
    loadingMessages,
    messages,
    appendLiveMessage,
  };
}
