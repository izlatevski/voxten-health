import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = Array.from({ length: 24 }, (_, i) => i);

// Generate a fixed heatmap: most cells green, a few amber/red clusters
function generateHeatmap(): number[][] {
  const data: number[][] = [];
  for (let d = 0; d < 7; d++) {
    const row: number[] = [];
    for (let h = 0; h < 24; h++) {
      // Baseline: 0-1 violations
      let v = Math.random() < 0.85 ? 0 : 1;
      // Tuesday 14-15 (shift change hotspot)
      if (d === 1 && (h === 14 || h === 15)) v = 3 + Math.floor(Math.random() * 4);
      // Friday 17 (end of week rush)
      if (d === 4 && h === 17) v = 2 + Math.floor(Math.random() * 2);
      // Night hours: always 0
      if (h < 6 || h > 22) v = 0;
      row.push(v);
    }
    data.push(row);
  }
  return data;
}

function cellColor(v: number): string {
  if (v === 0) return 'bg-success/20';
  if (v === 1) return 'bg-success/40';
  if (v <= 3) return 'bg-urgent/40';
  return 'bg-stat/60';
}

export function ViolationHeatmap() {
  const heatmap = useMemo(() => generateHeatmap(), []);

  return (
    <Card className="clinical-shadow border-border flex-1">
      <CardContent className="p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">Governance Violations — 7-Day Heat Map</h2>
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            {/* Hour labels */}
            <div className="flex ml-10 mb-1">
              {hours.filter((h) => h % 3 === 0).map((h) => (
                <span
                  key={h}
                  className="text-[9px] text-muted-foreground tabular-nums"
                  style={{ width: `${100 / 8}%` }}
                >
                  {h.toString().padStart(2, '0')}
                </span>
              ))}
            </div>
            {/* Grid */}
            {days.map((day, d) => (
              <div key={day} className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px] text-muted-foreground w-8 text-right">{day}</span>
                <div className="flex flex-1 gap-px">
                  {hours.map((h) => (
                    <div
                      key={h}
                      className={cn(
                        'flex-1 h-4 rounded-[2px] transition-colors',
                        cellColor(heatmap[d][h])
                      )}
                      title={`${day} ${h}:00 — ${heatmap[d][h]} violations`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">
          Peak: <strong className="text-foreground">Tuesday 2-3 PM</strong> (shift change) — 6 violations
        </p>
        {/* Legend */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-success/20" /><span className="text-[9px] text-muted-foreground">0</span></div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-success/40" /><span className="text-[9px] text-muted-foreground">1</span></div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-urgent/40" /><span className="text-[9px] text-muted-foreground">2-3</span></div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-stat/60" /><span className="text-[9px] text-muted-foreground">4+</span></div>
        </div>
      </CardContent>
    </Card>
  );
}
