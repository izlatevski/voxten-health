import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useEHRStore } from '@/stores/ehrStore';
import {
  fhirPatientResource,
  fhirEncounterResource,
  fhirObservations,
  fhirDocumentReferences,
} from '@/data/ehrData';
import { ChevronDown, ChevronRight, FileText, X } from 'lucide-react';

const flagColors = {
  critical: 'bg-stat/10 text-stat border-stat/20',
  high: 'bg-urgent/10 text-urgent border-urgent/20',
  low: 'bg-urgent/10 text-urgent border-urgent/20',
  normal: 'bg-success/10 text-success border-success/20',
};

const flagLabels = {
  critical: 'CRITICAL HIGH',
  high: 'HIGH',
  low: 'LOW',
  normal: 'NORMAL',
};

function JsonView({ data }: { data: unknown }) {
  const json = JSON.stringify(data, null, 2);
  return (
    <pre className="text-xs font-mono bg-muted/50 rounded-lg p-3 overflow-x-auto max-h-64 border border-border">
      {json.split('\n').map((line, i) => {
        const colored = line
          .replace(/"([^"]+)":/g, '<key>"$1"</key>:')
          .replace(/: "([^"]+)"/g, ': <val>"$1"</val>')
          .replace(/: (\d+\.?\d*)/g, ': <num>$1</num>');
        return (
          <div key={i} dangerouslySetInnerHTML={{
            __html: colored
              .replace(/<key>/g, '<span class="text-primary">')
              .replace(/<\/key>/g, '</span>')
              .replace(/<val>/g, '<span class="text-success">')
              .replace(/<\/val>/g, '</span>')
              .replace(/<num>/g, '<span class="text-urgent">')
              .replace(/<\/num>/g, '</span>')
          }} />
        );
      })}
    </pre>
  );
}

function AccordionSection({ title, fhirId, lastUpdated, defaultOpen, children }: {
  title: string; fhirId: string; lastUpdated: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="text-[10px] text-muted-foreground font-mono ml-auto">{fhirId}</span>
        <span className="text-[10px] text-muted-foreground">Updated: {new Date(lastUpdated).toLocaleString()}</span>
      </button>
      {open && (
        <div className="p-4 space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="text-[11px] text-primary hover:underline font-medium"
            >
              {showRaw ? 'Formatted' : 'Raw JSON'}
            </button>
          </div>
          {showRaw ? children : children}
        </div>
      )}
    </div>
  );
}

export function FhirResourceViewer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { connectionStatus } = useEHRStore();
  const [viewMode, setViewMode] = useState<Record<string, boolean>>({});

  if (!open) return null;

  const toggleRaw = (key: string) => setViewMode((v) => ({ ...v, [key]: !v[key] }));

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-card border-l border-border z-40 flex flex-col shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">FHIR Resource Viewer</h2>
          <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-primary/10 text-primary border-primary/20">
            FHIR R4
          </Badge>
          {connectionStatus === 'offline' && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-urgent/10 text-urgent border-urgent/20">Cached</Badge>
          )}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Patient */}
        <AccordionSection title="Patient" fhirId={fhirPatientResource.id} lastUpdated={fhirPatientResource.meta.lastUpdated} defaultOpen>
          {viewMode['patient'] ? (
            <JsonView data={fhirPatientResource} />
          ) : (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Name:</span> <span className="font-medium text-foreground">{fhirPatientResource.name[0].given.join(' ')} {fhirPatientResource.name[0].family}</span></div>
                <div><span className="text-muted-foreground">DOB:</span> <span className="text-foreground">{fhirPatientResource.birthDate}</span></div>
                <div><span className="text-muted-foreground">Gender:</span> <span className="text-foreground">{fhirPatientResource.gender}</span></div>
                <div><span className="text-muted-foreground">MRN:</span> <span className="text-foreground font-mono">{fhirPatientResource.identifier[0].value}</span></div>
              </div>
              <button onClick={() => toggleRaw('patient')} className="text-[11px] text-primary hover:underline">View Raw JSON →</button>
            </div>
          )}
          {viewMode['patient'] && (
            <button onClick={() => toggleRaw('patient')} className="text-[11px] text-primary hover:underline mt-2">View Formatted →</button>
          )}
        </AccordionSection>

        {/* Encounter */}
        <AccordionSection title="Encounter" fhirId={fhirEncounterResource.id} lastUpdated={fhirEncounterResource.meta.lastUpdated}>
          {viewMode['encounter'] ? (
            <JsonView data={fhirEncounterResource} />
          ) : (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Status:</span> <span className="text-foreground capitalize">{fhirEncounterResource.status}</span></div>
                <div><span className="text-muted-foreground">Class:</span> <span className="text-foreground">{fhirEncounterResource.class.display}</span></div>
                <div><span className="text-muted-foreground">Location:</span> <span className="text-foreground">{fhirEncounterResource.location[0].location.display}</span></div>
                <div><span className="text-muted-foreground">Provider:</span> <span className="text-foreground">{fhirEncounterResource.serviceProvider.display}</span></div>
              </div>
              <button onClick={() => toggleRaw('encounter')} className="text-[11px] text-primary hover:underline">View Raw JSON →</button>
            </div>
          )}
          {viewMode['encounter'] && (
            <button onClick={() => toggleRaw('encounter')} className="text-[11px] text-primary hover:underline mt-2">View Formatted →</button>
          )}
        </AccordionSection>

        {/* Observations */}
        <AccordionSection title="Observations (Lab Results)" fhirId="Bundle" lastUpdated="2026-02-22T12:15:00Z" defaultOpen>
          <div className="space-y-2">
            {fhirObservations.map((obs) => (
              <div
                key={obs.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border',
                  obs.flag === 'critical' && 'border-stat/30 bg-stat/5 animate-pulse-subtle'
                )}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{obs.code.text}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">LOINC: {obs.code.coding[0].code}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">
                    {obs.valueQuantity.value} <span className="text-xs font-normal text-muted-foreground">{obs.valueQuantity.unit}</span>
                  </p>
                  <div className="flex items-center gap-2 justify-end">
                    <Badge variant="outline" className={cn('text-[10px] h-4 px-1.5 font-bold', flagColors[obs.flag])}>
                      {flagLabels[obs.flag]}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{obs.referenceRange[0].text}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* Documents */}
        <AccordionSection title="DocumentReferences" fhirId="Bundle" lastUpdated="2026-02-22T10:00:00Z">
          <div className="space-y-2">
            {fhirDocumentReferences.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">{doc.description}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{doc.type.coding[0].display}</p>
                </div>
                <Badge variant="outline" className={cn('text-[10px] h-4 px-1.5',
                  doc.status === 'current' ? 'bg-success/10 text-success border-success/20' : 'bg-urgent/10 text-urgent border-urgent/20'
                )}>
                  {doc.status}
                </Badge>
              </div>
            ))}
          </div>
        </AccordionSection>
      </div>
    </div>
  );
}
