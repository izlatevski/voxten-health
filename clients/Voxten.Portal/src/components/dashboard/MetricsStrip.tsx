import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ShieldCheck, BarChart3, AlertTriangle, Bot, Zap } from 'lucide-react';

interface Metric {
  title: string;
  value: number;
  format: 'number' | 'percent' | 'ms';
  prefix?: string;
  suffix?: string;
  trend: string;
  trendUp: boolean;
  trendGood: boolean;
  icon: React.ElementType;
  incrementRange: [number, number];
  incrementInterval: [number, number];
}

const metrics: Metric[] = [
  {
    title: 'Events Governed (24h)',
    value: 48291,
    format: 'number',
    trend: '+2,847',
    trendUp: true,
    trendGood: true,
    icon: ShieldCheck,
    incrementRange: [1, 3],
    incrementInterval: [5000, 8000],
  },
  {
    title: 'Policy Checks',
    value: 48291,
    format: 'number',
    suffix: ' (100%)',
    trend: '100% coverage',
    trendUp: true,
    trendGood: true,
    icon: BarChart3,
    incrementRange: [1, 3],
    incrementInterval: [5000, 8000],
  },
  {
    title: 'Violations Caught',
    value: 23,
    format: 'number',
    trend: '-4 vs yesterday',
    trendUp: false,
    trendGood: true,
    icon: AlertTriangle,
    incrementRange: [0, 0],
    incrementInterval: [30000, 60000],
  },
  {
    title: 'AI Comms Governed',
    value: 12847,
    format: 'number',
    trend: '+340% (90d)',
    trendUp: true,
    trendGood: true,
    icon: Bot,
    incrementRange: [1, 2],
    incrementInterval: [6000, 10000],
  },
  {
    title: 'Avg Policy Latency',
    value: 47,
    format: 'ms',
    prefix: '<',
    trend: '-3ms',
    trendUp: false,
    trendGood: true,
    icon: Zap,
    incrementRange: [0, 0],
    incrementInterval: [15000, 20000],
  },
];

function formatValue(value: number, format: string, prefix?: string, suffix?: string): string {
  let str = '';
  if (prefix) str += prefix;
  if (format === 'number') str += value.toLocaleString();
  else if (format === 'ms') str += `${value}ms`;
  else if (format === 'percent') str += `${value}%`;
  if (suffix) str += suffix;
  return str;
}

export function MetricsStrip() {
  const [values, setValues] = useState(metrics.map((m) => m.value));

  useEffect(() => {
    const timers = metrics.map((m, i) => {
      if (m.incrementRange[0] === 0 && m.incrementRange[1] === 0) return null;
      const interval = m.incrementInterval[0] + Math.random() * (m.incrementInterval[1] - m.incrementInterval[0]);
      return setInterval(() => {
        const inc = m.incrementRange[0] + Math.floor(Math.random() * (m.incrementRange[1] - m.incrementRange[0] + 1));
        setValues((prev) => {
          const next = [...prev];
          next[i] += inc;
          // Keep Policy Checks in sync with Events Governed
          if (i === 0) next[1] = next[0];
          return next;
        });
      }, interval);
    });
    return () => timers.forEach((t) => t && clearInterval(t));
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {metrics.map((m, i) => (
        <Card key={m.title} className="clinical-shadow border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <m.icon className="w-4 h-4 text-muted-foreground" />
              <span className={`flex items-center gap-0.5 text-[11px] font-medium ${m.trendGood ? 'text-success' : 'text-stat'}`}>
                {m.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {m.trend}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {formatValue(values[i], m.format, m.prefix, m.suffix)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{m.title}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
