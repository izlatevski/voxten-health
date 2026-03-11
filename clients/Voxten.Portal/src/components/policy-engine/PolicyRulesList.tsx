import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, ChevronRight, FileCode2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime, formatList, type PolicyPackView, type PolicyRuleView } from '@/lib/policyEngine';
import { usePolicyEngineStore, type AnalysisMethod, type RuleAction, type RuleSeverity } from '@/stores/policyEngineStore';

const severityBorder: Record<RuleSeverity, string> = {
  critical: 'border-l-stat',
  high: 'border-l-urgent',
  medium: 'border-l-primary',
  low: 'border-l-muted-foreground/30',
};

const severityLabel: Record<RuleSeverity, { text: string; className: string }> = {
  critical: { text: 'Critical', className: 'text-stat' },
  high: { text: 'High', className: 'text-urgent' },
  medium: { text: 'Medium', className: 'text-primary' },
  low: { text: 'Low', className: 'text-muted-foreground' },
};

const actionDisplay: Record<RuleAction, { label: string; className: string }> = {
  block: { label: 'BLOCK', className: 'text-stat' },
  flag: { label: 'FLAG', className: 'text-urgent' },
  redact: { label: 'REDACT', className: 'text-ehr-part2' },
  log: { label: 'LOG', className: 'text-muted-foreground' },
  escalate: { label: 'ESCALATE', className: 'text-stat' },
};

interface Props {
  packs: PolicyPackView[];
  rules: PolicyRuleView[];
  isLoading?: boolean;
}

export function PolicyRulesList({ packs, rules, isLoading }: Props) {
  const {
    selectedPackId,
    selectedRuleId,
    setSelectedRule,
    searchQuery,
    setSearchQuery,
    severityFilter,
    setSeverityFilter,
    actionFilter,
    setActionFilter,
    methodFilter,
    setMethodFilter,
  } = usePolicyEngineStore();

  const pack = packs.find((item) => item.id === selectedPackId);
  const filteredRules = rules.filter((rule) => {
    const matchesSearch =
      !searchQuery ||
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.logicalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.version.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || rule.severity === severityFilter;
    const matchesAction = actionFilter === 'all' || rule.action === actionFilter;
    const matchesMethod = methodFilter === 'all' || rule.analysisMethod === methodFilter;
    return matchesSearch && matchesSeverity && matchesAction && matchesMethod;
  });

  const actionCounts: Record<string, number> = {};
  rules.forEach((rule) => {
    actionCounts[rule.action] = (actionCounts[rule.action] || 0) + 1;
  });

  if (!selectedPackId || !pack) {
    return (
      <Card className="clinical-shadow border-border h-full flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Select a rule pack to view rules</p>
      </Card>
    );
  }

  return (
    <Card className="clinical-shadow border-border h-full flex flex-col">
      <div className="px-3 py-2 border-b border-border space-y-1.5">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-wrap">
          <span
            className="cursor-pointer hover:text-foreground"
            onClick={() => {
              usePolicyEngineStore.getState().setSelectedPack(null);
            }}
          >
            All Packs
          </span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{pack.name}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{pack.ruleCount} configured rules</h2>
            <p className="text-[10px] text-muted-foreground">Pack id: {pack.id}</p>
          </div>
          <Badge variant="outline" className={cn('text-[9px]', pack.isActive ? 'text-success border-success/20 bg-success/10' : 'text-muted-foreground')}>
            {pack.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-border bg-muted/20 space-y-2">
        <Input
          data-rule-search
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, logical ID, or version"
          className="h-8 text-xs"
        />
        <div className="grid grid-cols-3 gap-2">
          <FilterSelect
            value={severityFilter}
            onChange={(value) => setSeverityFilter(value as RuleSeverity | 'all')}
            placeholder="Severity"
            items={[
              { value: 'all', label: 'All Severities' },
              { value: 'critical', label: 'Critical' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
          />
          <FilterSelect
            value={actionFilter}
            onChange={(value) => setActionFilter(value as RuleAction | 'all')}
            placeholder="Action"
            items={[
              { value: 'all', label: 'All Actions' },
              { value: 'block', label: 'Block' },
              { value: 'flag', label: 'Flag' },
              { value: 'redact', label: 'Redact' },
              { value: 'log', label: 'Log' },
              { value: 'escalate', label: 'Escalate' },
            ]}
          />
          <FilterSelect
            value={methodFilter}
            onChange={(value) => setMethodFilter(value as AnalysisMethod | 'all')}
            placeholder="Method"
            items={[
              { value: 'all', label: 'All Methods' },
              { value: 'pattern', label: 'Pattern' },
              { value: 'ai', label: 'AI' },
              { value: 'both', label: 'Hybrid' },
            ]}
          />
        </div>
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
          <span>Filtered: {filteredRules.length}</span>
          <span className="text-border">│</span>
          <span>Block: {actionCounts.block ?? 0}</span>
          <span>Flag: {actionCounts.flag ?? 0}</span>
        </div>
      </div>

      <CardContent className="p-2 flex-1 overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading rules...
          </div>
        ) : filteredRules.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            {rules.length === 0 ? 'No rules in this pack yet. Create one to get started.' : 'No rules match your filters.'}
          </p>
        ) : (
          filteredRules.map((rule) => {
            const isSelected = selectedRuleId === String(rule.id);
            const actionMeta = actionDisplay[rule.action];
            const severityMeta = severityLabel[rule.severity];

            return (
              <button
                key={rule.id}
                onClick={() => setSelectedRule(String(rule.id))}
                className={cn(
                  'w-full text-left p-2.5 rounded-md border-l-4 transition-all border border-transparent',
                  severityBorder[rule.severity],
                  isSelected ? 'bg-primary/5 ring-1 ring-primary/20 border-primary/10' : 'hover:bg-muted/60',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-foreground leading-tight">{rule.name}</p>
                    <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
                      {rule.logicalId} v{rule.version}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[8px] px-1 py-0 h-3.5 uppercase font-semibold',
                      rule.isActive ? 'bg-success/10 text-success border-success/20' : 'bg-muted/50 text-muted-foreground border-border',
                    )}
                  >
                    {rule.status}
                  </Badge>
                </div>

                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                  {rule.triggerSummary}
                </p>

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
                  <span className={cn('font-semibold', actionMeta.className)}>{actionMeta.label}</span>
                  <span className="text-border">│</span>
                  <span className={cn('font-semibold', severityMeta.className)}>{severityMeta.text}</span>
                </div>

                <div className="flex items-center gap-3 mt-2 pt-1.5 border-t border-border/50 text-[9px] text-muted-foreground">
                  <span>Channels: {formatList(rule.scope.channels)}</span>
                  <span className="text-border">│</span>
                  <span>Directions: {formatList(rule.scope.directions)}</span>
                  <span className="text-border">│</span>
                  <span>Effective: {formatDateTime(rule.effectiveDate)}</span>
                </div>
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  items,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  items: Array<{ value: string; label: string }>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value} className="text-xs">
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
