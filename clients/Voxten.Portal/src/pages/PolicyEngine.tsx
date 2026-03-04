import { useEffect, useCallback } from 'react';
import { RegulationPacksList } from '@/components/policy-engine/RegulationPacksList';
import { PolicyRulesList } from '@/components/policy-engine/PolicyRulesList';
import { DetailPanel } from '@/components/policy-engine/DetailPanel';
import { CustomPackModal } from '@/components/policy-engine/CustomPackModal';
import { usePolicyEngineStore, regulationPacks, policyRules, sampleTestMessages } from '@/stores/policyEngineStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Plus, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useState } from 'react';

export default function PolicyEngine() {
  const { packsCollapsed, setPacksCollapsed, setDetailMode, selectedRuleId } = usePolicyEngineStore();
  const [customPackOpen, setCustomPackOpen] = useState(false);

  const totalActiveRules = regulationPacks.filter(p => p.status === 'active').reduce((s, p) => s + p.rules, 0);
  const activePacks = regulationPacks.filter(p => p.status === 'active').length;
  const totalViolations24h = policyRules.reduce((s, r) => s + r.fired24h, 0);
  const lastViolation = policyRules.filter(r => r.fired24h > 0).sort((a, b) => {
    const parseTime = (t: string) => {
      if (t.includes('m ago')) return parseInt(t);
      if (t.includes('h ago')) return parseInt(t) * 60;
      return 9999;
    };
    return parseTime(a.lastFired) - parseTime(b.lastFired);
  })[0]?.lastFired || 'None';

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      usePolicyEngineStore.getState().setDetailMode('rule-tester');
    }
    if (e.key === '/') {
      e.preventDefault();
      const searchInput = document.querySelector('[data-rule-search]') as HTMLInputElement;
      searchInput?.focus();
    }
    if (e.key === 'Escape') {
      usePolicyEngineStore.getState().setSelectedRule(null);
    }
    // Number keys 1-8 load sample messages when in tester mode
    const num = parseInt(e.key);
    if (num >= 1 && num <= 8 && usePolicyEngineStore.getState().detailMode === 'rule-tester') {
      // handled inside tester
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="space-y-3">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Policy Engine</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time compliance policy evaluation across all communication channels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => { setDetailMode('rule-create'); }}
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

      {/* Stats Strip */}
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground bg-muted/50 rounded-md px-3 py-1.5 border border-border">
        <span>Active: <strong className="text-foreground">{activePacks} packs</strong></span>
        <span className="text-border">│</span>
        <span><strong className="text-foreground">{totalActiveRules}</strong> rules</span>
        <span className="text-border">│</span>
        <span>Avg evaluation: <strong className="text-foreground">12ms</strong></span>
        <span className="text-border">│</span>
        <span>Last violation: <strong className="text-foreground">{lastViolation}</strong></span>
      </div>

      {/* Three Column Layout */}
      <div className="flex gap-3 h-[calc(100vh-210px)] min-h-[500px]">
        {/* Column 1: Regulation Packs */}
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
              <RegulationPacksList collapsed={packsCollapsed} onCreatePack={() => setCustomPackOpen(true)} />
            </div>
          </div>
        </div>

        {/* Column 2: Policy Rules */}
        <div className="flex-1 min-w-[300px]">
          <PolicyRulesList />
        </div>

        {/* Column 3: Detail Panel */}
        <div className="w-[420px] flex-shrink-0">
          <DetailPanel />
        </div>
      </div>

      <CustomPackModal open={customPackOpen} onClose={() => setCustomPackOpen(false)} />
    </div>
  );
}
