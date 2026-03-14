import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, PanelLeftClose, PanelLeft, Loader2, Braces, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatternLibrariesList } from '@/components/policy-engine/PatternLibrariesList';
import { PatternLibraryOverview } from '@/components/policy-engine/PatternLibraryOverview';
import { RegulationPacksList } from '@/components/policy-engine/RegulationPacksList';
import { PolicyRulesList } from '@/components/policy-engine/PolicyRulesList';
import { DetailPanel } from '@/components/policy-engine/DetailPanel';
import { CustomPackModal } from '@/components/policy-engine/CustomPackModal';
import { listPacks, listPatternLibraries, listRules, togglePack } from '@/lib/complianceApi';
import { toPolicyPackView, toPolicyPatternLibraryView, toPolicyRuleView } from '@/lib/policyEngine';
import { usePolicyEngineStore } from '@/stores/policyEngineStore';

export default function PolicyEngine() {
  const {
    workspaceMode,
    packsCollapsed,
    setPacksCollapsed,
    setDetailMode,
    setWorkspaceMode,
    selectedPackId,
    selectedPatternLibraryId,
    setSelectedPack,
    setSelectedPatternLibrary,
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

  const { data: patternLibrariesData = [], isLoading: patternLibrariesLoading } = useQuery({
    queryKey: ['compliance-pattern-libraries'],
    queryFn: listPatternLibraries,
    staleTime: 30_000,
  });

  const packs = useMemo(() => packsData.map(toPolicyPackView), [packsData]);
  const rules = useMemo(() => rulesData.map(toPolicyRuleView), [rulesData]);
  const patternLibraries = useMemo(
    () => patternLibrariesData.map(toPolicyPatternLibraryView),
    [patternLibrariesData],
  );

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
    if (workspaceMode !== 'patterns') return;

    if (selectedPatternLibraryId) {
      const selectedStillExists = patternLibraries.some((library) => library.id === selectedPatternLibraryId);
      if (!selectedStillExists) {
        setSelectedPatternLibrary(patternLibraries[0]?.id ?? null);
      }
      return;
    }

    if (patternLibraries.length > 0) {
      setSelectedPatternLibrary(patternLibraries[0].id);
    }
  }, [patternLibraries, selectedPatternLibraryId, setSelectedPatternLibrary, workspaceMode]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
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
  const totalPatternDefinitions = patternLibraries.reduce((sum, library) => sum + library.patternCount, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Policy Engine</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Backend-backed rule packs, evaluation definitions, and shared deterministic pattern libraries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-muted/30 p-1">
            <button
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${workspaceMode === 'rules' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setWorkspaceMode('rules')}
            >
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Rules
              </span>
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${workspaceMode === 'patterns' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setWorkspaceMode('patterns')}
            >
              <span className="inline-flex items-center gap-1.5">
                <Braces className="w-3.5 h-3.5" />
                Pattern Libraries
              </span>
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setDetailMode(workspaceMode === 'rules' ? 'rule-create' : 'pattern-library-create')}
          >
            <Plus className="w-3.5 h-3.5" />
            {workspaceMode === 'rules' ? 'Create Rule' : 'Create Library'}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[11px] text-muted-foreground bg-muted/50 rounded-md px-3 py-1.5 border border-border">
        {workspaceMode === 'rules' ? (
          packsLoading ? (
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
          )
        ) : patternLibrariesLoading ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading pattern libraries...
          </span>
        ) : (
          <>
            <span>Libraries: <strong className="text-foreground">{patternLibraries.length}</strong></span>
            <span className="text-border">│</span>
            <span>Total patterns: <strong className="text-foreground">{totalPatternDefinitions}</strong></span>
            <span className="text-border">│</span>
            <span>
              Selected library:{' '}
              <strong className="text-foreground">
                {patternLibraries.find((library) => library.id === selectedPatternLibraryId)?.name ?? 'None'}
              </strong>
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
              {workspaceMode === 'rules' ? (
                <RegulationPacksList
                  collapsed={packsCollapsed}
                  onCreatePack={() => setCustomPackOpen(true)}
                  packs={packs}
                  onTogglePack={async (packId) => {
                    await togglePack(packId);
                    await queryClient.invalidateQueries({ queryKey: ['compliance-packs'] });
                  }}
                />
              ) : (
                <PatternLibraryOverview libraries={patternLibraries} />
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-[300px]">
          {workspaceMode === 'rules' ? (
            <PolicyRulesList packs={packs} rules={rules} isLoading={rulesLoading} />
          ) : (
            <PatternLibrariesList libraries={patternLibraries} isLoading={patternLibrariesLoading} />
          )}
        </div>

        <div className="w-[420px] flex-shrink-0">
          <DetailPanel
            packs={packs}
            rules={rules}
            patternLibraries={patternLibraries}
            onRuleCreated={() => {
              queryClient.invalidateQueries({ queryKey: ['compliance-rules', selectedPackId] });
              queryClient.invalidateQueries({ queryKey: ['compliance-packs'] });
            }}
            onRuleChanged={() => {
              queryClient.invalidateQueries({ queryKey: ['compliance-rules', selectedPackId] });
              queryClient.invalidateQueries({ queryKey: ['compliance-packs'] });
            }}
            onPatternLibraryChanged={() => {
              queryClient.invalidateQueries({ queryKey: ['compliance-pattern-libraries'] });
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
