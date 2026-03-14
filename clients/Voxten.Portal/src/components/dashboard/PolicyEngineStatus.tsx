import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { listPacks, listRules } from '@/lib/complianceApi';

function formatPackName(name: string): string {
  return name.replace(/\sv\d+$/i, '').replace(/\sPatterns$/i, '');
}

export function PolicyEngineStatus() {
  const { data: packs = [], isLoading: packsLoading } = useQuery({
    queryKey: ['dashboard-policy-packs'],
    queryFn: listPacks,
    staleTime: 60_000,
  });

  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['dashboard-policy-rules'],
    queryFn: () => listRules({ activeOnly: true }),
    staleTime: 60_000,
  });

  const activePacks = packs.filter((pack) => pack.isActive);
  const totalRules = rules.length;
  const avgRulesPerPack = activePacks.length > 0 ? Math.round(totalRules / activePacks.length) : 0;
  const loading = packsLoading || rulesLoading;

  return (
    <Card className="clinical-shadow border-border flex-1">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Policy Engine</h2>
          <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px] gap-1 h-5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-subtle" />
            LIVE
          </Badge>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading policy engine state...
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {packs.map((pack) => (
                <div key={pack.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {pack.isActive ? (
                      <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={pack.isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                      {formatPackName(pack.name)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground tabular-nums">{pack.ruleCount} rules</span>
                    <span className={pack.isActive ? 'text-success' : 'text-muted-foreground'}>
                      {pack.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-border flex justify-between text-[11px] text-muted-foreground">
              <span>Active packs: <strong className="text-foreground">{activePacks.length}</strong></span>
              <span>Total active rules: <strong className="text-foreground">{totalRules}</strong></span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Avg rules per active pack: <strong className="text-foreground">{avgRulesPerPack}</strong>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
