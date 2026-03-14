import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Shield, Braces } from 'lucide-react';
import type { PolicyPatternLibraryView } from '@/lib/policyEngine';

interface Props {
  libraries: PolicyPatternLibraryView[];
}

export function PatternLibraryOverview({ libraries }: Props) {
  const totalPatterns = libraries.reduce((sum, library) => sum + library.patternCount, 0);
  const uniqueEntities = new Set(libraries.flatMap((library) => library.entityTypes));

  return (
    <Card className="clinical-shadow border-border h-full">
      <CardContent className="p-4 space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pattern Assets</p>
          <h2 className="text-sm font-semibold text-foreground mt-1">Deterministic Detection Surface</h2>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            These libraries feed the deterministic and hybrid governance rules. Editing a library changes every rule that references it.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Metric icon={Shield} label="Libraries" value={String(libraries.length)} />
          <Metric icon={Braces} label="Regex Patterns" value={String(totalPatterns)} />
          <Metric icon={Sparkles} label="Entity Types" value={String(uniqueEntities.size)} />
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Editing Guidance</p>
          <div className="mt-2 space-y-2 text-[11px] text-muted-foreground">
            <p>Keep regexes anchored to avoid incidental false positives.</p>
            <p>Prefer expanding an existing library when multiple rules share the same identifier family.</p>
            <p>Use the preview panel to verify entity types and confidence values before saving.</p>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 flex items-center justify-between">
      <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Icon className="w-3.5 h-3.5 text-primary" />
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
}
