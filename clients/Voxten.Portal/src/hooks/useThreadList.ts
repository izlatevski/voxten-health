import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { getThreadParticipants, getThreadsForUser, type ThreadParticipant } from "@/lib/chatApi";
import type { CurrentUser } from "@/stores/appStore";

export interface ThreadListItem {
  id: string;
  title: string;
  participants: { name: string; role: string }[];
  channel: "chat" | "voice" | "email" | "ai";
  governance: "compliant" | "flagged" | "violation";
  flags: number;
  lastActivity: string;
  unread: number;
  preview: string;
}

function mapComplianceState(value: string): ThreadListItem["governance"] {
  if (value === "blocked") return "violation";
  if (value === "flagged" || value === "redacted") return "flagged";
  return "compliant";
}

function formatRelativeTime(isoValue: string): string {
  const timestamp = new Date(isoValue).getTime();
  if (!Number.isFinite(timestamp)) return "just now";
  const diffMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function threadFromIndex(item: {
  threadId: string;
  topic: string;
  lastMessagePreview: string;
  lastMessageAtUtc: string;
  unreadCount: number;
  complianceState: string;
}): ThreadListItem {
  return {
    id: item.threadId,
    title: item.topic || "Untitled Thread",
    participants: [],
    channel: "chat",
    governance: mapComplianceState(item.complianceState),
    flags: item.complianceState === "flagged" ? 1 : 0,
    lastActivity: formatRelativeTime(item.lastMessageAtUtc),
    unread: item.unreadCount,
    preview: item.lastMessagePreview || "No messages yet",
  };
}

function participantToLabel(participant: ThreadParticipant): { name: string; role: string } {
  return {
    name: participant.displayName || participant.entraUserId,
    role: participant.role || "Participant",
  };
}

export function useThreadList(currentUser: CurrentUser | null) {
  const selectedThreadIdRef = useRef<string>("");
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [selectedThread, setSelectedThread] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [threadParticipants, setThreadParticipants] = useState<Record<string, { name: string; role: string }[]>>({});

  const thread = useMemo(
    () => threads.find((t) => t.id === selectedThread) ?? threads[0] ?? null,
    [threads, selectedThread],
  );
  const selectedThreadId = thread?.id ?? "";

  useEffect(() => {
    selectedThreadIdRef.current = selectedThreadId;
  }, [selectedThreadId]);

  const reloadThreadsForCurrentUser = useCallback(async () => {
    if (!currentUser?.oid || !currentUser.tenantId) {
      setThreads([]);
      setSelectedThread("");
      return;
    }

    setLoadingThreads(true);
    try {
      const indexed = await getThreadsForUser(currentUser.tenantId, currentUser.oid, 50);
      if (indexed.length === 0) {
        setThreads([]);
        setSelectedThread("");
        return;
      }

      const nextThreads = indexed.map(threadFromIndex);
      setThreads(nextThreads);
      setSelectedThread((prev) =>
        prev && nextThreads.some((t) => t.id === prev)
          ? prev
          : nextThreads[0].id,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load thread index.";
      toast.error("Could not load threads from API", { description: message });
      setThreads([]);
      setSelectedThread("");
    } finally {
      setLoadingThreads(false);
    }
  }, [currentUser?.oid, currentUser?.tenantId]);

  useEffect(() => {
    void reloadThreadsForCurrentUser();
  }, [reloadThreadsForCurrentUser]);

  useEffect(() => {
    let cancelled = false;

    async function loadParticipants() {
      if (!selectedThreadId || !currentUser?.tenantId) {
        return;
      }

      try {
        const participants = await getThreadParticipants(currentUser.tenantId, selectedThreadId);
        if (cancelled) return;
        setThreadParticipants((prev) => ({
          ...prev,
          [selectedThreadId]: participants.map(participantToLabel),
        }));
      } catch {
        // Keep UI stable when participant metadata is not yet available.
      }
    }

    void loadParticipants();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.tenantId, selectedThreadId]);

  const onIncomingThreadActivity = useCallback((activity: { threadId: string; content: string }) => {
    setThreads((prev) =>
      prev.map((item) =>
        item.id !== activity.threadId
          ? item
          : {
              ...item,
              preview: activity.content || item.preview,
              lastActivity: "just now",
              unread: selectedThreadIdRef.current === activity.threadId ? item.unread : item.unread + 1,
            },
      ),
    );
  }, []);

  return {
    threads,
    selectedThread,
    setSelectedThread,
    loadingThreads,
    threadParticipants,
    thread,
    selectedThreadId,
    onIncomingThreadActivity,
    reloadThreadsForCurrentUser,
  };
}
