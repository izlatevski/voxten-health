import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Sparkles } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CustomPackModal({ open, onClose }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState('scratch');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedRules, setGeneratedRules] = useState<string[] | null>(null);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGeneratedRules([
        'Internal Communication Data Classification — Flag messages containing data classified above "Internal" when sent to external recipients',
        'Executive Communication Archival — Log and archive all C-suite communications with enhanced retention (10yr)',
        'Merger/Acquisition Information Control — Block communications containing M&A keywords to non-approved parties',
        'Employee PII in Bulk Reports — Detect HR reports containing >10 employee SSNs or salary data',
      ]);
      setGenerating(false);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Create Custom Regulation Pack</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Build a compliance pack from your organization's internal policies, guidelines, or regulatory requirements.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Pack Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. CommonSpirit Internal Policy" className="h-8 text-xs" />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the policies this pack will enforce..." className="text-xs min-h-[50px] resize-none" />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Base Template</label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scratch" className="text-xs">Start from scratch</SelectItem>
                <SelectItem value="clone-hipaa" className="text-xs">Clone existing pack (HIPAA)</SelectItem>
                <SelectItem value="clone-finra" className="text-xs">Clone existing pack (FINRA)</SelectItem>
                <SelectItem value="import" className="text-xs">Import from JSON/YAML</SelectItem>
                <SelectItem value="ai" className="text-xs">AI-Assisted: Describe your policy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {template === 'ai' && (
            <div className="space-y-2 bg-primary/5 rounded-md p-3 border border-primary/15">
              <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                <Sparkles className="w-3.5 h-3.5" /> AI-Assisted Rule Generation
              </div>
              <Textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Describe your compliance requirement in plain English and VOXTEN will generate draft policy rules..."
                className="text-xs min-h-[60px] resize-none"
              />
              <Button
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={handleGenerate}
                disabled={!aiPrompt.trim() || generating}
              >
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {generating ? 'Generating...' : 'Generate Draft Rules'}
              </Button>
              {generatedRules && (
                <div className="space-y-1 mt-2">
                  <p className="text-[10px] text-muted-foreground font-medium">Generated {generatedRules.length} draft rules:</p>
                  {generatedRules.map((r, i) => (
                    <div key={i} className="text-[11px] text-foreground bg-card rounded p-2 border border-border/50">
                      {i + 1}. {r}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Applicable Channels</label>
            <div className="flex flex-wrap gap-3">
              {['Secure Messaging', 'SMS', 'Email', 'Voice', 'AI-Generated'].map(ch => (
                <label key={ch} className="flex items-center gap-1.5 text-[11px]">
                  <Checkbox defaultChecked className="w-3.5 h-3.5" />
                  {ch}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>Cancel</Button>
            <Button size="sm" className="h-8 text-xs" onClick={onClose}>Create Pack →</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
