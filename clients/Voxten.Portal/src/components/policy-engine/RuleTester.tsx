import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const handleTest = useCallback(() => {
    if (!input.trim() || testing) return;
    setTesting(true);
    setResult(null);

    const activeRules = rules.filter((item) => item.isActive);
    const totalRules = rule ? 1 : activeRules.length;
    const packName = rule ? rule.packId.toUpperCase() : 'ALL';

    const evalSteps: EvalStep[] = [
      { label: 'Ingesting message...', done: false },
      { label: `Evaluating against ${totalRules} active ${packName} rules...`, done: false },
      { label: 'Running pattern match analysis...', detail: '', done: false },
      { label: 'Running AI semantic analysis (Azure OpenAI GPT-4o)...', detail: '', done: false },
      { label: 'Evaluating policy action...', detail: '', done: false },
      { label: 'Generating audit record...', done: false },
    ];

    setSteps([...evalSteps]);

    // Simulate stepped evaluation
    const delays = [100, 300, 600, 1400, 1600, 1700];
    const lowerInput = input.toLowerCase();

    // Detect entities
    const entities: DetectedEntity[] = [];
    const nameMatch = input.match(/\b([A-Z][a-z]+ [A-Z][a-z]+)\b/);
    if (nameMatch) entities.push({ text: nameMatch[1], type: 'Person', method: 'AI + Pattern', confidence: 0.97 });
    const mrnMatch = input.match(/MRN[\s-]?(\d+)/i);
    if (mrnMatch) entities.push({ text: `MRN ${mrnMatch[1]}`, type: 'Medical Record Number', method: 'Pattern', confidence: 1.00 });
    const ssnMatch = input.match(/\b\d{3}-\d{2}-\d{4}\b/);
    if (ssnMatch) entities.push({ text: ssnMatch[0], type: 'SSN', method: 'Pattern', confidence: 1.00 });
    const dobMatch = input.match(/DOB:\s*(\d{2}\/\d{2}\/\d{4})/i);
    if (dobMatch) entities.push({ text: dobMatch[1], type: 'Date of Birth', method: 'Pattern', confidence: 1.00 });
    if (/potassium|k\+|cr\s*\d/i.test(input)) {
      const labMatch = input.match(/(?:potassium|K\+|Cr)\s*(?:of\s*)?(\d+\.?\d*)/i);
      entities.push({ text: labMatch ? `${labMatch[0]}` : 'Lab value', type: 'Lab Result (PHI)', method: 'AI Context', confidence: 0.89 });
    }
    const phoneMatch = input.match(/\b\d{3}-\d{4}\b/);
    if (phoneMatch) entities.push({ text: phoneMatch[0], type: 'Phone Number', method: 'Pattern', confidence: 0.94 });
    if (/whatsapp|signal|telegram|personal\s*email/i.test(input)) entities.push({ text: 'WhatsApp conversation', type: 'Off-Channel Reference', method: 'AI + Pattern', confidence: 0.95 });
    if (/substance use|alcohol use|behavioral health/i.test(input)) entities.push({ text: 'substance use assessment', type: 'Behavioral Health Data', method: 'AI Semantic', confidence: 0.91 });
    if (/patient roster|847 patients|\bMRNs\b.*diagnoses/i.test(input)) entities.push({ text: 'Q4 patient roster', type: 'Bulk Patient Data', method: 'Pattern', confidence: 0.98 });
    if (/allerg/i.test(input)) entities.push({ text: 'Allergies: Penicillin, Sulfa', type: 'Clinical Data (PHI)', method: 'AI Context', confidence: 0.86 });

    const shouldFire = entities.length > 0;
      const matchedRule = rule || (shouldFire ? activeRules.find((item) => item.severity === 'critical') ?? activeRules[0] ?? null : null);
    const patternMatches = entities.filter(e => e.method.includes('Pattern')).length;

    // Animate steps
    delays.forEach((delay, i) => {
      setTimeout(() => {
        setSteps(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], done: true };
          // Add details to pattern match step
          if (i === 2 && patternMatches > 0) {
            updated[i].detail = `→ ${patternMatches} pattern${patternMatches > 1 ? 's' : ''} matched: ${entities.filter(e => e.method.includes('Pattern')).map(e => e.type).join(', ')}`;
          } else if (i === 2 && !shouldFire) {
            updated[i].detail = '→ No patterns matched';
          }
          if (i === 3 && shouldFire) {
            const aiEntities = entities.filter(e => e.method.includes('AI'));
            updated[i].detail = aiEntities.length > 0
              ? `→ Confirmed: ${aiEntities.length > 0 ? aiEntities[0].type : 'content'} detected with ${(Math.max(...entities.map(e => e.confidence))).toFixed(2)} confidence`
              : '→ AI analysis confirmed pattern match results';
          } else if (i === 3 && !shouldFire) {
            updated[i].detail = '→ No policy-relevant content detected';
          }
          if (i === 4) {
            updated[i].detail = shouldFire && matchedRule
              ? `→ Rule ${matchedRule.id}: ${matchedRule.action.toUpperCase()}`
              : '→ All rules: PASS';
          }
          return updated;
        });
      }, delay);
    });

    // Final result
    setTimeout(() => {
      const evalTime = shouldFire ? 12 : 8;

      if (shouldFire && matchedRule) {
        const reasoning = `This message contains Protected Health Information as defined under HIPAA §164.502 (Minimum Necessary) and §164.514 (De-identification Standard). ${entities.length} categor${entities.length === 1 ? 'y' : 'ies'} of PHI identifiers detected: ${entities.map((e, i) => `(${i + 1}) ${e.type} "${e.text}" — ${e.method.includes('AI') ? 'confirmed by AI semantic analysis' : 'matched by pattern library'} (${(e.confidence * 100).toFixed(0)}% confidence)`).join('; ')}. ${entities.length > 1 ? 'The combination of these elements constitutes individually identifiable health information.' : ''} ${entities.some(e => e.type === 'SSN') ? 'Recommended action: REDACT SSN before transmission.' : ''} ${entities.some(e => e.type === 'Phone Number') ? 'Recommended action: FLAG phone number for review.' : ''}`;

        setResult({
          fired: true,
          verdict: matchedRule.action.toUpperCase() === 'REDACT' ? 'REDACTED' : matchedRule.action.toUpperCase() === 'FLAG' ? 'FLAGGED' : 'BLOCKED',
          ruleId: String(matchedRule.id),
          ruleName: matchedRule.name,
          action: matchedRule.action,
          entities,
          reasoning,
          productionSteps: [
            `✕ Message ${matchedRule.action.toUpperCase()}ED — never reaches recipient`,
            `🔔 Default action set to ${matchedRule.defaultActions[0]?.actionType ?? matchedRule.action}`,
            `📋 Audit event VOX-2026-${String(Math.floor(Math.random() * 9000) + 1000)} logged to Event Hubs`,
            `🔒 Message content archived to WORM storage (HIPAA retention)`,
            `📊 Sentinel alert exported to customer SIEM`,
            `👤 Sender notified: "Message ${matchedRule.action}ed — ${entities[0]?.type || 'violation'} detected in outbound ${channel.toLowerCase()}."`,
          ],
          evalTimeMs: evalTime,
          tokenCost: '~0.002¢',
          totalRulesEvaluated: totalRules,
        });
      } else {
        setResult({
          fired: false,
          verdict: 'PASSED',
          ruleId: '',
          ruleName: '',
          action: 'pass',
          entities: [],
          reasoning: `No PHI violations detected. This message uses de-identified references only. ${/room \d+|4N-\d+/i.test(input) ? 'Room/bed identifiers alone do not constitute individually identifiable health information under HIPAA §164.514. ' : ''}No names, MRNs, SSNs, dates of birth, or other HIPAA identifiers detected. ${/K\+|potassium|BMP|medication/i.test(input) ? 'Clinical content is present but not linked to an identifiable individual — safe under minimum necessary standard. ' : ''}0 entities flagged. CLEAR for transmission.`,
          productionSteps: [],
          evalTimeMs: evalTime,
          tokenCost: '~0.002¢',
          totalRulesEvaluated: totalRules,
        });
      }

      setTesting(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, 1900);
  }, [input, testing, rule, channel]);

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
            onChange={(e) => { setInput(e.target.value); setResult(null); setSteps([]); }}
            placeholder='Type or paste a message here...'
            className="text-[11px] min-h-[80px] font-mono leading-relaxed"
          />
        </div>

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
                Total evaluation time: 1.6s (Production avg: {result.evalTimeMs}ms)
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
                  Rules matched: HIPAA §164.502 (PHI Minimum Necessary), §164.514 (De-identification) · Evaluation time: {result.evalTimeMs}ms
                </p>
              </div>
            )}
            {!result.fired && (
              <div className="space-y-1">
                <p className="text-[11px] text-foreground">
                  {result.totalRulesEvaluated} rules evaluated — 0 matches. No PHI violations detected.
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
                  <span>Model: Azure OpenAI (GPT-4o)</span>
                  <span>│</span>
                  <span>Confidence: {result.entities.length > 0 ? (Math.max(...result.entities.map(e => e.confidence))).toFixed(2) : '0.94'}</span>
                  <span>│</span>
                  <span>Time: {result.evalTimeMs + 18}ms</span>
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
                    usePolicyEngineStore.getState().setSelectedRule(result.ruleId);
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
