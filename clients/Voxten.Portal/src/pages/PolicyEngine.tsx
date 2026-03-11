import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, Plus, PanelLeftClose, PanelLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RegulationPacksList } from '@/components/policy-engine/RegulationPacksList';
import { PolicyRulesList } from '@/components/policy-engine/PolicyRulesList';
import { DetailPanel } from '@/components/policy-engine/DetailPanel';
import { CustomPackModal } from '@/components/policy-engine/CustomPackModal';
import { listPacks, listRules, togglePack } from '@/lib/complianceApi';
import { toPolicyPackView, toPolicyRuleView } from '@/lib/policyEngine';
import { usePolicyEngineStore } from '@/stores/policyEngineStore';

export default function PolicyEngine() {
  const {
    packsCollapsed,
    setPacksCollapsed,
    setDetailMode,
    selectedPackId,
    setSelectedPack,
  } = usePolicyEngineStore();
  const [customPackOpen, setCustomPackOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: packsData = [], isLoading: packsLoading } = useQuery({
    queryKey: ['compliance-packs'],
    queryFn: listPacks,
    staleTime: 60_000,
  });

  const { data: rulesData = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['compliance-rules', selectedPackId],
    queryFn: () => listRules({ packId: selectedPackId ?? undefined }),
    enabled: !!selectedPackId,
    staleTime: 30_000,
  });

  const packs = useMemo(() => packsData.map(toPolicyPackView), [packsData]);
  const rules = useMemo(() => rulesData.map(toPolicyRuleView), [rulesData]);

  useEffect(() => {
    if (selectedPackId) {
      const selectedStillExists = packs.some((pack) => pack.id === selectedPackId);
      if (!selectedStillExists) {
        setSelectedPack(packs[0]?.id ?? null);
      }
      return;
    }

    const firstActive = packs.find((pack) => pack.isActive);
    const firstAvailable = packs[0];
    if (firstActive || firstAvailable) {
      setSelectedPack(firstActive?.id ?? firstAvailable?.id ?? null);
    }
  }, [packs, selectedPackId, setSelectedPack]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        usePolicyEngineStore.getState().setDetailMode('rule-tester');
      }
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('[data-rule-search]') as HTMLInputElement | null;
        searchInput?.focus();
      }
      if (e.key === 'Escape') {
        usePolicyEngineStore.getState().setSelectedRule(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activePackCount = packs.filter((pack) => pack.isActive).length;
  const totalConfiguredRules = packs.reduce((sum, pack) => sum + pack.ruleCount, 0);
  const selectedPack = packs.find((pack) => pack.id === selectedPackId) ?? null;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Policy Engine</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Backend-backed rule packs, rule versions, and evaluation definitions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setDetailMode('rule-create')}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Rule
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setDetailMode('rule-tester')}
          >
            <Play className="w-3.5 h-3.5" />
            Test a Rule
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[11px] text-muted-foreground bg-muted/50 rounded-md px-3 py-1.5 border border-border">
        {packsLoading ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading packs...
          </span>
        ) : (
          <>
            <span>Active packs: <strong className="text-foreground">{activePackCount}</strong></span>
            <span className="text-border">│</span>
            <span>Total configured rules: <strong className="text-foreground">{totalConfiguredRules}</strong></span>
            <span className="text-border">│</span>
            <span>
              Selected pack:{' '}
              <strong className="text-foreground">{selectedPack?.name ?? 'None'}</strong>
            </span>
          </>
        )}
      </div>

      <div className="flex gap-3 h-[calc(100vh-210px)] min-h-[500px]">
        <div className={`flex-shrink-0 transition-all duration-200 ${packsCollapsed ? 'w-[52px]' : 'w-[240px]'}`}>
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-end mb-1">
              <button
                onClick={() => setPacksCollapsed(!packsCollapsed)}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
                title={packsCollapsed ? 'Expand packs' : 'Collapse packs'}
              >
                {packsCollapsed ? <PanelLeft className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <RegulationPacksList
                collapsed={packsCollapsed}
                onCreatePack={() => setCustomPackOpen(true)}
                packs={packs}
                onTogglePack={async (packId) => {
                  await togglePack(packId);
                  await queryClient.invalidateQueries({ queryKey: ['compliance-packs'] });
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-[300px]">
          <PolicyRulesList packs={packs} rules={rules} isLoading={rulesLoading} />
        </div>

        <div className="w-[420px] flex-shrink-0">
          <DetailPanel
            packs={packs}
            rules={rules}
            onRuleCreated={() => {
              queryClient.invalidateQueries({ queryKey: ['compliance-rules', selectedPackId] });
              queryClient.invalidateQueries({ queryKey: ['compliance-packs'] });
            }}
            onRuleChanged={() => {
              queryClient.invalidateQueries({ queryKey: ['compliance-rules', selectedPackId] });
              queryClient.invalidateQueries({ queryKey: ['compliance-packs'] });
            }}
          />
        </div>
      </div>

      <CustomPackModal
        open={customPackOpen}
        onClose={() => setCustomPackOpen(false)}
        onCreated={async () => {
          await queryClient.invalidateQueries({ queryKey: ['compliance-packs'] });
        }}
      />
    </div>
  );
}
