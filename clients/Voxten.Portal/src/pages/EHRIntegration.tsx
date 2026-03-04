import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useEHRStore } from '@/stores/ehrStore';
import { Shield, Activity, Database, Workflow, ArrowDownLeft, ArrowUpRight, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EpicShowroomModal } from '@/components/ehr/EpicShowroomModal';

/* ── Integration Activity Feed ── */
const activityFeed = [
  { time: '14:23:07', dir: 'in', type: 'Observation', desc: 'Lab Result K+ 6.8', source: 'Epic Lab Interface', hl7: 'ORU^R01' },
  { time: '14:22:41', dir: 'in', type: 'ADT^A02', desc: 'Patient Transfer 4N → ICU', source: 'Epic ADT', hl7: 'ADT^A02' },
  { time: '14:22:18', dir: 'out', type: 'DocumentReference', desc: 'VOXTEN Thread Export', source: 'Epic Chart', hl7: 'MDM^T02' },
  { time: '14:21:55', dir: 'in', type: 'MedicationAdministration', desc: 'IV Furosemide 40mg', source: 'Epic MAR', hl7: 'RAS^O17' },
  { time: '14:20:12', dir: 'out', type: 'Communication', desc: 'Care team alert sent', source: 'Epic InBasket', hl7: 'SIU^S12' },
  { time: '14:19:30', dir: 'in', type: 'Observation', desc: 'Vitals: BP 142/88, HR 92', source: 'Epic Flowsheets', hl7: 'ORU^R01' },
  { time: '14:18:03', dir: 'in', type: 'DiagnosticReport', desc: 'BMP Panel Complete', source: 'Epic Lab Interface', hl7: 'ORU^R01' },
  { time: '14:15:44', dir: 'out', type: 'Flag', desc: 'Clinical escalation flag', source: 'Epic Chart', hl7: 'ADT^A08' },
];

/* ── Config sections ── */
const configSections = [
  {
    title: 'Subscribed Event Types',
    items: [
      { label: 'Lab Results (ORU^R01)', enabled: true },
      { label: 'ADT Events (ADT^A01-A08)', enabled: true },
      { label: 'Medication Admin (RAS^O17)', enabled: true },
      { label: 'Order Entry (ORM^O01)', enabled: true },
      { label: 'Clinical Documents (MDM^T02)', enabled: false },
    ],
  },
  {
    title: 'FHIR Resource Scopes',
    items: [
      { label: 'Patient/*.read', enabled: true },
      { label: 'Observation/*.read', enabled: true },
      { label: 'Encounter/*.read', enabled: true },
      { label: 'DocumentReference/*.write', enabled: true },
      { label: 'MedicationRequest/*.read', enabled: false },
    ],
  },
];

export default function EHRIntegration() {
  const { ehrVendor, ehrVersion, fhirEndpoint, connectionStatus, launch, practitioner, encounter } = useEHRStore();
  const [showroom, setShowroom] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="text-[11px] text-muted-foreground">
        Integration <span className="mx-1">›</span> <span className="text-foreground font-medium">EHR Integration</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">EHR Integration</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Connection status, data flow monitoring, and integration configuration</p>
        </div>
        <button
          onClick={() => setShowroom(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">EHR Demo Mode</span>
        </button>
      </div>

      {/* Connection Cards — tighter spacing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="clinical-shadow border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Connection</h3>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendor</span>
                <span className="font-medium text-foreground">{ehrVendor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="text-foreground">{ehrVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className={cn(
                  'text-[10px] h-4 px-1.5',
                  connectionStatus === 'connected' ? 'bg-success/10 text-success border-success/20' :
                  connectionStatus === 'degraded' ? 'bg-urgent/10 text-urgent border-urgent/20' :
                  'bg-stat/10 text-stat border-stat/20'
                )}>{connectionStatus}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clinical-shadow border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">FHIR Endpoint</h3>
            </div>
            <div className="space-y-1.5 text-xs">
              <p className="font-mono text-[10px] text-muted-foreground break-all">{fhirEndpoint}</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client ID</span>
                <span className="font-mono text-foreground">{launch.clientId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scopes</span>
                <span className="text-foreground">{launch.scope.split(' ').length} granted</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clinical-shadow border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Workflow className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Session</h3>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Practitioner</span>
                <span className="font-medium text-foreground">{practitioner.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">NPI</span>
                <span className="font-mono text-foreground">{practitioner.npi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Facility</span>
                <span className="text-foreground">{encounter.facility.split(' - ')[1]}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certification status line */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <CheckCircle className="w-3 h-3 text-success" />
        <span>FHIR R4 Certified</span>
        <span className="text-border">|</span>
        <span>SMART on FHIR Authorized</span>
        <span className="text-border">|</span>
        <span>Last validation: 2h ago</span>
      </div>

      {/* Integration Activity Feed */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2">Integration Activity</h2>
        <Card className="clinical-shadow border-border">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {activityFeed.map((evt, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2 text-xs hover:bg-muted/30 transition-colors">
                  <span className="font-mono text-muted-foreground w-16 flex-shrink-0">{evt.time}</span>
                  {evt.dir === 'in' ? (
                    <ArrowDownLeft className="w-3.5 h-3.5 text-success flex-shrink-0" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  )}
                  <span className={cn('text-[10px] font-medium flex-shrink-0', evt.dir === 'in' ? 'text-success' : 'text-primary')}>
                    {evt.dir === 'in' ? 'Received' : 'Sent'}
                  </span>
                  <span className="font-medium text-foreground flex-shrink-0">{evt.type}</span>
                  <span className="text-muted-foreground truncate flex-1">({evt.desc})</span>
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-mono flex-shrink-0">{evt.hl7}</Badge>
                  <span className="text-muted-foreground flex-shrink-0">{evt.source}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration */}
      <div>
        <button
          onClick={() => setConfigOpen(!configOpen)}
          className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"
        >
          {configOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Integration Configuration
        </button>
        {configOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {configSections.map((section) => (
              <Card key={section.title} className="clinical-shadow border-border">
                <CardContent className="p-4">
                  <h3 className="text-xs font-semibold text-foreground mb-2">{section.title}</h3>
                  <div className="space-y-1.5">
                    {section.items.map((item) => (
                      <label key={item.label} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" defaultChecked={item.enabled} className="rounded" />
                        <span className={cn(item.enabled ? 'text-foreground' : 'text-muted-foreground')}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Audit callout — compact */}
      <Card className="clinical-shadow border-border bg-primary/5">
        <CardContent className="p-3 flex items-center gap-3">
          <Shield className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-xs text-muted-foreground flex-1">
            <span className="font-medium text-foreground">Compliance & Audit Overlay Active</span> — Every FHIR access, message, alert, and escalation is logged with SHA-256 integrity hash.
          </p>
          <button
            onClick={() => {
              import('sonner').then(({ toast }) => toast.success('Audit log exported — 247 events | SHA-256: a7b3c9d2e1f0...'));
            }}
            className="text-[11px] font-medium text-primary hover:underline whitespace-nowrap"
          >
            Export Audit Log
          </button>
        </CardContent>
      </Card>

      <EpicShowroomModal open={showroom} onClose={() => setShowroom(false)} />
    </div>
  );
}
