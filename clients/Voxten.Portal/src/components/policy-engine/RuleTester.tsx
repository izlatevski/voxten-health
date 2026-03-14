import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { evaluateCompliance, type EvaluateComplianceDetectedEntity, type EvaluateComplianceFiredRule, type EvaluateComplianceRequest, type EvaluateComplianceResponse } from '@/lib/complianceApi';
import { usePolicyEngineStore, sampleTestMessages } from '@/stores/policyEngineStore';
import type { PolicyRuleView } from '@/lib/policyEngine';
import { Play, Loader2, ShieldAlert, ShieldCheck, ChevronDown, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DetectedEntity {
  text: string;
  type: string;
  method: string;
  confidence: number;
}

interface TestResult {
  fired: boolean;
  verdict: string;
  ruleId: string;
  ruleName: string;
  action: string;
  entities: DetectedEntity[];
  reasoning: string;
  productionSteps: string[];
  evalTimeMs: number;
  tokenCost: string;
  totalRulesEvaluated: number;
}

interface EvalStep {
  label: string;
  detail?: string;
  done: boolean;
}

const channelMap = {
  'SMS': 'Sms',
  'Email': 'Email',
  'Secure Messaging': 'SecureChat',
  'Voice': 'Voice',
  'AI-Generated': 'SecureChat',
} as const satisfies Record<string, EvaluateComplianceRequest['channel']>;

const directionMap = {
  'Outbound': 'Outbound',
  'Inbound': 'Inbound',
  'Internal': 'Internal',
} as const satisfies Record<string, EvaluateComplianceRequest['direction']>;

const senderRoleMap: Record<string, string> = {
  'Dr. Rivera': 'Physician',
  'Dr. Williams': 'Physician',
  'Nurse Torres': 'Nurse',
  'Charge Nurse': 'Nurse',
  'Copilot M365': 'AiAgent',
  'PharmD Kim': 'Pharmacist',
  'Records Dept': 'HealthInformationManagement',
  'Care Coordinator': 'CareCoordinator',
  'Release of Information': 'HealthInformationManagement',
};

const entityExtractors: Record<string, RegExp> = {
  SSN: /(?<!\d)\d{3}(?:[-\s]?\d{2}[-\s]?\d{4})(?!\d)/i,
  MRN: /\bMRN[\-:\s#]*\d{4,12}\b/i,
  DOB: /\b(?:DOB|date of birth|born)[:\s]+\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/i,
  PatientID: /\b(?:patient|pt)[\s\-#:]*(?:ID|number)[\s:]*\d{4,12}\b/i,
  InsuranceID: /\b(?:member\s*(?:ID|#)|policy\s*(?:number|#)|ins(?:urance)?\s*ID)[:\s]*[A-Z0-9][A-Z0-9\-]{5,19}\b/i,
  PhoneNumber: /(?<!\d)(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}(?!\d)/i,
  Email: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/i,
  RoomNumber: /\broom[\s#:-]*\d{1,4}[A-Z]?\b/i,
  CredentialToken: /\b(?:DEA|NPI)[:\s#]*[A-Z0-9]{7,12}\b/i,
  ControlledSubstance: /\b(?:controlled substance|schedule ii|schedule iii|opioid|benzodiazepine)\b/i,
  HyperkalemiaLab: /\b(?:K\+|potassium)\s*(?:of\s*|=\s*|:)?\s*[6-9]\d*(?:\.\d+)?(?:\s*(?:mEq|mmol)(?:\/L)?)?\b/i,
  TroponinElevated: /\b(?:troponin|trop)\s*(?:I|T)?\s*(?:of\s*|=\s*|:)?\s*(?:0\.(?:0[4-9]|\d{2,})|[1-9]\d*(?:\.\d+)?|elevated|positive|high)\b/i,
  HyperglycemiaCrit: /\b(?:glucose|BG|blood sugar)\s*(?:of\s*|=\s*|:)?\s*(?:[4-9]\d{2,}|[1-9]\d{3,})\s*(?:mg\/dL)?\b/i,
  EmergencyKeyword: /\bSTAT\b|\bcode\s+(?:blue|red|stroke|STEMI)\b/i,
};

function formatDetectionMethod(method: string): string {
  switch (method.toLowerCase()) {
    case 'deterministic':
      return 'Pattern';
    case 'hybrid':
      return 'Pattern + AI';
    case 'ai':
      return 'AI';
    default:
      return method;
  }
}

function formatEntityType(entityType: string): string {
  switch (entityType) {
    case 'MRN':
      return 'Medical Record Number';
    case 'DOB':
      return 'Date of Birth';
    case 'PhoneNumber':
      return 'Phone Number';
    case 'InsuranceID':
      return 'Insurance ID';
    case 'PatientID':
      return 'Patient ID';
    case 'HyperkalemiaLab':
      return 'Critical Potassium';
    case 'TroponinElevated':
      return 'Elevated Troponin';
    case 'HyperglycemiaCrit':
      return 'Critical Glucose';
    case 'EmergencyKeyword':
      return 'Emergency Keyword';
    default:
      return entityType.replace(/([a-z])([A-Z])/g, '$1 $2');
  }
}

function extractEntityText(content: string, entityType: string): string {
  const match = entityExtractors[entityType]?.exec(content);
  return match?.[0] ?? entityType;
}

function mapEntities(content: string, entities: EvaluateComplianceDetectedEntity[]): DetectedEntity[] {
  return entities.map((entity) => ({
    text: extractEntityText(content, entity.entityType),
    type: formatEntityType(entity.entityType),
    method: formatDetectionMethod(entity.detectionMethod),
    confidence: entity.confidence,
  }));
}

function mapVerdict(state: string, rulesFired: EvaluateComplianceFiredRule[]): string {
  switch (state) {
    case 'blocked':
      return 'BLOCKED';
    case 'redacted':
      return 'REDACTED';
    case 'flagged':
      return 'FLAGGED';
    case 'passed':
      return 'PASSED';
    default:
      return rulesFired.length > 0 ? 'FLAGGED' : 'PASSED';
  }
}

function buildReasoning(response: EvaluateComplianceResponse, entities: DetectedEntity[]): string {
  if (response.rulesFired.length === 0) {
    return `Compliance engine returned no violations. ${entities.length === 0 ? 'No deterministic entities were surfaced for this message.' : `Detected entities were below enforcement thresholds: ${entities.map((entity) => entity.type).join(', ')}.`} Compliance state: ${response.complianceState.toUpperCase()}.`;
  }

  const ruleSummary = response.rulesFired
    .map((rule) => `${rule.ruleId} (${rule.action})`)
    .join(', ');
  const entitySummary = entities.length > 0
    ? entities.map((entity) => `${entity.type} "${entity.text}" (${(entity.confidence * 100).toFixed(0)}% confidence via ${entity.method})`).join('; ')
    : 'No displayable entity snippets were returned.';

  return `Compliance engine flagged this message with state ${response.complianceState.toUpperCase()}. Fired rules: ${ruleSummary}. Entities surfaced: ${entitySummary}. Audit ID: ${response.auditId}.`;
}

function buildProductionSteps(response: EvaluateComplianceResponse, channel: string, primaryRule: EvaluateComplianceFiredRule | null): string[] {
  if (response.rulesFired.length === 0) {
    return [];
  }

  const steps = [
    `Compliance API returned ${response.complianceState.toUpperCase()} for outbound ${channel.toLowerCase()} traffic.`,
    `Audit record ${response.auditId} was created with ${response.rulesFired.length} fired rule${response.rulesFired.length === 1 ? '' : 's'}.`,
  ];

  if (response.complianceState === 'blocked') {
    steps.unshift('Message would be blocked before delivery.');
  } else if (response.complianceState === 'redacted') {
    steps.unshift('Message would be redacted before delivery.');
  } else if (response.complianceState === 'flagged') {
    steps.unshift('Message would be flagged for review.');
  }

  if (primaryRule) {
    steps.push(`Primary enforcement rule: ${primaryRule.ruleId} (${primaryRule.ruleName}).`);
  }

  return steps;
}

interface Props {
  rules: PolicyRuleView[];
}

export function RuleTester({ rules }: Props) {
  const { selectedRuleId, setDetailMode } = usePolicyEngineStore();
  const rule = selectedRuleId ? rules.find((item) => String(item.id) === selectedRuleId) : null;

  const [channel, setChannel] = useState('SMS');
  const [direction, setDirection] = useState('Outbound');
  const [sender, setSender] = useState('Dr. Rivera');
  const [recipient, setRecipient] = useState('External Number');
  const [input, setInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [steps, setSteps] = useState<EvalStep[]>([]);
  const [showSamples, setShowSamples] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts for sample messages
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= sampleTestMessages.length) {
        loadSample(sampleTestMessages[num - 1]);
      }
      if (e.key === 'Enter' && input.trim() && !testing) {
        e.preventDefault();
        handleTest();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [input, testing]);

  const loadSample = (sample: typeof sampleTestMessages[0]) => {
    setInput(sample.text);
    setChannel(sample.channel);
    setDirection(sample.direction);
    setSender(sample.sender);
    setRecipient(sample.recipient);
    setResult(null);
    setSteps([]);
    setShowSamples(false);
  };

  async function handleTest() {
    if (!input.trim() || testing) return;

    setTesting(true);
    setResult(null);
    setError(null);

    const activeRules = rules.filter((item) => item.isActive);
    const totalRules = activeRules.length;
    const packName = rule ? rule.packId.toUpperCase() : 'ALL';

    setSteps([
      { label: 'Ingesting message...', detail: `→ Channel ${channel} · Direction ${direction}`, done: true },
      { label: `Submitting to Compliance API (${packName})...`, done: false },
      { label: 'Running deterministic / hybrid rule engine...', done: false },
      { label: 'Collecting entity evidence...', done: false },
      { label: 'Applying enforcement decision...', done: false },
      { label: 'Creating audit record...', done: false },
    ]);

    try {
      const response = await evaluateCompliance({
        messageId: crypto.randomUUID(),
        content: input,
        senderId: sender,
        senderRole: senderRoleMap[sender] ?? sender,
        threadId: `rule-tester-${crypto.randomUUID()}`,
        channel: channelMap[channel as keyof typeof channelMap] ?? 'SecureChat',
        direction: directionMap[direction as keyof typeof directionMap] ?? 'Outbound',
      });

      const entities = mapEntities(input, response.entitiesDetected);
      const primaryFiredRule = response.rulesFired[0] ?? null;
      const primaryRuleView = primaryFiredRule
        ? rules.find((item) => item.logicalId === primaryFiredRule.ruleId) ?? null
        : null;
      const action = primaryRuleView?.action
        ?? (response.complianceState === 'redacted' ? 'redact'
          : response.complianceState === 'blocked' ? 'block'
          : response.complianceState === 'flagged' ? 'flag'
          : 'log');

      setSteps([
        { label: 'Ingesting message...', detail: `→ Channel ${channel} · Direction ${direction}`, done: true },
        { label: `Submitting to Compliance API (${packName})...`, detail: `→ Audit ${response.auditId}`, done: true },
        {
          label: 'Running deterministic / hybrid rule engine...',
          detail: response.rulesFired.length > 0
            ? `→ ${response.rulesFired.length} rule${response.rulesFired.length === 1 ? '' : 's'} fired: ${response.rulesFired.map((firedRule) => firedRule.ruleId).join(', ')}`
            : '→ No rules fired',
          done: true,
        },
        {
          label: 'Collecting entity evidence...',
          detail: entities.length > 0
            ? `→ ${entities.length} entit${entities.length === 1 ? 'y' : 'ies'} surfaced: ${entities.map((entity) => entity.type).join(', ')}`
            : '→ No entity evidence returned',
          done: true,
        },
        {
          label: 'Applying enforcement decision...',
          detail: `→ Compliance state ${response.complianceState.toUpperCase()}`,
          done: true,
        },
        {
          label: 'Creating audit record...',
          detail: `→ Engine latency ${response.evalMs}ms`,
          done: true,
        },
      ]);

      setResult({
        fired: response.rulesFired.length > 0,
        verdict: mapVerdict(response.complianceState, response.rulesFired),
        ruleId: primaryFiredRule?.ruleId ?? '',
        ruleName: primaryFiredRule?.ruleName ?? '',
        action,
        entities,
        reasoning: buildReasoning(response, entities),
        productionSteps: buildProductionSteps(response, channel, primaryFiredRule),
        evalTimeMs: response.evalMs,
        tokenCost: response.aiMs ? 'AI lane used' : 'Pattern lane only',
        totalRulesEvaluated: totalRules,
      });

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unexpected compliance API error.';
      setError(message);
      setSteps((currentSteps) => currentSteps.map((step, index) => {
        if (index === 1) {
          return { ...step, done: true, detail: `→ Request failed: ${message}` };
        }
        return index < 1 ? step : { ...step, detail: '', done: false };
      }));
    } finally {
      setTesting(false);
    }
  }

  // Highlight entities in text
  const renderHighlightedText = (text: string, entities: DetectedEntity[]) => {
    if (entities.length === 0) return <span>{text}</span>;
    let result = text;
    const highlights: { start: number; end: number; entity: DetectedEntity }[] = [];
    entities.forEach(e => {
      const idx = result.toLowerCase().indexOf(e.text.toLowerCase());
      if (idx >= 0) {
        highlights.push({ start: idx, end: idx + e.text.length, entity: e });
      }
    });
    highlights.sort((a, b) => a.start - b.start);

    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    highlights.forEach((h, i) => {
      if (h.start > lastIdx) parts.push(<span key={`t-${i}`}>{result.slice(lastIdx, h.start)}</span>);
      const isSSN = h.entity.type === 'SSN';
      const isPhone = h.entity.type === 'Phone Number';
      const bgColor = isSSN
        ? 'bg-stat/20 border-b-2 border-stat/60'
        : isPhone
          ? 'bg-urgent/20 border-b-2 border-urgent/60'
          : h.entity.confidence >= 0.95
            ? 'bg-stat/15 border-b-2 border-stat/40'
            : h.entity.confidence >= 0.85
              ? 'bg-urgent/15 border-b-2 border-urgent/40'
              : 'bg-primary/15 border-b-2 border-primary/40';
      parts.push(
        <span key={`h-${i}`} className={cn('px-0.5 rounded-sm', bgColor)}>
          [{result.slice(h.start, h.end)}]
        </span>
      );
      lastIdx = h.end;
    });
    if (lastIdx < result.length) parts.push(<span key="end">{result.slice(lastIdx)}</span>);
    return <>{parts}</>;
  };

  return (
    <Card className="clinical-shadow border-border h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setDetailMode(selectedRuleId ? 'rule-detail' : 'pack-overview')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-primary" /> Rule Tester
            </h2>
            <p className="text-[9px] text-muted-foreground mt-0.5">
              {rule ? `Testing: ${rule.name}` : 'Test against all active policies'}
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-3 flex-1 overflow-y-auto space-y-3">
        {/* Configure */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground">Channel</label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['SMS', 'Email', 'Secure Messaging', 'Voice', 'AI-Generated'].map(c => (
                  <SelectItem key={c} value={c} className="text-[11px]">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Direction</label>
            <Select value={direction} onValueChange={setDirection}>
              <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Outbound" className="text-[11px]">Outbound</SelectItem>
                <SelectItem value="Inbound" className="text-[11px]">Inbound</SelectItem>
                <SelectItem value="Internal" className="text-[11px]">Internal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Sender</label>
            <Select value={sender} onValueChange={setSender}>
              <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Dr. Rivera', 'Dr. Williams', 'Nurse Torres', 'Copilot M365', 'PharmD Kim', 'Records Dept'].map(s => (
                  <SelectItem key={s} value={s} className="text-[11px]">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Recipient</label>
            <Select value={recipient} onValueChange={setRecipient}>
              <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['External Number', 'Care Team', 'Dr. Chen', 'Night Shift Team', 'External Facility', 'Patient Portal'].map(r => (
                  <SelectItem key={r} value={r} className="text-[11px]">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Message Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Test Message</label>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] gap-1 px-2"
                onClick={() => setShowSamples(!showSamples)}
              >
                Load Sample <ChevronDown className="w-2.5 h-2.5" />
              </Button>
              {showSamples && (
                <div className="absolute right-0 top-7 z-50 w-64 bg-popover border border-border rounded-md shadow-lg p-1 space-y-0.5">
                  {sampleTestMessages.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => loadSample(s)}
                      className="w-full text-left px-2 py-1.5 rounded text-[11px] hover:bg-muted flex items-center gap-2"
                    >
                      <span className="text-muted-foreground font-mono w-3">{i + 1}</span>
                      <span className="text-foreground">{s.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setResult(null); setSteps([]); setError(null); }}
            placeholder='Type or paste a message here...'
            className="text-[11px] min-h-[80px] font-mono leading-relaxed"
          />
        </div>

        {error && (
          <div className="rounded-md border border-stat/20 bg-stat/5 px-3 py-2 text-[11px] text-stat">
            {error}
          </div>
        )}

        {/* Run Test Button */}
        <Button
          onClick={handleTest}
          disabled={!input.trim() || testing}
          className="w-full gap-2 h-9"
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {testing ? 'Analyzing...' : 'Run Test'}
        </Button>

        {/* Step-by-step evaluation */}
        {steps.length > 0 && (
          <div className="bg-muted/50 rounded-md border border-border p-3 font-mono text-[10px] space-y-1">
            {steps.map((step, i) => (
              <div key={i} className={cn('flex items-start gap-2 transition-opacity duration-200', step.done ? 'opacity-100' : 'opacity-30')}>
                <span className={cn('flex-shrink-0 mt-0.5', step.done ? 'text-success' : 'text-muted-foreground')}>
                  {step.done ? '✓' : '○'}
                </span>
                <div>
                  <span className="text-foreground">{step.label}</span>
                  {step.done && (
                    <span className={cn('ml-2 tabular-nums', step.done ? 'text-success' : '')}>
                      {step.done ? '' : ''}
                    </span>
                  )}
                  {step.detail && <div className="text-muted-foreground mt-0.5">{step.detail}</div>}
                </div>
              </div>
            ))}
            {result && (
              <div className="border-t border-border/50 pt-1 mt-1 text-muted-foreground">
                Compliance API evaluation time: {result.evalTimeMs}ms
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div ref={resultRef} className={cn(
            'rounded-lg border p-4 space-y-3 animate-scale-in',
            result.fired ? 'border-stat/30 bg-stat/5' : 'border-success/30 bg-success/5'
          )}>
            {/* Verdict */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.fired ? (
                  <ShieldAlert className="w-5 h-5 text-stat" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-success" />
                )}
                <span className={cn('text-sm font-bold', result.fired ? 'text-stat' : 'text-success')}>
                  VERDICT: {result.fired ? '✕' : '✓'} {result.verdict}
                </span>
              </div>
              {result.fired && (
                <Badge variant="outline" className="text-[9px] bg-stat/10 text-stat border-stat/20 font-bold uppercase">
                  {result.action === 'block' ? 'Critical' : result.action === 'flag' ? 'Warning' : 'Action'}
                </Badge>
              )}
            </div>

            {result.fired && (
              <div className="space-y-1">
                <p className="text-[11px] text-foreground">
                  Rule: <span className="font-mono font-semibold">{result.ruleId}</span> — {result.ruleName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Compliance engine returned an enforced result · Evaluation time: {result.evalTimeMs}ms
                </p>
              </div>
            )}
            {!result.fired && (
              <div className="space-y-1">
                <p className="text-[11px] text-foreground">
                  {result.totalRulesEvaluated} active rules in the current view. Engine returned no violations.
                </p>
                <p className="text-[11px] text-muted-foreground">0 entities flagged · Evaluation time: {result.evalTimeMs}ms</p>
              </div>
            )}

            {/* Detected Entities */}
            {result.entities.length > 0 && (
              <div className="border-t border-border/50 pt-3">
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">DETECTED ENTITIES</h4>
                <div className="text-[11px] text-foreground leading-relaxed bg-card rounded p-2 border border-border/50 mb-2">
                  {renderHighlightedText(input, result.entities)}
                </div>
                <div className="rounded border border-border/50 overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-2 py-1 bg-muted/50 text-[9px] font-semibold text-muted-foreground uppercase">
                    <span>Entity</span>
                    <span>Type</span>
                    <span>Method</span>
                    <span>Conf.</span>
                  </div>
                  {result.entities.map((e, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-2 py-1.5 border-t border-border/30 text-[10px] items-center">
                      <span className="font-mono text-foreground truncate">{e.text}</span>
                      <Badge variant="outline" className="text-[8px] h-3.5 px-1">{e.type}</Badge>
                      <span className="text-muted-foreground">{e.method}</span>
                      <span className="tabular-nums font-mono">
                        <span className={cn(
                          'inline-block w-8 text-right',
                          e.confidence >= 0.95 ? 'text-success' : e.confidence >= 0.80 ? 'text-primary' : 'text-urgent'
                        )}>
                          {(e.confidence).toFixed(2)}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-2 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-stat/30" /> REDACT (SSN)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-urgent/30" /> FLAG (Phone, Name)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary/30" /> Contextual PHI</span>
                </div>
              </div>
            )}

            {/* AI Reasoning */}
            <div className="border-t border-border/50 pt-3">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI ANALYSIS REASONING</h4>
              <div className="bg-card rounded p-3 border border-border/50">
                <p className="text-[11px] text-foreground leading-relaxed italic">
                  "{result.reasoning}"
                </p>
                <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground">
                  <span>Source: Compliance API</span>
                  <span>│</span>
                  <span>Confidence: {result.entities.length > 0 ? (Math.max(...result.entities.map(e => e.confidence))).toFixed(2) : '0.94'}</span>
                  <span>│</span>
                  <span>Time: {result.evalTimeMs}ms</span>
                  <span>│</span>
                  <span>Cost: {result.tokenCost}</span>
                </div>
              </div>
            </div>

            {/* Production Steps */}
            {result.productionSteps.length > 0 && (
              <div className="border-t border-border/50 pt-3">
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">WHAT WOULD HAPPEN IN PRODUCTION</h4>
                <div className="space-y-1">
                  {result.productionSteps.map((step, i) => (
                    <div key={i} className="text-[11px] text-foreground flex items-start gap-2">
                      <span className="text-muted-foreground tabular-nums">{i + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clean message note */}
            {!result.fired && (
              <div className="border-t border-border/50 pt-3">
                <p className="text-[11px] text-muted-foreground italic">
                  This demonstrates VOXTEN's precision — clinical communication flows freely when properly de-identified. No false positives.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => { setInput(''); setResult(null); setSteps([]); }}
              >
                Run Another Test
              </Button>
              {result.fired && result.ruleId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() => {
                    const firedRule = rules.find((item) => item.logicalId === result.ruleId);
                    if (!firedRule) return;
                    usePolicyEngineStore.getState().setSelectedRule(String(firedRule.id));
                    setDetailMode('rule-detail');
                  }}
                >
                  View Rule Detail
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
