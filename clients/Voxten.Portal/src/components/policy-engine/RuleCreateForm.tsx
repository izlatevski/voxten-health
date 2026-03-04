import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { usePolicyEngineStore, regulationPacks } from '@/stores/policyEngineStore';
import { ArrowLeft, Play } from 'lucide-react';

export function RuleCreateForm() {
  const { setDetailMode, selectedPackId } = usePolicyEngineStore();
  const [name, setName] = useState('');
  const [packId, setPackId] = useState(selectedPackId || 'hipaa');
  const [description, setDescription] = useState('');
  const [channels, setChannels] = useState<string[]>(['SMS']);
  const [direction, setDirection] = useState('outbound');
  const [method, setMethod] = useState('both');
  const [threshold, setThreshold] = useState([0.85]);
  const [action, setAction] = useState('block');
  const [severity, setSeverity] = useState('critical');
  const [notify, setNotify] = useState('Patricia Okonkwo (CCO)');

  const channelOptions = ['SMS', 'Email', 'Secure Messaging', 'Voice', 'AI-Generated'];

  const toggleChannel = (ch: string) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  return (
    <Card className="clinical-shadow border-border h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <button onClick={() => setDetailMode('pack-overview')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <h2 className="text-sm font-semibold text-foreground">Create New Policy Rule</h2>
      </div>

      <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* Name */}
        <Field label="Rule Name">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. PHI Detection in Voice Transcripts" className="h-8 text-[11px]" />
        </Field>

        {/* Pack */}
        <Field label="Regulation Pack">
          <Select value={packId} onValueChange={setPackId}>
            <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {regulationPacks.filter(p => p.status === 'active').map(p => (
                <SelectItem key={p.id} value={p.id} className="text-[11px]">{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* Description */}
        <Field label="Description">
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what this rule detects and why..." className="text-[11px] min-h-[50px] resize-none" />
        </Field>

        <div className="border-t border-border pt-3">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">TRIGGER CONDITIONS</h3>

          <Field label="Channels">
            <div className="flex flex-wrap gap-2">
              {channelOptions.map(ch => (
                <label key={ch} className="flex items-center gap-1.5 text-[11px]">
                  <Checkbox checked={channels.includes(ch)} onCheckedChange={() => toggleChannel(ch)} className="w-3.5 h-3.5" />
                  {ch}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Direction">
            <div className="flex gap-3">
              {['outbound', 'inbound', 'both'].map(d => (
                <label key={d} className="flex items-center gap-1.5 text-[11px]">
                  <input type="radio" name="direction" checked={direction === d} onChange={() => setDirection(d)} className="w-3 h-3" />
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </label>
              ))}
            </div>
          </Field>
        </div>

        <div className="border-t border-border pt-3">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">ANALYSIS METHOD</h3>
          <div className="space-y-1.5">
            {[
              { value: 'pattern', label: 'Pattern Match (Regex) — Fast, exact' },
              { value: 'ai', label: 'AI Semantic — Contextual, nuanced' },
              { value: 'both', label: 'Both (Layered) — Recommended' },
            ].map(m => (
              <label key={m.value} className="flex items-center gap-2 text-[11px] px-2 py-1 rounded hover:bg-muted cursor-pointer">
                <input type="radio" name="method" checked={method === m.value} onChange={() => setMethod(m.value)} className="w-3 h-3" />
                {m.label}
              </label>
            ))}
          </div>

          {(method === 'ai' || method === 'both') && (
            <Field label={`AI Confidence Threshold: ${threshold[0].toFixed(2)}`}>
              <Slider value={threshold} onValueChange={setThreshold} min={0.5} max={1.0} step={0.01} className="py-1" />
              <p className="text-[9px] text-muted-foreground mt-0.5">0.50 = catch everything · 1.00 = only certain matches</p>
            </Field>
          )}
        </div>

        <div className="border-t border-border pt-3">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">ACTION ON MATCH</h3>

          <Field label="Primary Action">
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="block" className="text-[11px]">Block Transmission</SelectItem>
                <SelectItem value="flag" className="text-[11px]">Flag for Review</SelectItem>
                <SelectItem value="redact" className="text-[11px]">Redact & Send</SelectItem>
                <SelectItem value="log" className="text-[11px]">Log Only</SelectItem>
                <SelectItem value="escalate" className="text-[11px]">Escalate</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Notify">
            <Select value={notify} onValueChange={setNotify}>
              <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Patricia Okonkwo (CCO)" className="text-[11px]">Patricia Okonkwo (CCO)</SelectItem>
                <SelectItem value="Privacy Officer" className="text-[11px]">Privacy Officer</SelectItem>
                <SelectItem value="IT Security" className="text-[11px]">IT Security</SelectItem>
                <SelectItem value="Branch Manager" className="text-[11px]">Branch Manager</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Severity">
            <div className="flex gap-3">
              {['low', 'medium', 'high', 'critical'].map(s => (
                <label key={s} className="flex items-center gap-1.5 text-[11px]">
                  <input type="radio" name="severity" checked={severity === s} onChange={() => setSeverity(s)} className="w-3 h-3" />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </label>
              ))}
            </div>
          </Field>
        </div>

        {/* Actions */}
        <div className="border-t border-border pt-3 flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => setDetailMode('pack-overview')}>
            Cancel
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[11px]">
            Save as Draft
          </Button>
          <Button size="sm" className="h-8 text-[11px] gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setDetailMode('rule-tester')}>
            <Play className="w-3 h-3" /> Test & Activate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 mb-2">
      <label className="text-[10px] text-muted-foreground font-medium">{label}</label>
      {children}
    </div>
  );
}
