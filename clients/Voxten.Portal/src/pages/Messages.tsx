import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  sendChatMessage,
  SESSION_ACS_USER_TOKEN_KEY,
} from '@/lib/chatApi';
import { useThreadMessages, type ThreadUiMessage } from '@/hooks/useThreadMessages';
import { useThreadCreation } from '@/hooks/useThreadCreation';
import { useThreadList } from '@/hooks/useThreadList';
import { useAppStore } from '@/stores/appStore';
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
} from 'lucide-react';

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
  const {
    threads,
    selectedThread,
    setSelectedThread,
    loadingThreads,
    threadParticipants,
    thread,
    selectedThreadId,
    onIncomingThreadActivity,
    reloadThreadsForCurrentUser,
  } = useThreadList(currentUser);

  const {
    loadingMessages,
    messages,
    ensureSessionAcsToken,
    appendLiveMessage,
  } = useThreadMessages({
    currentUser,
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

  async function handleSend(input: { text: string; channel: string }) {
    if (!selectedThreadId) {
      toast.error('No thread selected');
      return;
    }

    const senderToken = sessionStorage.getItem(SESSION_ACS_USER_TOKEN_KEY);
    const resolvedSenderToken = senderToken || (await ensureSessionAcsToken());
    if (!resolvedSenderToken) {
      toast.error('Missing ACS token', { description: 'Sign in again to provision your chat token.' });
      return;
    }

    setSending(true);
    setLastOutcome(null);

    try {
      const result = await sendChatMessage({
        senderToken: resolvedSenderToken,
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
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{t.preview}</p>
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
            Select a thread or create a new thread to start chatting.
          </div>
        ) : (
          <>
        {/* Thread Header */}
        <div className="px-5 py-3 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{thread.title}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {(threadParticipants[thread.id] || thread.participants).map((p) => (
                  <span key={p.name} className="text-[10px] text-muted-foreground">{p.name} ({p.role})</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn('text-[10px]', govBadge[thread.governance].style)}>
                {govBadge[thread.governance].label}
              </Badge>
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
    </div>
  );
}
