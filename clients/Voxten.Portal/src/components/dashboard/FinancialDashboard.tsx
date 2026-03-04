import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MessageSquare, AlertTriangle, Archive, CheckCircle, ShieldCheck } from 'lucide-react';

/* ── Financial KPIs ── */
const finMetrics = [
  { title: 'Client Communications Today', value: '142', icon: MessageSquare },
  { title: 'Compliance Flags (FINRA)', value: '1', icon: AlertTriangle },
  { title: 'Off-Channel Violations', value: '0', icon: ShieldCheck },
  { title: 'Archival Rate (SEC 17a-4)', value: '100%', icon: Archive },
];

/* ── Client Threads (includes video) ── */
const clientThreads = [
  { client: 'Whitfield, Sarah', subject: 'Portfolio Rebalancing', status: 'flagged', flag: 'Forward-looking language', time: '1h ago', channel: 'Email' },
  { client: 'Chen, Michael', subject: 'Q1 Performance Review', status: 'compliant', flag: '', time: '2h ago', channel: 'Video Call' },
  { client: 'Rodriguez, Ana', subject: 'IRA Rollover Options', status: 'compliant', flag: '', time: '3h ago', channel: 'Secure Msg' },
  { client: 'Thompson, James', subject: 'Estate Planning Update', status: 'compliant', flag: '', time: 'Yesterday', channel: 'Video Call' },
];

/* ── Compliance Events ── */
const complianceEvents = [
  { time: '11:30', type: 'FLAG', desc: 'Forward-looking language detected — "guaranteed improved returns"', channel: 'Email', reg: 'FINRA 3110' },
  { time: '10:15', type: 'ARCHIVE', desc: 'Client call archived to WORM storage — SEC 17a-4 compliant', channel: 'Voice', reg: 'SEC 17a-4' },
  { time: '09:42', type: 'PASS', desc: 'Client portfolio update email — compliant', channel: 'Email', reg: 'FINRA 3110' },
  { time: '09:10', type: 'ARCHIVE', desc: 'SMS conversation archived — 12 messages', channel: 'SMS', reg: 'SEC 17a-4' },
];

/* ── FINRA Packs ── */
const regPacks = [
  { name: 'FINRA 3110 — Supervision', rules: 183, violations: 1, active: true },
  { name: 'SEC 17a-4 — Record Retention', rules: 94, violations: 0, active: true },
  { name: 'SEC Reg BI — Best Interest', rules: 67, violations: 0, active: true },
  { name: 'GDPR Art. 9 Pack', rules: 156, violations: 0, active: false },
];

export function FinancialDashboard() {
  return (
    <div className="space-y-4">
      {/* Row 1: KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {finMetrics.map((m) => (
          <Card key={m.title} className="clinical-shadow border-border">
            <CardContent className="p-3">
              <m.icon className="w-4 h-4 text-muted-foreground mb-1.5" />
              <p className="text-2xl font-bold text-foreground tabular-nums">{m.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{m.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2: Client Threads + FINRA Status */}
      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="clinical-shadow border-border flex-1">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Client Communication Threads</h2>
            </div>
            <div>
              {clientThreads.map((t, i) => (
                <div key={i} className={cn(
                  'flex items-center gap-3 px-4 py-2.5 border-b border-border/50 hover:bg-muted/30 cursor-pointer',
                  t.status === 'flagged' && 'border-l-[3px] border-l-urgent'
                )}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{t.client}</span>
                      <span className="text-[11px] text-muted-foreground">— {t.subject}</span>
                      <Badge variant="outline" className="text-[8px] h-3 px-1 ml-1">{t.channel}</Badge>
                    </div>
                    {t.flag && <p className="text-[10px] text-urgent mt-0.5">⚠ {t.flag}</p>}
                  </div>
                  <Badge variant="outline" className={cn('text-[9px] h-4 px-1.5',
                    t.status === 'flagged' ? 'bg-urgent/10 text-urgent border-urgent/20' : 'bg-success/10 text-success border-success/20'
                  )}>
                    {t.status === 'flagged' ? '⚠ Flagged' : '✓ Compliant'}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{t.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FINRA Packs */}
        <Card className="clinical-shadow border-border flex-1">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">Regulation Packs</h2>
            <div className="space-y-2">
              {regPacks.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    {p.active ? <CheckCircle className="w-3.5 h-3.5 text-success" /> : <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground" />}
                    <span className={cn(p.active ? 'text-foreground font-medium' : 'text-muted-foreground')}>{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground tabular-nums">{p.rules} rules</span>
                    {p.violations > 0 ? (
                      <span className="text-urgent tabular-nums">{p.violations} ▲</span>
                    ) : (
                      <span className="text-success tabular-nums">0 ▲</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Compliance Events */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Recent Compliance Events</h2>
          </div>
          <div>
            {complianceEvents.map((evt, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2 border-b border-border/50 text-xs hover:bg-muted/30">
                <span className="font-mono text-muted-foreground w-12">{evt.time}</span>
                <Badge variant="outline" className={cn('text-[9px] h-4 px-1.5',
                  evt.type === 'FLAG' ? 'bg-urgent/10 text-urgent border-urgent/20' :
                  evt.type === 'ARCHIVE' ? 'bg-primary/10 text-primary border-primary/20' :
                  'bg-success/10 text-success border-success/20'
                )}>{evt.type}</Badge>
                <span className="text-foreground flex-1 truncate">{evt.desc}</span>
                <span className="text-muted-foreground">{evt.channel}</span>
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-mono">{evt.reg}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
