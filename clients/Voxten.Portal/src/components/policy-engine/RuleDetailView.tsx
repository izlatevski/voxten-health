import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { activateRule, deprecateRule } from '@/lib/complianceApi';
import { formatDateTime, formatList, type PolicyRuleView } from '@/lib/policyEngine';
import { usePolicyEngineStore } from '@/stores/policyEngineStore';
import { CheckCircle, Copy, Edit, History, Loader2, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

const severityDisplay: Record<string, { text: string; className: string }> = {
  critical: { text: 'Critical', className: 'text-stat' },
  high: { text: 'High', className: 'text-urgent' },
  medium: { text: 'Medium', className: 'text-primary' },
  low: { text: 'Low', className: 'text-muted-foreground' },
};

const actionDisplay: Record<string, string> = {
  block: 'Block',
  flag: 'Flag for review',
  redact: 'Redact',
  log: 'Log',
  escalate: 'Escalate',
};

interface Props {
  rules: PolicyRuleView[];
  onRuleChanged?: () => void;
}

export function RuleDetailView({ rules, onRuleChanged }: Props) {
  const { selectedRuleId, setDetailMode } = usePolicyEngineStore();
  const [actionLoading, setActionLoading] = useState<'activate' | 'deprecate' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const rule = rules.find((item) => String(item.id) === selectedRuleId);

  if (!rule) {
    return (
      <Card className="clinical-shadow border-border h-full flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Select a rule to view details</p>
      </Card>
    );
  }

  const severityMeta = severityDisplay[rule.severity];

  async function handleActivate() {
    setActionLoading('activate');
    setActionError(null);
    try {
      await activateRule(String(rule.id));
      onRuleChanged?.();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to activate rule');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeprecate() {
    setActionLoading('deprecate');
    setActionError(null);
    try {
      await deprecateRule(String(rule.id));
      onRuleChanged?.();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to deprecate rule');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <Card className="clinical-shadow border-border h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-foreground leading-tight">{rule.name}</h2>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {rule.logicalId} · v{rule.version}
            </p>
          </div>
          <button
            className={cn(
              'text-[11px] flex items-center gap-1',
              rule.isActive ? 'text-muted-foreground cursor-not-allowed' : 'text-primary hover:underline',
            )}
            disabled={rule.isActive}
            onClick={() => setDetailMode('rule-edit')}
            title={rule.isActive ? 'Active rules cannot be edited. Create a new version instead.' : 'Edit draft or inactive rule'}
          >
            <Edit className="w-3 h-3" /> Edit
          </button>
        </div>
      </div>

      <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
        <Section title="Rule Identity">
          <Row label="Database ID" value={String(rule.id)} />
          <Row label="Logical ID" value={rule.logicalId} />
          <Row label="Version" value={rule.version} />
          <Row label="Pack" value={rule.packId} />
          <Row label="Status">
            <Badge variant="outline" className={cn('text-[9px]', rule.isActive ? 'text-success border-success/20 bg-success/10' : 'text-muted-foreground')}>
              {rule.status}
            </Badge>
          </Row>
          <Row label="Effective" value={formatDateTime(rule.effectiveDate)} />
          <Row label="Deprecated" value={formatDateTime(rule.deprecatedDate)} />
          {rule.isActive ? (
            <p className="text-[10px] text-muted-foreground">
              Active rules are immutable in the backend. Deprecate and create a new version to change live behavior.
            </p>
          ) : null}
        </Section>

        <Section title="Classification">
          <Row label="Category" value={rule.category} />
          <Row label="Evaluation Type" value={rule.evalType} />
          <Row label="Derived Method" value={rule.analysisMethod} />
          <Row label="Severity" value={severityMeta.text} valueClass={severityMeta.className} />
          <Row label="Primary Action" value={actionDisplay[rule.action] ?? rule.action} />
        </Section>

        <Section title="Scope">
          <Row label="Channels" value={formatList(rule.scope.channels)} />
          <Row label="Directions" value={formatList(rule.scope.directions)} />
          <Row label="Sender Roles" value={formatList(rule.scope.senderRoles, 'None specified')} />
        </Section>

        <Section title="Definition">
          <Stack label="Description" value={rule.description} />
          <Stack label="Trigger Summary" value={rule.triggerSummary} />
        </Section>

        <Section title="Stored JSON">
          <JsonBlock label="Scope JSON" value={rule.scopeJson} />
          <JsonBlock label="Logic JSON" value={rule.logicJson} />
          <JsonBlock label="Default Actions JSON" value={rule.defaultActionsJson} />
          {rule.exemptionsJson ? <JsonBlock label="Exemptions JSON" value={rule.exemptionsJson} /> : null}
          {rule.changelogJson ? <JsonBlock label="Changelog JSON" value={rule.changelogJson} /> : null}
        </Section>

        {actionError ? <p className="text-[11px] text-stat">{actionError}</p> : null}

        <div className="border-t border-border pt-3 flex flex-wrap gap-2">
          {rule.isActive ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] gap-1.5"
              onClick={handleDeprecate}
              disabled={!!actionLoading}
            >
              {actionLoading === 'deprecate' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pause className="w-3 h-3" />}
              Deprecate
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] gap-1.5"
              onClick={handleActivate}
              disabled={!!actionLoading}
            >
              {actionLoading === 'activate' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              Activate
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5" disabled>
            <History className="w-3 h-3" /> Edit History
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5" disabled>
            <Copy className="w-3 h-3" /> Clone Rule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-3 first:border-t-0 first:pt-0">
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass,
  children,
}: {
  label: string;
  value?: string;
  valueClass?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-start gap-3 text-[11px]">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      {children || <span className={valueClass || 'text-foreground font-medium text-right'}>{value}</span>}
    </div>
  );
}

function Stack({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <p className="text-[11px] text-foreground leading-relaxed">{value}</p>
    </div>
  );
}

function JsonBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <pre className="text-[10px] text-foreground bg-muted/50 rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-words">
        {value}
      </pre>
    </div>
  );
}
