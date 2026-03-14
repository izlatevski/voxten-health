import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { AuditSummary } from '@/lib/complianceApi';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hours = Array.from({ length: 24 }, (_, i) => i);

function cellColor(v: number): string {
  if (v === 0) return 'bg-success/20';
  if (v === 1) return 'bg-success/40';
  if (v <= 3) return 'bg-urgent/40';
  return 'bg-stat/60';
}

interface Props {
  audits: AuditSummary[];
}

export function ViolationHeatmap({ audits }: Props) {
  const hasViolations = audits.length > 0;

  const heatmap = useMemo(() => {
    const data = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));

    for (const audit of audits) {
      const ts = new Date(audit.createdAt || audit.messageTimestamp);
      if (Number.isNaN(ts.getTime())) continue;
      data[ts.getDay()][ts.getHours()] += 1;
    }

    return data;
  }, [audits]);

  const peak = useMemo(() => {
    let max = 0;
    let peakDay = days[0];
    let peakHour = 0;

    heatmap.forEach((row, dayIdx) => {
      row.forEach((value, hourIdx) => {
        if (value > max) {
          max = value;
          peakDay = days[dayIdx];
          peakHour = hourIdx;
        }
      });
    });

    return { max, peakDay, peakHour };
  }, [heatmap]);

  return (
    <Card className="clinical-shadow border-border flex-1">
      <CardContent className="p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">Governance Violations — 7-Day Heat Map</h2>
        {!hasViolations ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8">
            <p className="text-sm font-medium text-foreground">No violation activity in the last 7 days.</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              The heat map will populate once flagged, blocked, or redacted audit events are recorded.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-[400px]">
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

                {days.map((day, dayIdx) => (
                  <div key={day} className="flex items-center gap-1 mb-0.5">
                    <span className="text-[10px] text-muted-foreground w-8 text-right">{day}</span>
                    <div className="flex flex-1 gap-px">
                      {hours.map((hour) => (
                        <div
                          key={hour}
                          className={cn('flex-1 h-4 rounded-[2px] transition-colors', cellColor(heatmap[dayIdx][hour]))}
                          title={`${day} ${hour.toString().padStart(2, '0')}:00 — ${heatmap[dayIdx][hour]} violations`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground mt-3">
              <strong className="text-foreground">Peak:</strong> {peak.peakDay} {peak.peakHour.toString().padStart(2, '0')}:00 with {peak.max} violation{peak.max === 1 ? '' : 's'}
            </p>

            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-success/20" /><span className="text-[9px] text-muted-foreground">0</span></div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-success/40" /><span className="text-[9px] text-muted-foreground">1</span></div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-urgent/40" /><span className="text-[9px] text-muted-foreground">2-3</span></div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-stat/60" /><span className="text-[9px] text-muted-foreground">4+</span></div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
