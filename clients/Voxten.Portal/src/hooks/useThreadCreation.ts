import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createChatThread,
  ensureAcsUserIdForEntra,
} from "@/lib/chatApi";
import { getAcsTokenForCurrentUser } from "@/auth/acsTokenManager";
import { searchEntraUsers, type EntraUserSearchItem } from "@/lib/portalApi";
import type { CurrentUser } from "@/stores/appStore";

interface UseThreadCreationOptions {
  currentUser: CurrentUser | null;
  onThreadCreated: (threadId: string) => Promise<void> | void;
}

export function useThreadCreation({ currentUser, onThreadCreated }: UseThreadCreationOptions) {
  const [creatingThread, setCreatingThread] = useState(false);
  const [showNewThreadPanel, setShowNewThreadPanel] = useState(false);
  const [newThreadTopic, setNewThreadTopic] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<EntraUserSearchItem[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<EntraUserSearchItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function runSearch() {
      const query = userSearchQuery.trim();
      if (query.length < 2 || !showNewThreadPanel) {
        setUserSearchResults([]);
        return;
      }

      setSearchingUsers(true);
      try {
        const users = await searchEntraUsers(query, 20);
        if (cancelled) return;
        const filtered = users.filter((u) => u.id !== currentUser?.oid);
        setUserSearchResults(filtered);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Failed to search Entra users.";
        toast.error("User search failed", { description: message });
      } finally {
        if (!cancelled) {
          setSearchingUsers(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      void runSearch();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [userSearchQuery, showNewThreadPanel, currentUser?.oid]);

  function addUserToThread(user: EntraUserSearchItem) {
    setSelectedUsers((prev) => {
      if (prev.some((u) => u.id === user.id)) return prev;
      return [...prev, user];
    });
  }

  function removeUserFromThread(userId: string) {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  async function handleCreateThread() {
    if (!currentUser?.oid || !currentUser?.tenantId) {
      toast.error("Missing user context");
      return;
    }

    const acs = await getAcsTokenForCurrentUser(currentUser);
    const creatorToken = acs?.token ?? null;
    if (!creatorToken) {
      toast.error("Missing ACS token", { description: "Sign in again to provision your chat token." });
      return;
    }

    const topic = newThreadTopic.trim();
    if (!topic) {
      toast.error("Thread topic is required");
      return;
    }

    setCreatingThread(true);
    try {
      let currentAcsUserId = acs?.userId || "";
      if (!currentAcsUserId) {
        currentAcsUserId = await ensureAcsUserIdForEntra(currentUser.tenantId, currentUser.oid);
      }

      const selectedWithAcsIds = await Promise.all(
        selectedUsers.map(async (user) => ({
          user,
          acsUserId: await ensureAcsUserIdForEntra(currentUser.tenantId!, user.id),
        })),
      );

      const participants = [
        {
          communicationUserId: currentAcsUserId,
          entraUserId: currentUser.oid,
          displayName: currentUser.displayName,
          role: currentUser.roles[0] || currentUser.jobTitle || "User",
        },
        ...selectedWithAcsIds.map(({ user, acsUserId }) => ({
          communicationUserId: acsUserId,
          entraUserId: user.id,
          displayName: user.displayName,
          role: user.jobTitle || "Participant",
        })),
      ];

      const created = await createChatThread({
        creatorToken,
        topic,
        tenantId: currentUser.tenantId,
        participants,
      });

      await onThreadCreated(created.threadId);
      setShowNewThreadPanel(false);
      setNewThreadTopic("");
      setUserSearchQuery("");
      setSelectedUsers([]);
      setUserSearchResults([]);
      toast.success("Thread created");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create thread.";
      toast.error("Create thread failed", { description: message });
    } finally {
      setCreatingThread(false);
    }
  }

  return {
    creatingThread,
    showNewThreadPanel,
    setShowNewThreadPanel,
    newThreadTopic,
    setNewThreadTopic,
    userSearchQuery,
    setUserSearchQuery,
    searchingUsers,
    userSearchResults,
    selectedUsers,
    addUserToThread,
    removeUserFromThread,
    handleCreateThread,
  };
}
