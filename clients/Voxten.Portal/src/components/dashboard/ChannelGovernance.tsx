import { Card, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const channels = [
  { name: 'Secure Messaging', value: 18402, color: 'hsl(217, 91%, 60%)' },
  { name: 'Voice Communications', value: 6218, color: 'hsl(173, 80%, 40%)' },
  { name: 'Video Sessions', value: 2847, color: 'hsl(190, 80%, 50%)' },
  { name: 'SMS/MMS', value: 8944, color: 'hsl(38, 92%, 50%)' },
  { name: 'Email', value: 5291, color: 'hsl(239, 84%, 67%)' },
  { name: 'AI-Generated', value: 9436, color: 'hsl(263, 70%, 58%)' },
];

const total = channels.reduce((s, c) => s + c.value, 0);

export function ChannelGovernance() {
  return (
    <Card className="clinical-shadow border-border flex-1">
      <CardContent className="p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Channel Governance Distribution</h2>
        <div className="flex items-center gap-6">
          <div className="w-40 h-40 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channels}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={68}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {channels.map((c, i) => (
                    <Cell
                      key={c.name}
                      fill={c.color}
                      // Slightly separate AI-Generated slice
                      {...(i === 4 ? { style: { transform: 'translate(2px, -2px)' } } : {})}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => value.toLocaleString()}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {channels.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-foreground font-medium">{c.name}</span>
                </div>
                <span className="text-muted-foreground tabular-nums">{c.value.toLocaleString()}</span>
              </div>
            ))}
            <div className="pt-1.5 border-t border-border flex justify-between text-xs font-semibold">
              <span className="text-foreground">Total Governed</span>
              <span className="text-foreground tabular-nums">{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
