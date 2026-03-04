import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { usePolicyEngineStore, policyRules } from '@/stores/policyEngineStore';
import { FlaskConical, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface TestResult {
  fired: boolean;
  verdict: string;
  entities: { text: string; type: string; confidence: number }[];
  reasoning: string;
}

export function TestRuleModal({ open, onClose }: Props) {
  const { selectedRuleId } = usePolicyEngineStore();
  const rule = policyRules.find((r) => r.id === selectedRuleId);
  const [input, setInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  if (!rule) return null;

  const handleTest = () => {
    setTesting(true);
    setResult(null);

    // Simulate AI analysis with a delay
    setTimeout(() => {
      const lowerInput = input.toLowerCase();
      const hasPHI = /\b(mrn|ssn|dob|patient|john|smith|doe)\b/i.test(input) ||
        /\b\d{3}-\d{2}-\d{4}\b/.test(input) ||
        /\bmrn[\s-]?\d+/i.test(input) ||
        /potassium|k\+|lab result|diagnosis/i.test(input);
      const hasFinancial = /guaranteed|assured returns|performance|account\s*#?\d/i.test(input);
      const shouldFire = hasPHI || hasFinancial;

      const entities: TestResult['entities'] = [];
      // Extract mock entities
      const nameMatch = input.match(/\b([A-Z][a-z]+ [A-Z][a-z]+)\b/);
      if (nameMatch) entities.push({ text: nameMatch[1], type: 'Person', confidence: 0.97 });
      const mrnMatch = input.match(/MRN[\s-]?(\d+)/i);
      if (mrnMatch) entities.push({ text: `MRN ${mrnMatch[1]}`, type: 'Medical Record Number', confidence: 0.99 });
      const ssnMatch = input.match(/\b\d{3}-\d{2}-\d{4}\b/);
      if (ssnMatch) entities.push({ text: ssnMatch[0], type: 'SSN', confidence: 0.99 });
      if (/potassium|k\+/i.test(input)) entities.push({ text: input.match(/(?:potassium|k\+)[^.;]*/i)?.[0] || 'potassium value', type: 'Lab Result (PHI)', confidence: 0.95 });
      if (/guaranteed/i.test(input)) entities.push({ text: 'guaranteed', type: 'Forward-Looking Statement', confidence: 0.92 });

      setResult({
        fired: shouldFire,
        verdict: shouldFire ? rule.action.toUpperCase() : 'PASS',
        entities,
        reasoning: shouldFire
          ? `Azure OpenAI semantic analysis detected ${entities.length} sensitive entit${entities.length === 1 ? 'y' : 'ies'}. Rule ${rule.id} matched with action: ${rule.action.toUpperCase()}. ${rule.analysisMethod === 'both' ? 'Pattern match and AI analysis both confirmed.' : rule.analysisMethod === 'ai' ? 'AI semantic analysis confirmed.' : 'Regex pattern match confirmed.'}`
          : `No policy-relevant content detected. ${rule.analysisMethod === 'both' ? 'Both pattern match and AI semantic analysis returned negative.' : 'Analysis returned negative.'} Communication would pass governance check.`,
      });
      setTesting(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FlaskConical className="w-4 h-4 text-primary" />
            Test Rule: {rule.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Paste sample text below to test if rule <code className="font-mono text-[11px] bg-muted px-1 rounded">{rule.id}</code> would fire.
            </p>
            <Textarea
              value={input}
              onChange={(e) => { setInput(e.target.value); setResult(null); }}
              placeholder='e.g. "The patient John Smith, MRN 38291, has a potassium of 6.8"'
              className="text-sm min-h-[80px]"
            />
          </div>

          <Button
            onClick={handleTest}
            disabled={!input.trim() || testing}
            className="w-full gap-2"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
            {testing ? 'Analyzing...' : 'Run Test'}
          </Button>

          {result && (
            <div className={cn(
              'rounded-lg border p-4 space-y-3',
              result.fired ? 'border-stat/30 bg-stat/5' : 'border-success/30 bg-success/5'
            )}>
              <div className="flex items-center gap-2">
                {result.fired ? (
                  <ShieldAlert className="w-5 h-5 text-stat" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-success" />
                )}
                <span className={cn('text-sm font-bold', result.fired ? 'text-stat' : 'text-success')}>
                  {result.verdict}
                </span>
                <span className="text-xs text-muted-foreground">
                  — Rule {result.fired ? 'FIRED' : 'did not fire'}
                </span>
              </div>

              {result.entities.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground mb-1">Detected Entities:</p>
                  <div className="space-y-1">
                    {result.entities.map((e, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-background/50 rounded px-2 py-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5">{e.type}</Badge>
                          <span className="font-mono text-foreground">[{e.text}]</span>
                        </div>
                        <span className="text-muted-foreground tabular-nums">{(e.confidence * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[11px] font-medium text-muted-foreground mb-1">AI Reasoning:</p>
                <p className="text-xs text-foreground leading-relaxed">{result.reasoning}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
