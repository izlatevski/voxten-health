import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MessageSquare, AlertTriangle, Clock, CheckCircle, Activity, Users, ArrowRight } from 'lucide-react';
import { useEHRStore } from '@/stores/ehrStore';
import { useNavigate } from 'react-router-dom';

/* ── Clinical KPIs ── */
const clinicalMetrics = [
  { title: 'Clinical Messages Today', value: '847', detail: 'Across all care teams', icon: MessageSquare },
  { title: 'Active Critical Alerts', value: '3', detail: 'Requiring response', icon: AlertTriangle },
  { title: 'Avg Escalation Response', value: '2m 14s', detail: 'Time to acknowledge', icon: Clock },
  { title: 'Message Delivery Rate', value: '100%', detail: 'All channels', icon: CheckCircle },
  { title: 'Active Care Team Threads', value: '4', detail: 'Your patients', icon: Users },
];

/* ── Active Threads ── */
const activeThreads = [
  { priority: 'urgent', patient: 'Martinez, Robert', desc: 'Critical K+ 6.8 — awaiting response from Dr. Chen', time: '2m ago', unread: 3 },
  { priority: 'active', patient: 'Thompson, Angela', desc: 'Discharge planning — Nurse Torres responded', time: '5m ago', unread: 0 },
  { priority: 'active', patient: 'Williams, David', desc: 'Cardiology consult — Dr. Patel joined thread', time: '12m ago', unread: 1 },
  { priority: 'closed', patient: 'Garcia, Maria', desc: 'Post-op check — resolved', time: '1h ago', unread: 0 },
];

/* ── Care Team Activity ── */
const careTeamActivity = [
  { time: '14:23', desc: 'Dr. Chen acknowledged Critical Lab alert (Martinez, Robert)' },
  { time: '14:21', desc: 'Nurse Torres sent discharge checklist (Thompson, Angela)' },
  { time: '14:18', desc: 'Pharmacy confirmed med reconciliation (Williams, David)' },
  { time: '14:15', desc: 'VOXTEN escalated: No response to Critical Lab after 5 min' },
  { time: '14:10', desc: 'Dr. Patel joined cardiology consult thread (Williams, David)' },
  { time: '14:05', desc: 'RT L. Nguyen completed respiratory assessment (Martinez, Robert)' },
];

/* ── Clinical Alerts ── */
const clinicalAlerts = [
  { type: 'Critical Lab', desc: 'K+ 6.8 (Martinez)', status: 'Escalated, awaiting Dr. Chen', severity: 'critical' },
  { type: 'Patient Transfer', desc: 'Martinez moved to ICU Bed 7', status: 'Acknowledged', severity: 'warning' },
  { type: 'Med Admin', desc: 'Furosemide 40mg by Nurse Torres', status: 'Completed', severity: 'info' },
];

const priorityStyle: Record<string, { dot: string; label: string; bg: string }> = {
  urgent: { dot: 'bg-stat', label: 'URGENT', bg: 'border-l-stat' },
  active: { dot: 'bg-success', label: 'Active', bg: 'border-l-success' },
  closed: { dot: 'bg-muted-foreground', label: 'Closed', bg: 'border-l-border' },
};

export function ClinicalDashboard() {
  const { connectionStatus, lastSync } = useEHRStore();
  const navigate = useNavigate();

  const syncAgo = () => {
    const diff = Math.round((Date.now() - new Date(lastSync).getTime()) / 1000);
    return diff < 60 ? `${diff}s ago` : `${Math.round(diff / 60)}m ago`;
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Clinical KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {clinicalMetrics.map((m) => (
          <Card key={m.title} className="clinical-shadow border-border">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <m.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{m.detail}</span>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{m.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{m.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2: Active Threads + Care Team Activity */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Active Threads */}
        <Card className="clinical-shadow border-border flex-1">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">My Active Threads</h2>
              <button onClick={() => navigate('/messages')} className="text-[10px] text-primary font-medium hover:underline">View all →</button>
            </div>
            <div>
              {activeThreads.map((t, i) => {
                const style = priorityStyle[t.priority];
                return (
                  <div key={i} className={cn('flex items-center gap-3 px-4 py-2.5 border-b border-border/50 border-l-[3px] hover:bg-muted/30 cursor-pointer', style.bg)}>
                    <span className={cn('w-2 h-2 rounded-full flex-shrink-0', style.dot)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{t.patient}</span>
                        {t.priority === 'urgent' && <Badge variant="outline" className="text-[9px] h-3.5 px-1 bg-stat/10 text-stat border-stat/20">{style.label}</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{t.desc}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{t.time}</span>
                    {t.unread > 0 && (
                      <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center flex-shrink-0">{t.unread}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Care Team Activity */}
        <Card className="clinical-shadow border-border flex-1">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Care Team Activity</h2>
            </div>
            <div className="max-h-[250px] overflow-y-auto">
              {careTeamActivity.map((evt, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-2 border-b border-border/50 text-xs">
                  <span className="font-mono text-muted-foreground w-12 flex-shrink-0 pt-0.5">{evt.time}</span>
                  <p className="text-foreground leading-relaxed">{evt.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Clinical Alerts + Video Sessions + EHR Sync */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Clinical Alerts */}
        <Card className="clinical-shadow border-border flex-1">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">Active Clinical Alerts</h2>
            <div className="space-y-2">
              {clinicalAlerts.map((alert, i) => (
                <div key={i} className={cn(
                  'flex items-center gap-3 p-2.5 rounded-md border text-xs',
                  alert.severity === 'critical' ? 'border-stat/20 bg-stat/5' :
                  alert.severity === 'warning' ? 'border-urgent/20 bg-urgent/5' :
                  'border-border bg-muted/30'
                )}>
                  <AlertTriangle className={cn('w-4 h-4 flex-shrink-0',
                    alert.severity === 'critical' ? 'text-stat' :
                    alert.severity === 'warning' ? 'text-urgent' : 'text-primary'
                  )} />
                  <div className="flex-1">
                    <span className="font-medium text-foreground">{alert.type}:</span>
                    <span className="text-muted-foreground ml-1">{alert.desc}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{alert.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* My Video Sessions */}
        <Card className="clinical-shadow border-border flex-1">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Today's Video Sessions</h2>
              <button onClick={() => navigate('/video-sessions')} className="text-[10px] text-primary font-medium hover:underline">View all →</button>
            </div>
            <div>
              {[
                { time: '09:15', patient: 'Garcia, Maria', type: 'Post-Discharge', duration: '8m', status: 'compliant' as const },
                { time: '13:45', patient: 'Thompson, Angela', type: 'Follow-up', duration: '18m', status: 'compliant' as const },
                { time: '14:12', patient: 'Martinez, Robert', type: 'Telehealth', duration: 'LIVE', status: 'live' as const },
                { time: '15:30', patient: 'Williams, David', type: 'Scheduled', duration: '—', status: 'scheduled' as const },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2 border-b border-border/50 text-xs hover:bg-muted/30 cursor-pointer">
                  {s.status === 'live' ? (
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse-subtle flex-shrink-0" />
                  ) : s.status === 'scheduled' ? (
                    <span className="w-2 h-2 rounded-full border border-muted-foreground flex-shrink-0" />
                  ) : (
                    <span className="text-success flex-shrink-0">✓</span>
                  )}
                  <span className="font-mono text-muted-foreground w-12">{s.time}</span>
                  <span className="text-foreground font-medium flex-1">{s.patient}</span>
                  <span className="text-muted-foreground">{s.type} ({s.duration})</span>
                  <Badge variant="outline" className={cn('text-[9px] h-3.5 px-1',
                    s.status === 'compliant' ? 'bg-success/10 text-success border-success/20' :
                    s.status === 'live' ? 'bg-success/10 text-success border-success/20' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {s.status === 'live' ? '● Monitoring' : s.status === 'compliant' ? 'Compliant' : 'Scheduled'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* EHR Sync Status */}
        <Card className="clinical-shadow border-border w-full lg:w-56 flex-shrink-0">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">EHR Connection</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={cn('w-3 h-3 rounded-full', connectionStatus === 'connected' ? 'bg-success animate-pulse-subtle' : 'bg-stat')} />
                <span className="text-sm font-medium text-foreground">Epic</span>
                <Badge variant="outline" className={cn('text-[10px] ml-auto',
                  connectionStatus === 'connected' ? 'bg-success/10 text-success border-success/20' : 'bg-stat/10 text-stat border-stat/20'
                )}>
                  {connectionStatus === 'connected' ? 'Connected' : 'Offline'}
                </Badge>
              </div>
              <div className="text-xs space-y-1.5 text-muted-foreground">
                <div className="flex justify-between"><span>Last sync</span><span className="text-foreground">{syncAgo()}</span></div>
                <div className="flex justify-between"><span>Patient data</span><span className="text-success">Current</span></div>
                <div className="flex justify-between"><span>FHIR R4</span><span className="text-success">✓ Active</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
