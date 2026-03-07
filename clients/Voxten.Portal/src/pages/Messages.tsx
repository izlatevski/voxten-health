import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  deleteChatThread,
  getThreadParticipants,
  getThreadMetadata,
  leaveChatThread,
  sendChatMessage,
} from '@/lib/chatApi';
import { useThreadMessages, type ThreadUiMessage } from '@/hooks/useThreadMessages';
import { useThreadCreation } from '@/hooks/useThreadCreation';
import { useThreadList } from '@/hooks/useThreadList';
import { useAppStore } from '@/stores/appStore';
import { subscribeToThreadLifecycle } from '@/lib/realtime/threadHub';
import { NewThreadPanel } from '@/components/messages/NewThreadPanel';
import { GovernedMessage } from '@/components/messages/GovernedMessage';
import { ComposeArea, type ComposeOutcome } from '@/components/messages/ComposeArea';
import {
  Search,
  Lock,
  AlertTriangle,
  FileText,
  Activity,
  Bot,
  MessageSquare,
  Plus,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const govBadge: Record<string, { label: string; style: string }> = {
  compliant: { label: '✓ Compliant', style: 'bg-success/10 text-success border-success/20' },
  flagged: { label: '⚠ 1 Flag', style: 'bg-urgent/10 text-urgent border-urgent/20' },
  violation: { label: '✖ Violation', style: 'bg-stat/10 text-stat border-stat/20' },
};

const channelIcon: Record<string, React.ElementType> = {
  chat: MessageSquare, voice: Activity, email: FileText, ai: Bot,
};

/* ── Page ── */
export default function Messages() {
  const currentUser = useAppStore((s) => s.currentUser);
  const messageListEndRef = useRef<HTMLDivElement | null>(null);
  const [sending, setSending] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<ComposeOutcome | null>(null);
  const [canDeleteThread, setCanDeleteThread] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLeavingThread, setIsLeavingThread] = useState(false);
  const [isDeletingThread, setIsDeletingThread] = useState(false);
  const {
    threads,
    selectedThread,
    setSelectedThread,
    loadingThreads,
    threadParticipants,
    removeParticipantFromThreadLocally,
    thread,
    selectedThreadId,
    onIncomingThreadActivity,
    reloadThreadsForCurrentUser,
  } = useThreadList(currentUser);

  const {
    loadingMessages,
    messages,
    appendLiveMessage,
  } = useThreadMessages({
    selectedThreadId,
    onIncomingThreadActivity,
  });

  const {
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
  } = useThreadCreation({
    currentUser,
    onThreadCreated: async (threadId) => {
      await reloadThreadsForCurrentUser();
      setSelectedThread(threadId);
    },
  });

  useEffect(() => {
    if (!selectedThreadId) return;

    const frame = window.requestAnimationFrame(() => {
      messageListEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedThreadId, messages.length]);

  useEffect(() => {
    setLastOutcome(null);
  }, [selectedThread]);

  useEffect(() => {
    if (!selectedThreadId) return;

    let disposed = false;
    let unsubscribe: (() => void) | null = null;

    async function subscribe() {
      try {
        unsubscribe = await subscribeToThreadLifecycle([selectedThreadId], {
          onThreadLeft: (event) => {
            if (disposed || event.threadId !== selectedThreadId) return;
            if (event.entraUserId?.toLowerCase() === currentUser?.oid?.toLowerCase()) return;

            const removedName =
              removeParticipantFromThreadLocally(event.threadId, event.entraUserId) ||
              event.entraUserId;
            const content = `${removedName} left this thread.`;

            const marker: ThreadUiMessage = {
              id: `thread-left-${event.threadId}-${event.entraUserId}-${Date.now()}`,
              sender: "System",
              role: "VOXTEN System",
              content,
              sortTs: Date.now(),
              timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
              isAI: false,
              type: "system",
              governance: {
                compliance: "passed",
                encryption: "AES-256",
                syncStatus: "Synced from Communications API",
                auditId: `event-${Date.now()}`,
              },
            };

            appendLiveMessage(event.threadId, marker);
            onIncomingThreadActivity?.({ threadId: event.threadId, content });
          },
        });
      } catch {
        // Keep UI working without lifecycle realtime events.
      }
    }

    void subscribe();
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [appendLiveMessage, currentUser?.oid, onIncomingThreadActivity, removeParticipantFromThreadLocally, selectedThreadId]);

  useEffect(() => {
    let cancelled = false;

    async function loadDeletePermission() {
      if (!selectedThreadId || !currentUser?.tenantId || !currentUser?.oid) {
        setCanDeleteThread(false);
        return;
      }

      try {
        const metadata = await getThreadMetadata(currentUser.tenantId, selectedThreadId);
        if (cancelled) return;
        const isMetadataOwner =
          !!metadata?.createdByEntraUserId &&
          metadata.createdByEntraUserId.toLowerCase() === currentUser.oid.toLowerCase();

        if (isMetadataOwner) {
          setCanDeleteThread(true);
          return;
        }

        // Backward compatibility for old threads created before metadata was stored.
        if (!metadata?.createdByEntraUserId) {
          const participants = await getThreadParticipants(currentUser.tenantId, selectedThreadId);
          if (cancelled) return;
          const me = participants.find((p) => p.entraUserId.toLowerCase() === currentUser.oid.toLowerCase());
          setCanDeleteThread((me?.role || '').toLowerCase() === 'creator');
          return;
        }

        setCanDeleteThread(false);
      } catch {
        if (cancelled) return;
        setCanDeleteThread(false);
      }
    }

    void loadDeletePermission();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.oid, currentUser?.tenantId, selectedThreadId]);

  async function handleLeaveThread() {
    if (!selectedThreadId || !currentUser?.tenantId) return;
    if (canDeleteThread) {
      toast.error('Thread creator cannot leave. Delete the thread instead.');
      return;
    }
    setIsLeavingThread(true);

    try {
      await leaveChatThread(selectedThreadId, currentUser.tenantId);
      await reloadThreadsForCurrentUser();
      toast.success('Thread left');
      setLeaveDialogOpen(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unexpected API error.';
      toast.error('Failed to leave thread', { description: msg });
    } finally {
      setIsLeavingThread(false);
    }
  }

  async function handleDeleteThread() {
    if (!selectedThreadId || !currentUser?.tenantId) return;
    if (!canDeleteThread) {
      toast.error('Only the thread creator can delete this thread.');
      return;
    }
    setIsDeletingThread(true);

    try {
      await deleteChatThread(selectedThreadId, currentUser.tenantId);
      await reloadThreadsForCurrentUser();
      toast.success('Thread deleted');
      setDeleteDialogOpen(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unexpected API error.';
      toast.error('Failed to delete thread', { description: msg });
    } finally {
      setIsDeletingThread(false);
    }
  }

  async function handleSend(input: { text: string; channel: string }) {
    if (!selectedThreadId) {
      toast.error('No thread selected');
      return;
    }

    setSending(true);
    setLastOutcome(null);

    try {
      const result = await sendChatMessage({
        threadId: selectedThreadId,
        content: input.text,
        senderDisplayName: currentUser?.displayName || 'Authenticated User',
        tenantId: currentUser?.tenantId,
        senderEntraUserId: currentUser?.oid,
        complianceState: 'passed',
      });

      const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
      const auditId = result.messageId || `msg-${Date.now()}`;

      const next: ThreadUiMessage = {
        id: `live-${Date.now()}`,
        sender: currentUser?.displayName || 'Authenticated User',
        role: (currentUser?.roles?.[0] || currentUser?.jobTitle || 'User').replace(/^Voxten\./, ''),
        content: input.text,
        sortTs: Date.now(),
        timestamp,
        isAI: false,
        governance: {
          compliance: 'passed',
          encryption: 'AES-256',
          syncStatus: 'Sent via Communications API',
          auditId,
        },
      };

      appendLiveMessage(selectedThreadId, next);

      setLastOutcome({
        verdict: 'allowed',
        auditId,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unexpected API error.';
      toast.error('Failed to send message', { description: msg });
      setLastOutcome({
        verdict: 'blocked',
        auditId: 'send-failed',
        reason: 'API request failed',
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full gap-0 overflow-hidden">
      {/* Thread List */}
      <div className="w-80 border-r border-border bg-card flex flex-col flex-shrink-0 min-h-0">
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search governed threads..." className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground" />
          </div>
          <button
            type="button"
            className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
            onClick={() => setShowNewThreadPanel((v) => !v)}
          >
            <Plus className="w-3.5 h-3.5" />
            New Thread
          </button>
          {showNewThreadPanel && (
            <NewThreadPanel
              topic={newThreadTopic}
              onTopicChange={setNewThreadTopic}
              userSearchQuery={userSearchQuery}
              onUserSearchQueryChange={setUserSearchQuery}
              searchingUsers={searchingUsers}
              userSearchResults={userSearchResults}
              selectedUsers={selectedUsers}
              creatingThread={creatingThread}
              onCancel={() => setShowNewThreadPanel(false)}
              onCreate={() => void handleCreateThread()}
              onAddUser={addUserToThread}
              onRemoveUser={removeUserFromThread}
            />
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingThreads && (
            <div className="px-4 py-2 text-[11px] text-muted-foreground">Loading threads...</div>
          )}
          {threads.map((t) => {
            const ChannelIcon = channelIcon[t.channel];
            const govCfg = govBadge[t.governance];
            return (
              <button
                key={t.id}
                onClick={() => setSelectedThread(t.id)}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors',
                  selectedThread === t.id && 'bg-muted',
                  t.governance === 'violation' && 'border-l-2 border-l-stat'
                )}
              >
                <div className="flex items-start gap-2">
                  <ChannelIcon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-foreground truncate flex-1">{t.title}</span>
                      {t.unread > 0 && (
                        <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center flex-shrink-0">{t.unread}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge variant="outline" className={cn('text-[9px] px-1 py-0 h-3.5', govCfg.style)}>{govCfg.label}</Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto">{t.lastActivity}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col bg-background min-w-0 min-h-0">
        {!thread ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            {creatingThread ? (
              <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce" />
                </span>
                Creating thread...
              </div>
            ) : (
              'Select a thread or create a new thread to start chatting.'
            )}
          </div>
        ) : (
          <>
        {/* Thread Header */}
        <div className="px-5 py-3 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{thread.title}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {(threadParticipants[thread.id]?.length
                  ? threadParticipants[thread.id].map((p) => ({
                      key: p.entraUserId,
                      name: p.displayName || p.entraUserId,
                      role: p.role || 'Participant',
                    }))
                  : thread.participants.map((p) => ({
                      key: p.name,
                      name: p.name,
                      role: p.role,
                    }))).map((p) => (
                      <span key={p.key} className="text-[10px] text-muted-foreground">{p.name} ({p.role})</span>
                    ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn('text-[10px]', govBadge[thread.governance].style)}>
                {govBadge[thread.governance].label}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted"
                    aria-label="Thread actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!canDeleteThread && (
                    <DropdownMenuItem onClick={() => setLeaveDialogOpen(true)}>
                      Leave thread
                    </DropdownMenuItem>
                  )}
                  {canDeleteThread && (
                    <DropdownMenuItem className="text-stat focus:text-stat" onClick={() => setDeleteDialogOpen(true)}>
                      Delete thread
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Escalation Banner */}
        {thread.governance === 'violation' && (
          <div className="bg-stat/10 border-b border-stat/20 px-4 py-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-stat" />
            <span className="text-xs font-semibold text-stat">Compliance Violation — Supervisory review required</span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
          {creatingThread && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce" />
              </span>
              Creating thread...
            </div>
          )}
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Governed Thread — All messages policy-checked and archived</span>
          </div>
          {loadingMessages && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce" />
              </span>
              Syncing messages...
            </div>
          )}
          {messages.map((msg) => (
            <GovernedMessage key={msg.id} msg={msg} />
          ))}
          {!loadingMessages && messages.length === 0 && (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No messages found for this thread.
            </div>
          )}
          <div ref={messageListEndRef} />
        </div>

        {/* Compose */}
        <ComposeArea isSending={sending} onSend={handleSend} lastOutcome={lastOutcome} />
          </>
        )}
      </div>

      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave thread?</AlertDialogTitle>
            <AlertDialogDescription>
              You will stop receiving new messages from this thread.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeavingThread}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isLeavingThread} onClick={() => void handleLeaveThread()}>
              {isLeavingThread ? 'Leaving...' : 'Leave'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete thread for all participants?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingThread}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingThread}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleDeleteThread()}
            >
              {isDeletingThread ? 'Deleting...' : 'Delete thread'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
