import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { createPack } from '@/lib/complianceApi';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void | Promise<void>;
}

function toPackId(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50) || 'custom-pack'
  );
}

export function CustomPackModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sector, setSector] = useState('Healthcare');
  const [retentionDays, setRetentionDays] = useState('365');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const packId = useMemo(() => toPackId(name), [name]);

  async function handleCreate() {
    if (!name.trim()) {
      setError('Pack name is required.');
      return;
    }

    const retention = Number.parseInt(retentionDays, 10);
    if (!Number.isFinite(retention) || retention <= 0) {
      setError('Retention days must be a positive number.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createPack({
        id: packId,
        name: name.trim(),
        description: description.trim() || undefined,
        sector,
        retentionDays: retention,
      });
      await onCreated?.();
      setName('');
      setDescription('');
      setSector('Healthcare');
      setRetentionDays('365');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create pack');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Create Rule Pack</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Create a pack that matches the backend `RulePack` contract.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Pack Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HIPAA Messaging Baseline" className="h-8 text-xs" />
          </Field>

          <Field label="Pack ID Preview">
            <Input value={packId} readOnly className="h-8 text-xs font-mono bg-muted/30" />
          </Field>

          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the pack and the policy set it represents..." className="text-xs min-h-[60px] resize-none" />
          </Field>

          <Field label="Sector">
            <Select value={sector} onValueChange={setSector}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Healthcare" className="text-xs">Healthcare</SelectItem>
                <SelectItem value="Finance" className="text-xs">Finance</SelectItem>
                <SelectItem value="Government" className="text-xs">Government</SelectItem>
                <SelectItem value="Technology" className="text-xs">Technology</SelectItem>
                <SelectItem value="Legal" className="text-xs">Legal</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Retention Days">
            <Input value={retentionDays} onChange={(e) => setRetentionDays(e.target.value)} inputMode="numeric" className="h-8 text-xs" />
          </Field>

          {error ? <p className="text-[11px] text-stat">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Create Pack
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-muted-foreground font-medium">{label}</label>
      {children}
    </div>
  );
}
