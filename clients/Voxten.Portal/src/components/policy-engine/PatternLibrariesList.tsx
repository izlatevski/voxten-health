import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookMarked, Braces, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime, type PolicyPatternLibraryView } from '@/lib/policyEngine';
import { usePolicyEngineStore } from '@/stores/policyEngineStore';

interface Props {
  libraries: PolicyPatternLibraryView[];
  isLoading?: boolean;
}

export function PatternLibrariesList({ libraries, isLoading }: Props) {
  const { selectedPatternLibraryId, setSelectedPatternLibrary } = usePolicyEngineStore();
  const [query, setQuery] = useState('');

  const filteredLibraries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return libraries;

    return libraries.filter((library) =>
      library.id.toLowerCase().includes(normalized)
      || library.name.toLowerCase().includes(normalized)
      || (library.description ?? '').toLowerCase().includes(normalized)
      || library.entityTypes.some((entity) => entity.toLowerCase().includes(normalized)),
    );
  }, [libraries, query]);

  return (
    <Card className="clinical-shadow border-border h-full flex flex-col">
      <div className="px-3 py-2 border-b border-border space-y-1.5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{libraries.length} pattern libraries</h2>
          <p className="text-[10px] text-muted-foreground">Deterministic regex assets shared across multiple rules.</p>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-border bg-muted/20">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by library, entity, or description"
            className="h-8 text-xs pl-8"
          />
        </div>
      </div>

      <CardContent className="p-2 flex-1 overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading pattern libraries...
          </div>
        ) : filteredLibraries.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            {libraries.length === 0 ? 'No pattern libraries exist yet.' : 'No pattern libraries match your search.'}
          </p>
        ) : (
          filteredLibraries.map((library) => {
            const isSelected = selectedPatternLibraryId === library.id;

            return (
              <button
                key={library.id}
                onClick={() => setSelectedPatternLibrary(library.id)}
                className={cn(
                  'w-full text-left rounded-md border px-3 py-2.5 transition-all',
                  isSelected ? 'border-primary/25 bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:bg-muted/60',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-foreground">{library.name}</p>
                    <p className="text-[9px] mt-0.5 font-mono text-muted-foreground">{library.id}</p>
                  </div>
                  <Badge variant="outline" className="text-[8px] px-1.5 h-4 bg-card">
                    {library.patternCount} patterns
                  </Badge>
                </div>

                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                  {library.description || 'No description provided.'}
                </p>

                <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookMarked className="w-3 h-3" />
                    {library.entityTypes.slice(0, 3).join(', ') || 'No entities'}
                  </span>
                  <span className="text-border">│</span>
                  <span className="flex items-center gap-1">
                    <Braces className="w-3 h-3" />
                    Updated {formatDateTime(library.updatedAt || library.createdAt)}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
