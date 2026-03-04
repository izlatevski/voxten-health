import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { usePolicyEngineStore, policyRules, regulationPacks, type RuleSeverity, type RuleAction, type AnalysisMethod } from '@/stores/policyEngineStore';
import { Search, Brain, FileCode2, ChevronRight } from 'lucide-react';

const severityBorder: Record<RuleSeverity, string> = {
  critical: 'border-l-stat',
  high: 'border-l-urgent',
  medium: 'border-l-primary',
  low: 'border-l-muted-foreground/30',
};

const severityLabel: Record<RuleSeverity, { text: string; className: string }> = {
  critical: { text: '■■■ Critical', className: 'text-stat' },
  high: { text: '■■ High', className: 'text-urgent' },
  medium: { text: '■ Medium', className: 'text-primary' },
  low: { text: '○ Low', className: 'text-muted-foreground' },
};

const actionDisplay: Record<RuleAction, { icon: string; label: string; className: string }> = {
  block: { icon: '✕', label: 'BLOCK', className: 'text-stat' },
  flag: { icon: '⚠', label: 'FLAG', className: 'text-urgent' },
  redact: { icon: '↺', label: 'REDACT', className: 'text-ehr-part2' },
  log: { icon: '○', label: 'LOG', className: 'text-muted-foreground' },
  escalate: { icon: '↑', label: 'ESCALATE', className: 'text-stat' },
};

export function PolicyRulesList() {
  const {
    selectedPackId, selectedRuleId, setSelectedRule,
    searchQuery, setSearchQuery,
    severityFilter, setSeverityFilter,
    actionFilter, setActionFilter,
    methodFilter, setMethodFilter,
  } = usePolicyEngineStore();

  const pack = regulationPacks.find((p) => p.id === selectedPackId);
  const filteredRules = policyRules.filter((r) => {
    if (r.packId !== selectedPackId) return false;
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase()) && !r.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (severityFilter !== 'all' && r.severity !== severityFilter) return false;
    if (actionFilter !== 'all' && r.action !== actionFilter) return false;
    if (methodFilter !== 'all' && r.analysisMethod !== methodFilter) return false;
    return true;
  });

  // Count rules by filter for display
  const allPackRules = policyRules.filter(r => r.packId === selectedPackId);
  const actionCounts: Record<string, number> = {};
  allPackRules.forEach(r => { actionCounts[r.action] = (actionCounts[r.action] || 0) + 1; });

  if (!selectedPackId || !pack) {
    return (
      <Card className="clinical-shadow border-border h-full flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Select a regulation pack to view rules</p>
      </Card>
    );
  }

  return (
    <Card className="clinical-shadow border-border h-full flex flex-col">
      {/* Breadcrumb + header */}
      <div className="px-3 py-2 border-b border-border space-y-1.5">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-wrap">
          <span className="cursor-pointer hover:text-foreground" onClick={() => { usePolicyEngineStore.getState().setSelectedPack(null); }}>All Packs</span>
          <ChevronRight className="w-2.5 h-2.5" />
          <span className="text-foreground font-medium">{pack.name}</span>
          <span className="text-muted-foreground">({pack.rules} rules)</span>
          <ChevronRight className="w-2.5 h-2.5" />
          <span className="text-foreground">Showing {filteredRules.length} rules</span>
        </div>
        {/* Filters */}
        <div className="flex gap-1.5">
          <div className="flex-1 relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              data-rule-search
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rules..."
              className="h-7 text-[11px] pl-7"
            />
          </div>
          <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as RuleSeverity | 'all')}>
            <SelectTrigger className="h-7 text-[11px] w-[90px]"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[11px]">All</SelectItem>
              <SelectItem value="critical" className="text-[11px]">Critical</SelectItem>
              <SelectItem value="high" className="text-[11px]">High</SelectItem>
              <SelectItem value="medium" className="text-[11px]">Medium</SelectItem>
              <SelectItem value="low" className="text-[11px]">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as RuleAction | 'all')}>
            <SelectTrigger className="h-7 text-[11px] w-[90px]"><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[11px]">All</SelectItem>
              <SelectItem value="block" className="text-[11px]">Block ({actionCounts['block'] || 0})</SelectItem>
              <SelectItem value="flag" className="text-[11px]">Flag ({actionCounts['flag'] || 0})</SelectItem>
              <SelectItem value="redact" className="text-[11px]">Redact ({actionCounts['redact'] || 0})</SelectItem>
              <SelectItem value="log" className="text-[11px]">Log ({actionCounts['log'] || 0})</SelectItem>
              <SelectItem value="escalate" className="text-[11px]">Escalate ({actionCounts['escalate'] || 0})</SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={(v) => setMethodFilter(v as AnalysisMethod | 'all')}>
            <SelectTrigger className="h-7 text-[11px] w-[90px]"><SelectValue placeholder="Method" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[11px]">All</SelectItem>
              <SelectItem value="ai" className="text-[11px]">AI Semantic</SelectItem>
              <SelectItem value="pattern" className="text-[11px]">Pattern</SelectItem>
              <SelectItem value="both" className="text-[11px]">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Rule cards */}
      <CardContent className="p-1.5 flex-1 overflow-y-auto space-y-1">
        {filteredRules.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No rules match your filters</p>
        ) : (
          filteredRules.map((rule) => {
            const isSelected = selectedRuleId === rule.id;
            const hasActiveViolation = rule.fired24h > 0 && rule.lastFired.includes('m ago');
            const ad = actionDisplay[rule.action];
            const sv = severityLabel[rule.severity];

            return (
              <button
                key={rule.id}
                onClick={() => setSelectedRule(rule.id)}
                className={cn(
                  'w-full text-left p-2.5 rounded-md border-l-4 transition-all border border-transparent',
                  severityBorder[rule.severity],
                  isSelected ? 'bg-primary/5 ring-1 ring-primary/20 border-primary/10' : 'hover:bg-muted/60',
                  hasActiveViolation && !isSelected && 'animate-pulse-subtle'
                )}
              >
                {/* Row 1: Name + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-foreground leading-tight">{rule.name}</p>
                    <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{rule.id}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[8px] px-1 py-0 h-3.5 flex-shrink-0 uppercase font-semibold',
                      hasActiveViolation
                        ? 'bg-urgent/10 text-urgent border-urgent/20'
                        : 'bg-success/10 text-success border-success/20'
                    )}
                  >
                    {hasActiveViolation ? `⚠ ${rule.fired24h} ACTIVE` : '● ACTIVE'}
                  </Badge>
                </div>

                {/* Row 2: Trigger */}
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                  Trigger: {rule.trigger}
                </p>

                {/* Row 3: Method + Action */}
                <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                  <span className="text-muted-foreground">Method:</span>
                  <span className="flex items-center gap-1">
                    {(rule.analysisMethod === 'ai' || rule.analysisMethod === 'both') && (
                      <span className="flex items-center gap-0.5 text-ehr-part2">
                        <Brain className="w-3 h-3" /> AI
                      </span>
                    )}
                    {rule.analysisMethod === 'both' && <span className="text-muted-foreground">+</span>}
                    {(rule.analysisMethod === 'pattern' || rule.analysisMethod === 'both') && (
                      <span className="flex items-center gap-0.5 text-primary">
                        <FileCode2 className="w-3 h-3" /> Pattern
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1 mt-1 text-[10px]">
                  <span className="text-muted-foreground">Action:</span>
                  <span className={cn('font-semibold', ad.className)}>
                    {ad.icon} {ad.label}
                  </span>
                  {rule.notification && (
                    <span className="text-muted-foreground ml-1">→ {rule.notification.split(',')[0]}</span>
                  )}
                </div>

                {/* Row 4: Bottom stats */}
                <div className="flex items-center gap-3 mt-2 pt-1.5 border-t border-border/50 text-[9px] text-muted-foreground">
                  <span className={cn('font-semibold', sv.className)}>{sv.text}</span>
                  <span className="text-border">│</span>
                  <span className="tabular-nums">Fired: {rule.fired24h}× (24h)</span>
                  <span className="text-border">│</span>
                  <span>Last: {rule.lastFired}</span>
                  <span className="text-border">│</span>
                  <span>FP: {rule.fpRate}</span>
                </div>
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
