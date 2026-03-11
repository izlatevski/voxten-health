import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, History, Settings } from 'lucide-react';
import { formatList, type PolicyPackView, type PolicyRuleView } from '@/lib/policyEngine';
import { usePolicyEngineStore } from '@/stores/policyEngineStore';

interface Props {
  packs: PolicyPackView[];
  rules: PolicyRuleView[];
}

export function PackOverview({ packs, rules }: Props) {
  const { selectedPackId } = usePolicyEngineStore();
  const pack = packs.find((item) => item.id === selectedPackId);

  if (!pack) {
    return (
      <Card className="clinical-shadow border-border h-full flex items-center justify-center">
        <p className="text-xs text-muted-foreground text-center px-6">Select a rule pack to view overview</p>
      </Card>
    );
  }

  const activeRules = rules.filter((rule) => rule.isActive).length;
  const draftRules = rules.filter((rule) => rule.status === 'Draft').length;
  const deprecatedRules = rules.filter((rule) => rule.status === 'Deprecated').length;
  const categories = [...new Set(rules.map((rule) => rule.category))];
  const methods = [...new Set(rules.map((rule) => rule.evalType))];
  const channels = [...new Set(rules.flatMap((rule) => rule.scope.channels))];

  return (
    <Card className="clinical-shadow border-border h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{pack.name}</h2>
        <p className="text-[10px] text-muted-foreground mt-0.5">Rule Pack Overview</p>
      </div>
      <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
        <div className="space-y-2">
          <Row label="Pack ID" value={pack.id} />
          <Row label="Status" value={pack.isActive ? 'Active' : 'Inactive'} valueClass={pack.isActive ? 'text-success' : 'text-muted-foreground'} />
          <Row label="Sector" value={pack.sector} />
          <Row label="Retention" value={`${pack.retentionDays} days`} />
          <Row label="Configured Rules" value={String(pack.ruleCount)} />
          <Row label="Active Rules" value={String(activeRules)} />
          <Row label="Draft Rules" value={String(draftRules)} />
          <Row label="Deprecated Rules" value={String(deprecatedRules)} />
        </div>

        {pack.description ? (
          <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-3">
            {pack.description}
          </p>
        ) : null}

        <Section title="Scope Snapshot">
          <Row label="Channels" value={formatList(channels, 'Not defined')} />
          <Row label="Categories" value={formatList(categories, 'Not defined')} />
          <Row label="Evaluation Modes" value={formatList(methods, 'Not defined')} />
        </Section>

        <Section title="Versioning">
          <Row label="Newest Effective Date" value={rules[0]?.effectiveDate ? new Date(Math.max(...rules.map((rule) => new Date(rule.effectiveDate).getTime()))).toLocaleString() : 'No rules'} />
          <Row label="Rule Count Loaded" value={String(rules.length)} />
        </Section>

        <div className="border-t border-border pt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5" disabled>
            <Settings className="w-3 h-3" /> Edit Pack Settings
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5" disabled>
            <Download className="w-3 h-3" /> Export Rules
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5" disabled>
            <History className="w-3 h-3" /> View Audit History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-3">
      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between text-[11px] gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={valueClass || 'text-foreground font-medium text-right'}>{value}</span>
    </div>
  );
}
