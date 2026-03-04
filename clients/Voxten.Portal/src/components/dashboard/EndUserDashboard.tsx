import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search, Send, Paperclip, MessageSquare, AlertTriangle, User, Bot, Bell } from 'lucide-react';

/* ── Simple Thread List for End User ── */
const threads = [
  { id: '1', title: 'Martinez, Robert — Critical K+ 6.8', participants: 'Dr. Chen, Nurse Torres', priority: 'urgent' as const, unread: 3, time: '2 min ago', preview: 'K+ trending down after treatment...' },
  { id: '2', title: 'Thompson, Angela — Discharge Plan', participants: 'Dr. Rivera, PharmD Kim', priority: 'active' as const, unread: 0, time: '15 min ago', preview: 'Pharmacy cleared discharge meds...' },
  { id: '3', title: 'Williams, David — Cardiology Consult', participants: 'Dr. Patel, Dr. Rivera', priority: 'active' as const, unread: 1, time: '28 min ago', preview: 'Echo results reviewed, plan updated...' },
  { id: '4', title: 'Shift Handoff — 4-North', participants: 'Night team → Day team', priority: 'routine' as const, unread: 0, time: '6:45 AM', preview: 'All patients stable, 412B flagged...' },
];

const alerts = [
  { desc: 'Critical Lab: K+ 6.8 — Martinez, Robert', time: '14:18', severity: 'critical' },
  { desc: 'Patient Transfer: Martinez → ICU Bed 7', time: '14:22', severity: 'warning' },
  { desc: 'Med Admin: Furosemide 40mg completed', time: '14:21', severity: 'info' },
];

const messages = [
  { sender: 'Dr. James Rivera', content: 'K+ is critically elevated at 6.8. IV calcium gluconate and sodium polystyrene ordered. Please monitor telemetry.', time: '14:19', isMe: false },
  { sender: 'You', content: 'Copy. Calcium gluconate 1g IV started, telemetry on. Patient asymptomatic. Will recheck BMP in 2 hours.', time: '14:21', isMe: true, status: '✓ Sent' },
  { sender: 'Dr. Sarah Chen', content: 'Good catch. I\'ll place nephrology consult. Please update family during afternoon rounds.', time: '14:23', isMe: false },
  { sender: 'You', content: 'Repeat BMP drawn. K+ trending down to 5.9. Patient remains stable.', time: '16:15', isMe: true, status: '✓ Sent' },
];

const priorityDot: Record<string, string> = {
  urgent: 'bg-stat',
  active: 'bg-success',
  routine: 'bg-muted-foreground',
};

export function EndUserDashboard() {
  const [selectedThread, setSelectedThread] = useState('1');
  const [composeText, setComposeText] = useState('');

  return (
    <div className="flex h-[calc(100vh-9rem)] gap-0 -mx-4 -mb-4">
      {/* Thread List — Clean, no governance metadata */}
      <div className="w-72 border-r border-border bg-card flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search messages..." className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground" />
          </div>
        </div>

        {/* Alerts — compact */}
        {alerts.length > 0 && (
          <div className="border-b border-border">
            <div className="px-3 py-1.5 flex items-center gap-1.5">
              <Bell className="w-3 h-3 text-stat" />
              <span className="text-[10px] font-semibold text-stat">{alerts.length} Alerts</span>
            </div>
            {alerts.map((a, i) => (
              <div key={i} className={cn(
                'px-3 py-1.5 text-[11px] border-t border-border/50',
                a.severity === 'critical' ? 'bg-stat/5 text-stat' : a.severity === 'warning' ? 'text-urgent' : 'text-muted-foreground'
              )}>
                {a.desc}
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedThread(t.id)}
              className={cn(
                'w-full text-left px-3 py-2.5 border-b border-border/50 hover:bg-muted/50 transition-colors',
                selectedThread === t.id && 'bg-muted',
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', priorityDot[t.priority])} />
                <span className="text-xs font-medium text-foreground truncate flex-1">{t.title}</span>
                {t.unread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">{t.unread}</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5 ml-4">{t.preview}</p>
              <span className="text-[10px] text-muted-foreground ml-4">{t.time}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages — Clean, minimal governance */}
      <div className="flex-1 flex flex-col bg-background min-w-0">
        <div className="px-4 py-2.5 border-b border-border bg-card">
          <h2 className="text-sm font-semibold text-foreground">{threads.find(t => t.id === selectedThread)?.title}</h2>
          <p className="text-[11px] text-muted-foreground">{threads.find(t => t.id === selectedThread)?.participants}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={cn('flex gap-3', msg.isMe && 'flex-row-reverse')}>
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-semibold',
                msg.isMe ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                {msg.isMe ? 'MT' : msg.sender.charAt(0)}
              </div>
              <div className={cn('max-w-[70%]', msg.isMe && 'text-right')}>
                <span className="text-[11px] font-medium text-foreground">{msg.sender}</span>
                <span className="text-[10px] text-muted-foreground ml-2">{msg.time}</span>
                <div className={cn(
                  'mt-1 px-3 py-2 rounded-lg text-sm',
                  msg.isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                )}>
                  {msg.content}
                </div>
                {msg.status && (
                  <span className="text-[10px] text-success mt-0.5 block">{msg.status}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Compose */}
        <div className="border-t border-border p-3 bg-card">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <input
                type="text"
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                placeholder="Type a message..."
                className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground"><Paperclip className="w-4 h-4" /></button>
            <button className="p-2 bg-primary text-primary-foreground rounded-lg"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
