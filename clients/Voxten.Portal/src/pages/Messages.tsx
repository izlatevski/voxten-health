import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ComplianceBlockedError,
  deleteChatThread,
  getThreadParticipants,
  getThreadMetadata,
  leaveChatThread,
  sendChatMessage,
} from '@/lib/chatApi';
import { useThreadMessages, type ThreadUiMessage } from '@/hooks/useThreadMessages';
import { useThreadCreation } from '@/hooks/useThreadCreation';
import { useThreadList } from '@/hooks/useThreadList';
import { isClinicianOnlyUser } from '@/auth/roles';
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
  Bell,
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

function isGuidLike(value?: string | null): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
}

function displayNameOrFallback(value?: string | null, fallback = 'Participant'): string {
  if (!value?.trim()) return fallback;
  return isGuidLike(value) ? fallback : value.trim();
}

/* ── Page ── */
export default function Messages() {
  const currentUser = useAppStore((s) => s.currentUser);
  const isClinicianOnly = isClinicianOnlyUser(currentUser);
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
              displayNameOrFallback(
                removeParticipantFromThreadLocally(event.threadId, event.entraUserId),
                'A participant',
              );
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

  function formatInlineTimestamp(value: Date): string {
    const now = new Date();
    const isSameDay =
      value.getFullYear() === now.getFullYear()
      && value.getMonth() === now.getMonth()
      && value.getDate() === now.getDate();

    if (isSameDay) {
      return value.toLocaleTimeString('en-GB', { hour12: false });
    }

    return value.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
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
      });

      const complianceState = result.complianceState ?? 'passed';
      const timestamp = formatInlineTimestamp(new Date());
      const auditId = result.auditId || result.messageId || `msg-${Date.now()}`;

      // For redacted messages the server substituted content — we show what was actually sent
      const next: ThreadUiMessage = {
        id: `live-${Date.now()}`,
        sender: currentUser?.displayName || 'Authenticated User',
        role: (currentUser?.roles?.[0] || currentUser?.jobTitle || 'User').replace(/^Voxten\./, ''),
        content: input.text,
        sortTs: Date.now(),
        timestamp,
        isAI: false,
        governance: {
          compliance: complianceState,
          encryption: 'AES-256',
          syncStatus: 'Sent via Communications API',
          auditId,
        },
      };

      appendLiveMessage(selectedThreadId, next);
      onIncomingThreadActivity?.({
        threadId: selectedThreadId,
        content: input.text,
        complianceState,
      });

      setLastOutcome({ verdict: complianceState, auditId });
    } catch (error) {
      if (error instanceof ComplianceBlockedError) {
        // Insert a local blocked marker so the sender sees the rejection inline
        const timestamp = formatInlineTimestamp(new Date());
        const blocked: ThreadUiMessage = {
          id: `blocked-${Date.now()}`,
          sender: currentUser?.displayName || 'Authenticated User',
          role: (currentUser?.roles?.[0] || currentUser?.jobTitle || 'User').replace(/^Voxten\./, ''),
          content: `⛔ Message blocked by compliance policy. Rules: ${error.rulesFired.map(r => r.ruleName || r.ruleId).join(', ') || 'policy'}`,
          sortTs: Date.now(),
          timestamp,
          isAI: false,
          type: 'blocked',
          governance: {
            compliance: 'blocked',
            encryption: 'AES-256',
            syncStatus: 'Blocked — not delivered',
            auditId: error.auditId,
          },
        };
        appendLiveMessage(selectedThreadId, blocked);
        onIncomingThreadActivity?.({
          threadId: selectedThreadId,
          content: blocked.content,
          complianceState: 'blocked',
        });
        setLastOutcome({ verdict: 'blocked', auditId: error.auditId, reason: error.rulesFired.map(r => r.ruleName || r.ruleId).join(', ') });
        // Keep compose text so the user can edit and retry
        return;
      }

      const msg = error instanceof Error ? error.message : 'Unexpected API error.';
      toast.error('Failed to send message', { description: msg });
      setLastOutcome({ verdict: 'blocked', auditId: 'send-failed', reason: 'API request failed' });
    } finally {
      setSending(false);
    }
  }

  const visibleParticipants = thread
    ? (threadParticipants[thread.id]?.length
      ? threadParticipants[thread.id].map((p) => ({
          key: p.entraUserId,
          name: displayNameOrFallback(p.displayName, 'Participant'),
          role: p.role || 'Participant',
        }))
      : thread.participants.map((p) => ({
          key: p.name,
          name: displayNameOrFallback(p.name, 'Participant'),
          role: p.role,
        })))
    : [];
  const clinicianAlertCount = threads.filter((item) => item.governance !== 'compliant').length;

  function renderChatBubble(msg: ThreadUiMessage) {
    const isMine = !!currentUser?.displayName
      && msg.sender.trim().toLowerCase() === currentUser.displayName.trim().toLowerCase();
    const isSystem = msg.type === 'system';
    const isBlocked = msg.type === 'blocked' || msg.governance.compliance === 'blocked';

    if (isSystem) {
      return (
        <div key={msg.id} className="flex justify-center py-1">
          <div className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
            {msg.content}
          </div>
        </div>
      );
    }

    return (
      <div key={msg.id} className={cn('flex gap-3', isMine && 'flex-row-reverse')}>
        <div
          className={cn(
            'mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
            isMine ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          {isMine ? (currentUser?.initials || 'ME') : msg.sender.charAt(0).toUpperCase()}
        </div>
        <div className={cn('max-w-[78%]', isMine && 'text-right')}>
          <div className={cn('flex items-center gap-2 text-[11px]', isMine && 'justify-end')}>
            <span className="font-medium text-foreground">{isMine ? 'You' : msg.sender}</span>
            <span className="text-muted-foreground">{msg.timestamp}</span>
          </div>
          <div
            className={cn(
              'mt-1 rounded-2xl px-3 py-2 text-sm leading-5 shadow-sm',
              isBlocked
                ? 'border border-stat/20 bg-stat/10 text-stat'
                : isMine
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card text-foreground',
            )}
          >
            {msg.content}
          </div>
          {msg.governance.compliance !== 'passed' && !isBlocked && (
            <span className="mt-1 block text-[10px] text-urgent">
              {msg.governance.compliance === 'flagged' ? 'Flagged for review' : 'Redacted before delivery'}
            </span>
          )}
          {isBlocked && (
            <span className="mt-1 block text-[10px] text-stat">Blocked by policy</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full gap-0 overflow-hidden">
      <div className={cn(
        'border-r border-border flex flex-col flex-shrink-0 min-h-0 bg-card',
        isClinicianOnly ? 'w-72' : 'w-80',
      )}>
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={isClinicianOnly ? 'Search messages...' : 'Search governed threads...'}
              className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="button"
            className={cn(
              'mt-2 w-full inline-flex items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium',
              isClinicianOnly
                ? 'border-primary/20 bg-primary text-primary-foreground hover:bg-primary/90'
                : 'border-border bg-background hover:bg-muted',
            )}
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
        {isClinicianOnly && (
          <div className="border-b border-border">
            <div className="px-3 py-1.5 flex items-center gap-1.5">
              <Bell className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-semibold text-primary">
                {clinicianAlertCount} {clinicianAlertCount === 1 ? 'Active Alert' : 'Active Alerts'}
              </span>
            </div>
          </div>
        )}
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
                  'w-full text-left border-b border-border transition-colors',
                  isClinicianOnly ? 'px-3 py-2.5 hover:bg-muted/40' : 'px-4 py-3 hover:bg-muted/50',
                  selectedThread === t.id && 'bg-muted',
                  isClinicianOnly && t.governance === 'flagged' && 'border-l-4 border-l-urgent bg-urgent/10 shadow-[inset_0_1px_0_rgba(0,0,0,0.02)]',
                  isClinicianOnly && t.governance === 'violation' && 'border-l-4 border-l-stat bg-stat/10 shadow-[inset_0_1px_0_rgba(0,0,0,0.02)]',
                  !isClinicianOnly && t.governance === 'flagged' && 'border-l-2 border-l-urgent bg-urgent/5',
                  !isClinicianOnly && t.governance === 'violation' && 'border-l-2 border-l-stat bg-stat/5',
                )}
              >
                <div className="flex items-start gap-2">
                  {isClinicianOnly ? null : (
                    <ChannelIcon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-foreground truncate flex-1">{t.title}</span>
                    </div>
                    {isClinicianOnly ? (
                      <>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{t.preview}</p>
                        <div className="mt-1">
                          <span className="text-[10px] text-muted-foreground">{t.lastActivity}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge variant="outline" className={cn('text-[9px] px-1 py-0 h-3.5', govCfg.style)}>
                          {govCfg.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground ml-auto">{t.lastActivity}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

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
            <div className={cn('border-b border-border bg-card', isClinicianOnly ? 'px-4 py-2.5' : 'px-5 py-3')}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{thread.title}</h2>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {visibleParticipants.map((p) => (
                      <span key={p.key} className="text-[10px] text-muted-foreground">
                        {isClinicianOnly ? p.name : `${p.name} (${p.role})`}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isClinicianOnly && (
                    <Badge variant="outline" className={cn('text-[10px]', govBadge[thread.governance].style)}>
                      {govBadge[thread.governance].label}
                    </Badge>
                  )}
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

            {!isClinicianOnly && thread.governance === 'violation' && (
              <div className="bg-stat/10 border-b border-stat/20 px-4 py-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-stat" />
                <span className="text-xs font-semibold text-stat">Compliance Violation — Supervisory review required</span>
              </div>
            )}
            <div className={cn('flex-1 overflow-y-auto', isClinicianOnly ? 'px-4 py-4 space-y-3' : 'px-5 py-4 space-y-1')}>
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
              {!isClinicianOnly && (
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">Governed Thread — All messages policy-checked and archived</span>
                </div>
              )}
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
                isClinicianOnly ? renderChatBubble(msg) : <GovernedMessage key={msg.id} msg={msg} />
              ))}
              {!loadingMessages && messages.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No messages found for this thread.
                </div>
              )}
              <div ref={messageListEndRef} />
            </div>

            <ComposeArea
              isSending={sending}
              onSend={handleSend}
              lastOutcome={lastOutcome}
              variant={isClinicianOnly ? 'chat' : 'governed'}
            />
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
