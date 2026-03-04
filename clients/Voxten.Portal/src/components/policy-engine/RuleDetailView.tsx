import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { usePolicyEngineStore, policyRules } from '@/stores/policyEngineStore';
import { Play, Pause, Copy, History, Edit, Brain, FileCode2, Info, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const severityDisplay: Record<string, { bars: string; className: string }> = {
  critical: { bars: '■■■', className: 'text-stat' },
  high: { bars: '■■', className: 'text-urgent' },
  medium: { bars: '■', className: 'text-primary' },
  low: { bars: '○', className: 'text-muted-foreground' },
};

const actionColors: Record<string, string> = {
  block: 'text-stat', flag: 'text-urgent', redact: 'text-ehr-part2', log: 'text-muted-foreground', escalate: 'text-stat',
};

export function RuleDetailView() {
  const { selectedRuleId, setDetailMode } = usePolicyEngineStore();
  const rule = policyRules.find(r => r.id === selectedRuleId);

  if (!rule) {
    return (
      <Card className="clinical-shadow border-border h-full flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Select a rule to view details</p>
      </Card>
    );
  }

  const sv = severityDisplay[rule.severity];

  return (
    <Card className="clinical-shadow border-border h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-foreground leading-tight">{rule.name}</h2>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{rule.id}</p>
          </div>
          <button className="text-[11px] text-primary hover:underline flex items-center gap-1">
            <Edit className="w-3 h-3" /> Edit
          </button>
        </div>
      </div>

      <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* Configuration */}
        <Section title="CONFIGURATION">
          <Row label="Regulation Pack" value={rule.packId.toUpperCase()} />
          <Row label="Severity">
            <span className={cn('font-semibold', sv.className)}>{sv.bars} {rule.severity.charAt(0).toUpperCase() + rule.severity.slice(1)}</span>
          </Row>
          <Row label="Status" value="● Active" valueClass="text-success" />
          <Row label="Description">
            <span className="text-foreground text-[11px] leading-relaxed">{rule.description}</span>
          </Row>
        </Section>

        {/* Trigger */}
        <Section title="TRIGGER CONDITIONS">
          <Row label="Channels">
            <div className="flex flex-wrap gap-1">
              {rule.channels.map(ch => (
                <Badge key={ch} variant="outline" className="text-[8px] px-1 h-3.5">{ch}</Badge>
              ))}
            </div>
          </Row>
          <Row label="Direction" value={rule.direction === 'both' ? 'Inbound + Outbound' : rule.direction.charAt(0).toUpperCase() + rule.direction.slice(1)} />
          <Row label="Content" value={rule.trigger} />
        </Section>

        {/* Analysis Method */}
        <Section title="ANALYSIS METHOD">
          <TooltipProvider>
            <div className="space-y-1.5">
              <MethodRadio label="Pattern Match Only" icon={<FileCode2 className="w-3 h-3" />} selected={rule.analysisMethod === 'pattern'} />
              <MethodRadio label="AI Semantic Only" icon={<Brain className="w-3 h-3" />} selected={rule.analysisMethod === 'ai'} />
              <div className="flex items-center gap-1">
                <MethodRadio label="Both (Layered)" icon={<><Brain className="w-3 h-3" /><FileCode2 className="w-3 h-3" /></>} selected={rule.analysisMethod === 'both'} />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[240px] text-[11px]">
                    Pattern match runs first (fast, cheap). If it finds potential matches, AI semantic analysis confirms or dismisses — reducing false positives while keeping costs down.
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>

          {rule.aiModel && <Row label="AI Model" value={rule.aiModel} />}
          {rule.confidenceThreshold && <Row label="Confidence Threshold" value={rule.confidenceThreshold.toFixed(2)} />}
          {rule.patternLibrary && <Row label="Pattern Library" value={rule.patternLibrary} />}
          {rule.patternCount && <Row label="Patterns" value={`${rule.patternCount} active`} />}
        </Section>

        {/* Action */}
        <Section title="ACTION ON MATCH">
          <Row label="Primary">
            <span className={cn('font-semibold capitalize', actionColors[rule.action])}>
              {rule.action === 'block' ? '✕ Block transmission' : rule.action === 'flag' ? '⚠ Flag for review' : rule.action === 'redact' ? '↺ Redact & send' : rule.action === 'log' ? '○ Log only' : '↑ Escalate'}
            </span>
          </Row>
          <Row label="Notify" value={rule.notification} />
          <Row label="Audit" value="Log to audit trail" />
        </Section>

        {/* Performance */}
        <Section title="PERFORMANCE">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <Row label="Fired (24h)" value={String(rule.fired24h)} />
            <Row label="Fired (30d)" value={String(rule.fired30d || 0)} />
            <Row label="False Positive Rate" value={rule.fpRate} />
            <Row label="Avg Eval Time" value={`${rule.avgEvalMs}ms`} />
            {rule.avgAiMs > 0 && <Row label="Avg AI Analysis" value={`${rule.avgAiMs}ms`} />}
          </div>
        </Section>

        {/* Recent Fires */}
        {rule.recentFires && rule.recentFires.length > 0 && (
          <Section title="RECENT FIRES">
            <div className="space-y-2">
              {rule.recentFires.map((f, i) => (
                <div key={i} className="text-[11px] leading-relaxed">
                  <span className="text-muted-foreground">{f.date}</span>
                  <span className={cn('ml-1 font-semibold', f.action === 'BLOCK' ? 'text-stat' : f.action === 'FLAG' ? 'text-urgent' : 'text-ehr-part2')}>
                    — {f.action}
                  </span>
                  <span className="text-foreground ml-1">— {f.summary}</span>
                  <button className="text-primary text-[10px] flex items-center gap-0.5 mt-0.5 hover:underline">
                    <ExternalLink className="w-2.5 h-2.5" /> View audit event
                  </button>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Actions */}
        <div className="border-t border-border pt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            className="h-7 text-[11px] gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setDetailMode('rule-tester')}
          >
            <Play className="w-3 h-3" /> Test This Rule
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5">
            <Pause className="w-3 h-3" /> Pause Rule
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5">
            <History className="w-3 h-3" /> Edit History
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5">
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

function Row({ label, value, valueClass, children }: { label: string; value?: string; valueClass?: string; children?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-2 text-[11px]">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      {children || <span className={valueClass || 'text-foreground font-medium text-right'}>{value}</span>}
    </div>
  );
}

function MethodRadio({ label, icon, selected }: { label: string; icon: React.ReactNode; selected: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-2 text-[11px] px-2 py-1 rounded',
      selected ? 'bg-primary/5 text-foreground font-medium' : 'text-muted-foreground'
    )}>
      <span className={cn('w-3 h-3 rounded-full border-2 flex items-center justify-center',
        selected ? 'border-primary' : 'border-muted-foreground/40'
      )}>
        {selected && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
      </span>
      <span className="flex items-center gap-1">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
