import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, TrendingUp } from 'lucide-react';

const sources = [
  { name: 'Azure OpenAI (GPT-4o)', events: 6218, pass: 6201, flag: 12, block: 5, status: 'Gov' },
  { name: 'Copilot for M365', events: 4102, pass: 4098, flag: 4, block: 0, status: 'Gov' },
  { name: 'Clinical Summary Agent', events: 1841, pass: 1839, flag: 2, block: 0, status: 'Gov' },
  { name: 'Discharge Letter Agent', events: 686, pass: 683, flag: 2, block: 2, status: 'Gov' },
  { name: 'Unmonitored Sources', events: null, pass: null, flag: null, block: null, status: '--' },
];

export function AIGovernanceSpotlight() {
  return (
    <Card className="clinical-shadow border-border flex-1">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-ehr-part2" />
            <h2 className="text-sm font-semibold text-foreground">AI Communication Governance</h2>
          </div>
          <Badge variant="outline" className="bg-ehr-part2/10 text-ehr-part2 border-ehr-part2/20 text-[10px] gap-1">
            <TrendingUp className="w-3 h-3" />
            +340% (90d)
          </Badge>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div>
            <p className="text-[11px] text-muted-foreground">AI Events Today</p>
            <p className="text-lg font-bold text-foreground tabular-nums">12,847</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Pass Rate</p>
            <p className="text-lg font-bold text-success">99.82%</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Flagged</p>
            <p className="text-lg font-bold text-urgent tabular-nums">18</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Blocked</p>
            <p className="text-lg font-bold text-stat tabular-nums">2</p>
          </div>
        </div>

        {/* Source table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-1.5 font-medium text-muted-foreground">Source</th>
                <th className="text-right py-1.5 font-medium text-muted-foreground">Events</th>
                <th className="text-right py-1.5 font-medium text-muted-foreground">Flag</th>
                <th className="text-right py-1.5 font-medium text-muted-foreground">Block</th>
                <th className="text-right py-1.5 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.name} className="border-b border-border/50">
                  <td className="py-1.5 font-medium text-foreground">{s.name}</td>
                  <td className="py-1.5 text-right tabular-nums text-muted-foreground">{s.events?.toLocaleString() ?? '--'}</td>
                  <td className="py-1.5 text-right tabular-nums text-muted-foreground">{s.flag ?? '--'}</td>
                  <td className="py-1.5 text-right tabular-nums text-muted-foreground">{s.block ?? '--'}</td>
                  <td className="py-1.5 text-right">
                    {s.status === 'Gov' ? (
                      <span className="inline-flex items-center gap-1 text-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" />
                        Gov
                      </span>
                    ) : (
                      <span className="text-muted-foreground">○ --</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">
          Most common flag: <em>"PHI detected in AI-generated patient summary"</em>
        </p>
      </CardContent>
    </Card>
  );
}
