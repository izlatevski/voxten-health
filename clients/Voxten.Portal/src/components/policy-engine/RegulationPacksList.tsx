import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { regulationPacks, usePolicyEngineStore } from '@/stores/policyEngineStore';
import { CheckCircle, Circle, Clock, Plus, Lock, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface Props {
  collapsed: boolean;
  onCreatePack: () => void;
}

export function RegulationPacksList({ collapsed, onCreatePack }: Props) {
  const { selectedPackId, setSelectedPack, enablePack } = usePolicyEngineStore();
  const [enablingPack, setEnablingPack] = useState<string | null>(null);

  const handleEnablePack = (packId: string) => {
    setEnablingPack(packId);
    setTimeout(() => {
      enablePack(packId);
      setEnablingPack(null);
      setSelectedPack(packId);
    }, 1200);
  };

  if (collapsed) {
    return (
      <Card className="clinical-shadow border-border h-full flex flex-col items-center py-3 gap-1">
        <TooltipProvider>
          {regulationPacks.map((pack) => {
            const isSelected = selectedPackId === pack.id;
            const isComing = pack.status === 'coming';
            return (
              <Tooltip key={pack.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => !isComing && pack.status !== 'available' && setSelectedPack(pack.id)}
                    disabled={isComing}
                    className={cn(
                      'w-9 h-9 rounded-md flex items-center justify-center text-base transition-colors',
                      isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted',
                      isComing && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    {pack.icon}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">{pack.name}</TooltipContent>
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
        <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Regulation Packs</h2>
      </div>
      <CardContent className="p-1.5 flex-1 overflow-y-auto space-y-1">
        {regulationPacks.map((pack) => {
          const isSelected = selectedPackId === pack.id;
          const isActive = pack.status === 'active';
          const isAvailable = pack.status === 'available';
          const isComing = pack.status === 'coming';
          const isEnabling = enablingPack === pack.id;
          const isFedramp = pack.id === 'fedramp';

          return (
            <button
              key={pack.id}
              onClick={() => {
                if (isComing || isFedramp) return;
                if (isAvailable && !isEnabling) return handleEnablePack(pack.id);
                setSelectedPack(pack.id);
              }}
              disabled={isComing || isEnabling}
              className={cn(
                'w-full text-left p-2.5 rounded-md transition-all',
                isSelected ? 'bg-primary/8 border-l-4 border-l-primary border border-primary/15' : 'border-l-4 border-l-transparent border border-transparent hover:bg-muted/60',
                (isComing || isFedramp) && 'opacity-45 cursor-not-allowed'
              )}
            >
              <div className="flex items-start gap-2">
                <span className="text-sm mt-0.5">{pack.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isActive ? (
                      <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
                    ) : isFedramp ? (
                      <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <Circle className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="text-[11px] font-medium text-foreground leading-tight">{pack.name}</span>
                  </div>

                  {isActive && (
                    <>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-success/10 text-success border-success/20">
                          Active
                        </Badge>
                        <span className="text-[9px] text-muted-foreground tabular-nums">{pack.rules} rules</span>
                      </div>
                      <div className="mt-1.5 space-y-0.5">
                        {pack.violations > 0 ? (
                          <div className="text-[9px] text-stat font-medium">
                            Violations (24h): {pack.violations}
                          </div>
                        ) : (
                          <div className="text-[9px] text-success">
                            Violations (24h): 0
                          </div>
                        )}
                        {pack.lastEvaluated && (
                          <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            Last evaluated: {pack.lastEvaluated}
                          </div>
                        )}
                        {pack.coverage && (
                          <div className="text-[9px] text-muted-foreground">
                            Coverage: {pack.coverage}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {isAvailable && !isFedramp && (
                    <div className="mt-1.5">
                      {isEnabling ? (
                        <div className="flex items-center gap-1 text-[9px] text-primary">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          Enabling {pack.rules} rules...
                        </div>
                      ) : (
                        <span className="text-[9px] text-primary font-medium cursor-pointer hover:underline">
                          Toggle to enable
                        </span>
                      )}
                    </div>
                  )}

                  {isFedramp && (
                    <div className="mt-1.5 text-[9px] text-muted-foreground italic">
                      Requires Confidential Computing tier
                    </div>
                  )}

                  {isComing && (
                    <Badge variant="outline" className="mt-1.5 text-[8px] px-1 py-0 h-3.5 bg-muted text-muted-foreground border-border">
                      Coming Q3 2026
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {/* Add Custom Pack */}
        <button
          onClick={onCreatePack}
          className="w-full p-2.5 rounded-md text-left border border-dashed border-primary/30 hover:bg-primary/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5 text-primary" />
            <div>
              <span className="text-[11px] font-medium text-primary">Create Custom Pack</span>
              <p className="text-[9px] text-muted-foreground mt-0.5">Build rules from your organization's policies</p>
            </div>
          </div>
        </button>
      </CardContent>
    </Card>
  );
}
