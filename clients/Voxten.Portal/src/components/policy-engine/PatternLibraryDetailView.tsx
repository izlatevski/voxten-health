import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime, type PolicyPatternDefinition, type PolicyPatternLibraryView } from '@/lib/policyEngine';
import { usePolicyEngineStore } from '@/stores/policyEngineStore';
import { Braces, Edit, ShieldAlert } from 'lucide-react';

interface Props {
  libraries: PolicyPatternLibraryView[];
}

export function PatternLibraryDetailView({ libraries }: Props) {
  const { selectedPatternLibraryId, setDetailMode } = usePolicyEngineStore();
  const library = libraries.find((item) => item.id === selectedPatternLibraryId);

  const patterns = useMemo<PolicyPatternDefinition[]>(() => library?.patterns ?? [], [library]);

  if (!library) {
    return (
      <Card className="clinical-shadow border-border h-full flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Select a pattern library to inspect its patterns</p>
      </Card>
    );
  }

  return (
    <Card className="clinical-shadow border-border h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{library.name}</h2>
            <p className="text-[10px] mt-0.5 font-mono text-muted-foreground">{library.id}</p>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5" onClick={() => setDetailMode('pattern-library-edit')}>
            <Edit className="w-3 h-3" />
            Edit
          </Button>
        </div>
      </div>

      <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
        <Section title="Overview">
          <Row label="Description" value={library.description || 'No description provided'} />
          <Row label="Pattern Count" value={String(library.patternCount)} />
          <Row label="Entity Types" value={library.entityTypes.join(', ') || 'None'} />
          <Row label="Created" value={formatDateTime(library.createdAt)} />
          <Row label="Updated" value={formatDateTime(library.updatedAt || library.createdAt)} />
        </Section>

        <Section title="Patterns">
          {patterns.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No patterns defined in this library.</p>
          ) : (
            <div className="space-y-2">
              {patterns.map((pattern, index) => (
                <div key={`${pattern.entityType}-${index}`} className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <ShieldAlert className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-foreground">{pattern.entityType}</p>
                        <p className="text-[10px] text-muted-foreground">{pattern.description || 'No description'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {pattern.flags ? (
                        <Badge variant="outline" className="text-[8px] h-4 px-1.5">{pattern.flags}</Badge>
                      ) : null}
                      <Badge variant="outline" className="text-[8px] h-4 px-1.5 bg-card">
                        {(pattern.confidence ?? 0).toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 rounded-md border border-border/70 bg-card px-2.5 py-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                      <Braces className="w-3 h-3" />
                      Regex
                    </div>
                    <pre className="text-[10px] font-mono text-foreground whitespace-pre-wrap break-words">{pattern.regex}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Stored JSON">
          <pre className="text-[10px] text-foreground bg-muted/50 rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-words">
            {library.patternsJson}
          </pre>
        </Section>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-3 text-[11px]">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-foreground font-medium text-right">{value}</span>
    </div>
  );
}
