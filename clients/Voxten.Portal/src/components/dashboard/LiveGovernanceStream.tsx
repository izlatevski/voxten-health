import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Verdict = 'PASS' | 'FLAG' | 'BLOCK' | 'REDACT';

interface GovEvent {
  id: number;
  time: string;
  verdict: Verdict;
  channel: string;
  regulation: string;
  from: string;
  to: string;
  preview: string;
  latency: string;
}

const verdictStyle: Record<Verdict, string> = {
  PASS: 'text-success bg-success/10',
  FLAG: 'text-urgent bg-urgent/10',
  BLOCK: 'text-stat bg-stat/10',
  REDACT: 'text-ehr-part2 bg-ehr-part2/10',
};

const channels = ['Secure Msg', 'AI-Gen', 'Email', 'Voice Tx', 'Video', 'SMS'];
const regulations = ['HIPAA', 'Joint Comm', '42 CFR Pt2', 'Cures Act'];
const people = [
  ['Dr. Rivera', 'Care Team'],
  ['Copilot', 'Dr. Chen'],
  ['Nurse Torres', 'Dr. Kim'],
  ['Discharge Agent', 'Patient Portal'],
  ['Dr. Chen', 'Lab Team'],
  ['PharmD Kim', 'Care Team'],
];
const previews = [
  '"Discharge plan updated for..."',
  '"Patient summary generated..."',
  '"Lab results indicate..."',
  '[Voice transcript captured]',
  '"Medication adjustment rec..."',
  '"Follow-up appointment sch..."',
  '"Vitals within normal range..."',
  '"Care team handoff complete..."',
];

function generateEvent(id: number): GovEvent {
  const now = new Date();
  const rand = Math.random();
  let verdict: Verdict;
  if (rand < 0.92) verdict = 'PASS';
  else if (rand < 0.96) verdict = 'FLAG';
  else if (rand < 0.99) verdict = 'REDACT';
  else verdict = 'BLOCK';

  const pair = people[Math.floor(Math.random() * people.length)];
  return {
    id,
    time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    verdict,
    channel: channels[Math.floor(Math.random() * channels.length)],
    regulation: regulations[Math.floor(Math.random() * regulations.length)],
    from: pair[0],
    to: pair[1],
    preview: previews[Math.floor(Math.random() * previews.length)],
    latency: `${8 + Math.floor(Math.random() * 57)}ms`,
  };
}

export function LiveGovernanceStream() {
  const [events, setEvents] = useState<GovEvent[]>(() => {
    const initial: GovEvent[] = [];
    for (let i = 0; i < 8; i++) initial.push(generateEvent(i));
    return initial.reverse();
  });
  const [paused, setPaused] = useState(false);
  const idRef = useRef(8);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      idRef.current++;
      setEvents((prev) => [generateEvent(idRef.current), ...prev].slice(0, 30));
    }, 2000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [paused]);

  return (
    <Card className="clinical-shadow border-border flex-1">
      <CardContent className="p-0">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Live Governance Stream</h2>
          <span className="text-[10px] text-muted-foreground">
            {paused ? 'Paused' : 'Auto-scrolling'}
          </span>
        </div>
        <div
          className="max-h-[280px] overflow-y-auto text-xs"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50 sticky top-0">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground w-20">Time</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground w-16">Verdict</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Channel</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Reg</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">From → To</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden lg:table-cell">Preview</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground w-14">ms</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr
                  key={e.id}
                  className={cn(
                    'border-b border-border/50 transition-colors hover:bg-muted/30',
                    e.verdict === 'BLOCK' && 'bg-stat/5',
                    e.verdict === 'FLAG' && 'bg-urgent/5'
                  )}
                >
                  <td className="px-3 py-1.5 font-mono text-muted-foreground">{e.time}</td>
                  <td className="px-3 py-1.5">
                    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', verdictStyle[e.verdict])}>
                      {e.verdict}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-foreground">{e.channel}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{e.regulation}</td>
                  <td className="px-3 py-1.5 text-foreground">{e.from} → {e.to}</td>
                  <td className="px-3 py-1.5 text-muted-foreground truncate max-w-[180px] hidden lg:table-cell">{e.preview}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">{e.latency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
