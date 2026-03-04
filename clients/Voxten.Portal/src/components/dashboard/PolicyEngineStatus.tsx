import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle } from 'lucide-react';

interface RegPack {
  name: string;
  status: 'active' | 'available' | 'coming';
  rules?: number;
  violations?: number;
}

const packs: RegPack[] = [
  { name: 'HIPAA Privacy & Security', status: 'active', rules: 250, violations: 3 },
  { name: 'Joint Commission NPG 2026', status: 'active', rules: 42, violations: 0 },
  { name: '42 CFR Part 2 (Behavioral)', status: 'active', rules: 89, violations: 0 },
  { name: '21st Century Cures Act', status: 'active', rules: 34, violations: 0 },
  { name: 'CMS Conditions of Participation', status: 'active', rules: 67, violations: 0 },
  { name: 'FedRAMP High', status: 'available' },
];

export function PolicyEngineStatus() {
  const totalRules = packs.reduce((s, p) => s + (p.rules || 0), 0);

  return (
    <Card className="clinical-shadow border-border flex-1">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Policy Engine</h2>
          <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px] gap-1 h-5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-subtle" />
            ACTIVE
          </Badge>
        </div>
        <div className="space-y-2">
          {packs.map((p) => (
            <div key={p.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {p.status === 'active' ? (
                  <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                )}
                <span className={p.status === 'active' ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                  {p.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {p.status === 'active' ? (
                  <>
                    <span className="text-muted-foreground tabular-nums">{p.rules} rules</span>
                    <span className="text-success tabular-nums">0 ▲</span>
                  </>
                ) : (
                  <span className="text-muted-foreground italic">Available</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border flex justify-between text-[11px] text-muted-foreground">
          <span>Total active rules: <strong className="text-foreground">{totalRules}</strong></span>
          <span>Avg eval: <strong className="text-foreground">12ms</strong></span>
        </div>
      </CardContent>
    </Card>
  );
}
