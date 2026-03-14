import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { createPatternLibrary, updatePatternLibrary, type PatternLibraryResponse } from '@/lib/complianceApi';
import { type PolicyPatternDefinition } from '@/lib/policyEngine';
import { usePolicyEngineStore } from '@/stores/policyEngineStore';
import { Loader2, Sparkles } from 'lucide-react';

interface Props {
  libraries: PatternLibraryResponse[];
  onSaved?: () => void;
  mode?: 'create' | 'edit';
}

const emptyPatternsJson = `[
  {
    "regex": "\\\\bexample\\\\b",
    "entityType": "ExampleEntity",
    "description": "What this pattern detects",
    "confidence": 0.9,
    "flags": "i"
  }
]`;

export function PatternLibraryForm({ libraries, onSaved, mode = 'create' }: Props) {
  const { selectedPatternLibraryId, setDetailMode, setSelectedPatternLibrary } = usePolicyEngineStore();
  const library = libraries.find((item) => item.id === selectedPatternLibraryId);

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [patternsJson, setPatternsJson] = useState(emptyPatternsJson);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && library) {
      setId(library.id);
      setName(library.name);
      setDescription(library.description ?? '');
      setPatternsJson(library.patternsJson);
      setError(null);
      return;
    }

    if (mode === 'create') {
      setId('');
      setName('');
      setDescription('');
      setPatternsJson(emptyPatternsJson);
      setError(null);
    }
  }, [library, mode]);

  const preview = useMemo(() => {
    try {
      const parsed = JSON.parse(patternsJson) as unknown;
      if (!Array.isArray(parsed)) {
        return { patterns: [] as PolicyPatternDefinition[], error: 'Patterns JSON must be an array.' };
      }

      const normalized = parsed.filter((item): item is PolicyPatternDefinition =>
        !!item && typeof item === 'object' && typeof (item as PolicyPatternDefinition).regex === 'string' && typeof (item as PolicyPatternDefinition).entityType === 'string',
      );

      return { patterns: normalized, error: null };
    } catch (parseError) {
      return {
        patterns: [] as PolicyPatternDefinition[],
        error: parseError instanceof Error ? parseError.message : 'Invalid JSON',
      };
    }
  }, [patternsJson]);

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    try {
      if (!name.trim()) throw new Error('Name is required.');
      if (mode === 'create' && !id.trim()) throw new Error('ID is required.');
      if (preview.error) throw new Error(preview.error);

      if (mode === 'edit') {
        if (!library) throw new Error('Select a pattern library to edit.');
        await updatePatternLibrary(library.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          patternsJson,
        });
        setSelectedPatternLibrary(library.id);
        setDetailMode('pattern-library-detail');
      } else {
        const created = await createPatternLibrary({
          id: id.trim(),
          name: name.trim(),
          description: description.trim() || undefined,
          patternsJson,
        });
        setSelectedPatternLibrary(created.id);
        setDetailMode('pattern-library-detail');
      }

      onSaved?.();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save pattern library.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="clinical-shadow border-border h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">
          {mode === 'edit' ? 'Edit Pattern Library' : 'Create Pattern Library'}
        </h2>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Manage shared deterministic patterns without duplicating regex definitions across rules.
        </p>
      </div>

      <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Library ID</label>
            <Input
              value={id}
              onChange={(e) => setId(e.target.value)}
              disabled={mode === 'edit'}
              className="h-8 text-xs mt-1 font-mono"
              placeholder="HIPAA-COMMS-PHI-v2"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-xs mt-1"
              placeholder="HIPAA Messaging PHI Patterns v2"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs mt-1 min-h-[72px]"
              placeholder="Describe when this library should be used and what identifiers it covers."
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Patterns JSON</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Each item should include at least `regex` and `entityType`. Optional fields: `description`, `confidence`, `flags`.
              </p>
            </div>
            <Badge variant="outline" className="text-[9px] bg-card">
              {preview.patterns.length} parsed
            </Badge>
          </div>
          <Textarea
            value={patternsJson}
            onChange={(e) => setPatternsJson(e.target.value)}
            className="text-[11px] mt-3 min-h-[260px] font-mono"
            spellCheck={false}
          />
        </div>

        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Preview</p>
          </div>
          {preview.error ? (
            <p className="text-[11px] text-stat">{preview.error}</p>
          ) : preview.patterns.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No valid patterns parsed yet.</p>
          ) : (
            <div className="space-y-2">
              {preview.patterns.slice(0, 6).map((pattern, index) => (
                <div key={`${pattern.entityType}-${index}`} className="rounded-md border border-border px-2.5 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-foreground">{pattern.entityType}</span>
                    <div className="flex items-center gap-1">
                      {pattern.flags ? <Badge variant="outline" className="text-[8px] h-4 px-1.5">{pattern.flags}</Badge> : null}
                      {typeof pattern.confidence === 'number' ? (
                        <Badge variant="outline" className="text-[8px] h-4 px-1.5">{pattern.confidence.toFixed(2)}</Badge>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{pattern.description || 'No description'}</p>
                  <pre className="text-[10px] mt-1.5 font-mono text-foreground whitespace-pre-wrap break-words">{pattern.regex}</pre>
                </div>
              ))}
              {preview.patterns.length > 6 ? (
                <p className="text-[10px] text-muted-foreground">Showing 6 of {preview.patterns.length} parsed patterns.</p>
              ) : null}
            </div>
          )}
        </div>

        {error ? <p className="text-[11px] text-stat">{error}</p> : null}

        <div className="border-t border-border pt-3 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setDetailMode(mode === 'edit' ? 'pattern-library-detail' : 'pattern-library-overview')}>
            Cancel
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5" disabled={saving} onClick={handleSubmit}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {mode === 'edit' ? 'Save Changes' : 'Create Library'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
