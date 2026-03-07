import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getChatThreadMessagesFromAcs,
  getThreadParticipants,
  SESSION_ACS_USER_TOKEN_KEY,
  SESSION_ACS_USER_ID_KEY,
  subscribeToAcsIncomingMessages,
  upsertUserIdentityMap,
  type AcsIncomingMessage,
} from "@/lib/chatApi";
import { getAcsTokenForCurrentUser } from "@/auth/acsTokenManager";
import type { CurrentUser } from "@/stores/appStore";

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

interface UseThreadMessagesOptions {
  currentUser: CurrentUser | null;
  selectedThreadId: string;
  onIncomingThreadActivity?: (activity: { threadId: string; content: string }) => void;
}

export function useThreadMessages({
  currentUser,
  selectedThreadId,
  onIncomingThreadActivity,
}: UseThreadMessagesOptions) {
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const liveMessagesRef = useRef<Record<string, ThreadUiMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [remoteMessages, setRemoteMessages] = useState<Record<string, ThreadUiMessage[]>>({});
  const [liveMessages, setLiveMessages] = useState<Record<string, ThreadUiMessage[]>>({});

  useEffect(() => {
    liveMessagesRef.current = liveMessages;
  }, [liveMessages]);

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

  async function ensureSessionAcsToken(options?: { forceRefresh?: boolean }): Promise<string | null> {
    const cached = sessionStorage.getItem(SESSION_ACS_USER_TOKEN_KEY);
    try {
      const resolved = await getAcsTokenForCurrentUser(currentUser, { forceRefresh: options?.forceRefresh });
      return resolved?.token ?? cached ?? null;
    } catch {
      return cached ?? null;
    }
  }

  function appendLiveMessage(threadId: string, message: ThreadUiMessage) {
    setLiveMessages((prev) => ({
      ...prev,
      [threadId]: [...(prev[threadId] || []), message],
    }));
  }

  useEffect(() => {
    let cancelled = false;

    function mapAcsItemsToMessages(items: Awaited<ReturnType<typeof getChatThreadMessagesFromAcs>>): ThreadUiMessage[] {
      const unique = new Map<string, ThreadUiMessage>();
      for (const item of items) {
        const id = item.id || `remote-${Math.random()}`;
        const mapped: ThreadUiMessage = {
          id,
          sender: item.senderDisplayName || item.senderId || "Participant",
          role: "Participant",
          content: item.content || "",
          sortTs: item.createdOnUtc ? new Date(item.createdOnUtc).getTime() : Date.now(),
          timestamp: item.createdOnUtc
            ? new Date(item.createdOnUtc).toLocaleTimeString("en-GB", { hour12: false })
            : "",
          isAI: false,
          governance: {
            compliance: "passed",
            encryption: "AES-256",
            syncStatus: "Synced from ACS",
            auditId: item.id || "message",
          },
        };
        unique.set(id, mapped);
        if (item.id) {
          seenMessageIdsRef.current.add(item.id);
        }
      }
      return Array.from(unique.values());
    }

    function isAcsPermissionError(error: unknown): boolean {
      if (typeof error !== "object" || error === null) return false;
      const maybeError = error as { statusCode?: number; message?: string };
      if (maybeError.statusCode === 403) return true;
      const message = maybeError.message?.toLowerCase() || "";
      return message.includes("permission") || message.includes("403");
    }

    async function loadMessages() {
      if (!selectedThreadId) return;

      const userToken = await ensureSessionAcsToken();
      if (!userToken) {
        if (!cancelled) {
          toast.error("Missing ACS token", { description: "Sign in again to load thread messages." });
        }
        return;
      }

      setLoadingMessages(true);
      try {
        const items = await getChatThreadMessagesFromAcs(selectedThreadId, userToken, 100);
        const mapped = mapAcsItemsToMessages(items);

        if (cancelled) return;

        setRemoteMessages((prev) => ({
          ...prev,
          [selectedThreadId]: mapped,
        }));
        setLiveMessages((prev) => {
          const current = prev[selectedThreadId] || [];
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
            [selectedThreadId]: remaining,
          };
        });
      } catch (error) {
        if (isAcsPermissionError(error)) {
          try {
            if (currentUser?.tenantId && currentUser?.oid) {
              const participants = await getThreadParticipants(currentUser.tenantId, selectedThreadId);
              const me = participants.find((p) => p.entraUserId === currentUser.oid);
              const currentAcsUserId = sessionStorage.getItem(SESSION_ACS_USER_ID_KEY) || "";

              if (me?.acsUserId && me.acsUserId !== currentAcsUserId) {
                await upsertUserIdentityMap({
                  tenantId: currentUser.tenantId,
                  entraUserId: currentUser.oid,
                  acsUserId: me.acsUserId,
                });
              }
            }

            const refreshedToken = await ensureSessionAcsToken({ forceRefresh: true });
            if (!refreshedToken) throw error;

            const retryItems = await getChatThreadMessagesFromAcs(selectedThreadId, refreshedToken, 100);
            if (cancelled) return;

            const retryMapped = mapAcsItemsToMessages(retryItems);
            setRemoteMessages((prev) => ({
              ...prev,
              [selectedThreadId]: retryMapped,
            }));
            setLiveMessages((prev) => {
              const current = prev[selectedThreadId] || [];
              if (current.length === 0) return prev;

              const fetchedIds = new Set(
                retryMapped.map((message) => message.governance.auditId || message.id).filter(Boolean),
              );
              const remaining = current.filter((message) => {
                const key = message.governance.auditId || message.id;
                return !key || !fetchedIds.has(key);
              });

              if (remaining.length === current.length) return prev;
              return {
                ...prev,
                [selectedThreadId]: remaining,
              };
            });
            return;
          } catch {
            // Fall through to the standard error toast below.
          }
        }

        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Failed to load thread messages.";
        toast.error("Could not load messages", { description: message });
      } finally {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      }
    }

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [selectedThreadId, currentUser.oid, currentUser.tenantId, ensureSessionAcsToken]);

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | null = null;

    function asUiMessage(item: AcsIncomingMessage): ThreadUiMessage {
      return {
        id: item.id || `incoming-${Date.now()}`,
        sender: item.senderDisplayName || item.senderId || "Participant",
        role: "Participant",
        content: item.content || "",
        sortTs: item.createdOnUtc ? new Date(item.createdOnUtc).getTime() : Date.now(),
        timestamp: item.createdOnUtc
          ? new Date(item.createdOnUtc).toLocaleTimeString("en-GB", { hour12: false })
          : new Date().toLocaleTimeString("en-GB", { hour12: false }),
        isAI: false,
        governance: {
          compliance: "passed",
          encryption: "AES-256",
          syncStatus: "Live via ACS",
          auditId: item.id || "message",
        },
      };
    }

    async function subscribe() {
      const token = await ensureSessionAcsToken();
      if (!token || disposed) return;

      const currentAcsUserId = sessionStorage.getItem(SESSION_ACS_USER_ID_KEY) || "";

      try {
        unsubscribe = await subscribeToAcsIncomingMessages(
          token,
          (incoming) => {
            if (!incoming.threadId || !incoming.id) return;
            if (incoming.senderId && currentAcsUserId && incoming.senderId === currentAcsUserId) return;
            if (seenMessageIdsRef.current.has(incoming.id)) return;
            seenMessageIdsRef.current.add(incoming.id);

            setRemoteMessages((prev) => {
              const existing = prev[incoming.threadId] || [];
              const existingLive = liveMessagesRef.current[incoming.threadId] || [];
              if (
                existing.some((m) => m.id === incoming.id || m.governance.auditId === incoming.id) ||
                existingLive.some((m) => m.id === incoming.id || m.governance.auditId === incoming.id)
              ) {
                return prev;
              }

              return {
                ...prev,
                [incoming.threadId]: [...existing, asUiMessage(incoming)],
              };
            });

            onIncomingThreadActivity?.({ threadId: incoming.threadId, content: incoming.content || "" });
          },
          () => {
            toast.error("Live chat listener error", { description: "Unable to process incoming ACS message event." });
          },
        );
      } catch (error) {
        if (disposed) return;
        const message = error instanceof Error ? error.message : "Failed to subscribe to ACS notifications.";
        toast.error("Live chat unavailable", { description: message });
      }
    }

    void subscribe();
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [currentUser.oid, currentUser.tenantId, ensureSessionAcsToken, onIncomingThreadActivity]);

  return {
    loadingMessages,
    messages,
    ensureSessionAcsToken,
    appendLiveMessage,
  };
}
