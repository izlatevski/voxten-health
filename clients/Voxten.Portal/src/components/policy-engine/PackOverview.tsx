import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePolicyEngineStore, regulationPacks, policyRules } from '@/stores/policyEngineStore';
import { Settings, Download, History } from 'lucide-react';

export function PackOverview() {
  const { selectedPackId } = usePolicyEngineStore();
  const pack = regulationPacks.find(p => p.id === selectedPackId);

  if (!pack) {
    return (
      <Card className="clinical-shadow border-border h-full flex items-center justify-center">
        <p className="text-xs text-muted-foreground text-center px-6">Select a regulation pack to view overview</p>
      </Card>
    );
  }

  const packRules = policyRules.filter(r => r.packId === pack.id);
  const activeRules = packRules.filter(r => r.enabled).length;
  const pausedRules = packRules.length - activeRules;
  const totalFired30d = packRules.reduce((s, r) => s + (r.fired30d || 0), 0);

  // Top firing rules
  const topFiring = [...packRules].sort((a, b) => b.fired24h - a.fired24h).filter(r => r.fired24h > 0).slice(0, 5);

  // Severity distribution
  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  packRules.forEach(r => { severityCounts[r.severity]++; });

  return (
    <Card className="clinical-shadow border-border h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{pack.name}</h2>
        <p className="text-[10px] text-muted-foreground mt-0.5">Regulation Pack Overview</p>
      </div>
      <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* Status Grid */}
        <div className="space-y-2">
          <Row label="Status" value={pack.status === 'active' ? '● Active' : pack.status} valueClass={pack.status === 'active' ? 'text-success' : ''} />
          <Row label="Rules" value={`${packRules.length} (${activeRules} active, ${pausedRules} paused)`} />
          <Row label="Channels Covered" value={`All (5/5)`} />
          {pack.activeSince && <Row label="Active Since" value={`${pack.activeSince}`} />}
          <Row label="Last Updated" value={pack.lastUpdated || 'N/A'} />
          <Row label="Last Evaluated" value={pack.lastEvaluated || 'N/A'} />
        </div>

        {/* Description */}
        {pack.description && (
          <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-3">
            {pack.description}
          </p>
        )}

        {/* Violations 30d */}
        <div className="border-t border-border pt-3">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Violations (Last 30 Days)</h3>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-stat/60 rounded-full"
                style={{ width: `${Math.min(100, (totalFired30d / Math.max(1, packRules.length * 10)) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-bold text-foreground tabular-nums">{totalFired30d} total</span>
          </div>
          <div className="flex gap-3 text-[10px] text-muted-foreground">
            <span>Critical: <strong className="text-stat">{severityCounts.critical}</strong></span>
            <span>High: <strong className="text-urgent">{severityCounts.high}</strong></span>
            <span>Medium: <strong className="text-primary">{severityCounts.medium}</strong></span>
            <span>Low: <strong className="text-muted-foreground">{severityCounts.low}</strong></span>
          </div>
          <div className="text-[10px] text-success mt-1">
            Resolution Rate: 100%
          </div>
        </div>

        {/* Top Firing Rules */}
        {topFiring.length > 0 && (
          <div className="border-t border-border pt-3">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top Firing Rules (24h)</h3>
            <div className="space-y-1">
              {topFiring.map((r, i) => (
                <div key={r.id} className="flex items-center justify-between text-[11px]">
                  <span className="text-foreground">{i + 1}. {r.name}</span>
                  <span className="text-muted-foreground tabular-nums font-mono">({r.fired24h}×)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-border pt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5">
            <Settings className="w-3 h-3" /> Edit Pack Settings
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5">
            <Download className="w-3 h-3" /> Export Rules
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5">
            <History className="w-3 h-3" /> View Audit History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={valueClass || 'text-foreground font-medium'}>{value}</span>
    </div>
  );
}
