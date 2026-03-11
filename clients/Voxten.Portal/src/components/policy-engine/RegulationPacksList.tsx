import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Circle, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePolicyEngineStore } from '@/stores/policyEngineStore';
import type { PolicyPackView } from '@/lib/policyEngine';

interface Props {
  collapsed: boolean;
  onCreatePack: () => void;
  packs: PolicyPackView[];
  onTogglePack?: (packId: string) => Promise<void>;
}

export function RegulationPacksList({ collapsed, onCreatePack, packs, onTogglePack }: Props) {
  const { selectedPackId, setSelectedPack } = usePolicyEngineStore();
  const [togglingPackId, setTogglingPackId] = useState<string | null>(null);

  async function handleToggle(packId: string) {
    setTogglingPackId(packId);
    try {
      await onTogglePack?.(packId);
      setSelectedPack(packId);
    } finally {
      setTogglingPackId(null);
    }
  }

  if (collapsed) {
    return (
      <Card className="clinical-shadow border-border h-full flex flex-col items-center py-3 gap-1">
        <TooltipProvider>
          {packs.map((pack) => {
            const isSelected = selectedPackId === pack.id;
            return (
              <Tooltip key={pack.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSelectedPack(pack.id)}
                    className={cn(
                      'w-9 h-9 rounded-md flex items-center justify-center text-base transition-colors',
                      isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted',
                    )}
                  >
                    {pack.icon}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {pack.name}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </Card>
    );
  }

  return (
    <Card className="clinical-shadow border-border h-full flex flex-col">
      <div className="px-3 py-2.5 border-b border-border">
        <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Rule Packs</h2>
      </div>
      <CardContent className="p-1.5 flex-1 overflow-y-auto space-y-1">
        {packs.map((pack) => {
          const isSelected = selectedPackId === pack.id;
          const isToggling = togglingPackId === pack.id;

          return (
            <button
              key={pack.id}
              onClick={() => setSelectedPack(pack.id)}
              className={cn(
                'w-full text-left p-2.5 rounded-md transition-all border',
                isSelected ? 'bg-primary/8 border-primary/15 border-l-4 border-l-primary' : 'border-transparent hover:bg-muted/60',
              )}
            >
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-md bg-muted/80 flex items-center justify-center text-base flex-shrink-0">
                  {pack.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-foreground leading-tight">{pack.name}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[8px] px-1 py-0 h-3.5',
                        pack.isActive ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground border-border',
                      )}
                    >
                      {pack.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] text-muted-foreground tabular-nums">{pack.ruleCount} rules</span>
                    <span className="text-[9px] text-border">•</span>
                    <span className="text-[9px] text-muted-foreground">{pack.sector}</span>
                  </div>

                  <div className="mt-1 text-[9px] text-muted-foreground">
                    Retention: {pack.retentionDays} days
                  </div>

                  {pack.description ? (
                    <p className="mt-1 line-clamp-2 text-[9px] text-muted-foreground">{pack.description}</p>
                  ) : null}

                  <div className="mt-2 flex items-center gap-2">
                    {pack.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[9px] text-success">
                        <CheckCircle className="w-2.5 h-2.5" />
                        Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
                        <Circle className="w-2.5 h-2.5" />
                        Disabled
                      </span>
                    )}
                    {onTogglePack ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleToggle(pack.id);
                        }}
                        disabled={isToggling}
                        className="text-[9px] text-primary hover:underline disabled:no-underline disabled:opacity-70"
                      >
                        {isToggling ? (
                          <span className="inline-flex items-center gap-1">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            Saving...
                          </span>
                        ) : pack.isActive ? 'Disable pack' : 'Enable pack'}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        <button
          onClick={onCreatePack}
          className="w-full p-2.5 rounded-md text-left border border-dashed border-primary/30 hover:bg-primary/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5 text-primary" />
            <div>
              <span className="text-[11px] font-medium text-primary">Create Rule Pack</span>
              <p className="text-[9px] text-muted-foreground mt-0.5">Create a backend-backed pack definition</p>
            </div>
          </div>
        </button>
      </CardContent>
    </Card>
  );
}
