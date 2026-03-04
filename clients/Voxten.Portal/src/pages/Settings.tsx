import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Server, Cloud, HardDrive, Wifi, MessageSquare, Video, Mail, Phone, Mic, Bot, CheckCircle, Monitor, Zap } from 'lucide-react';
import { useEHRStore } from '@/stores/ehrStore';
import { useAppStore, personas, personaOrder, type PersonaId } from '@/stores/appStore';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const personaPreview: Record<PersonaId, string> = {
  patricia: 'Shows: Governance metrics dashboard, Live Feed, Policy Engine, Compliance Reports. Hides: Clinical messaging.',
  david: 'Shows: Azure Infrastructure, Security, Data Governance, Sentinel integration. Hides: Clinical messaging.',
  rivera: 'Shows: Clinical dashboard, Governed Threads, Video Sessions, Patient Cases, EHR Integration.',
  jordan: 'Shows: Financial services demo tenant (switches all data to Meridian Capital Advisors).',
  maria: 'Shows: Clinical dashboard (nurse view), Governed Threads, Escalation alerts, Patient Cases.',
};

const voxtenServices = [
  { name: 'Secure Messaging', icon: MessageSquare, status: 'Active' },
  { name: 'Clinical Calling', icon: Video, status: 'Active' },
  { name: 'Patient Outreach (SMS)', icon: Phone, status: 'Active' },
  { name: 'Secure Email', icon: Mail, status: 'Active' },
  { name: 'Compliance Recording', icon: Mic, status: 'Active, BYOS: Configured' },
  { name: 'Escalation Automation', icon: Bot, status: 'Active' },
];

export default function SettingsPage() {
  const { demoMode, setDemoMode } = useEHRStore();
  const { currentPersona, setPersona } = useAppStore();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Demo Controls</h1>
        <p className="text-sm text-muted-foreground mt-1">Persona switching, event triggers, and platform configuration for live presentations</p>
      </div>

      {/* Demo Mode */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Demo Mode</h2>
            </div>
            <Switch checked={demoMode} onCheckedChange={setDemoMode} />
          </div>
          <p className="text-xs text-muted-foreground">
            Enable the presenter toolbar for manual control of EHR events and persona switching during live demos.
          </p>
          {demoMode && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
              Demo Toolbar Active — Ctrl+Shift+1-5 to switch personas
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Persona Switcher */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-5 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Switch Demo Persona
          </h2>
          <p className="text-xs text-muted-foreground">
            Select a persona to change the logged-in user and dashboard view simultaneously.
          </p>
          <div className="space-y-1.5">
            {personaOrder.map((pid, i) => {
              const p = personas[pid];
              return (
                <button
                  key={pid}
                  onClick={() => { setPersona(pid); toast(`Switched to ${p.name}`); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors',
                    currentPersona === pid ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:bg-muted/50'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-xs font-semibold">{p.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.title} — {p.description}</p>
                    <p className="text-[10px] text-primary/70 mt-0.5">{personaPreview[pid]}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">Ctrl+Shift+{i + 1}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Demo Event Triggers */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-5 space-y-3">
          <div>
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Demo Event Triggers
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Fire events on demand during live presentations</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
              <p className="text-sm font-semibold text-foreground mb-1">🔬 Trigger Critical Lab</p>
              <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
                Fires a critical potassium result (K+ 6.8) for Martinez, Robert. Activates escalation workflow with live countdown timer.
              </p>
              <Button
                size="sm"
                className="w-full text-[11px] h-7 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={() => toast.error('🔬 Critical Lab Result: K+ 6.8 mEq/L — Martinez, Robert', { description: 'Escalation workflow activated. Navigate to Escalations to view countdown.' })}
              >
                Fire Event
              </Button>
            </div>
            <div className="p-3 rounded-lg border border-warning/20 bg-warning/5">
              <p className="text-sm font-semibold text-foreground mb-1">⚠ Trigger Compliance Violation</p>
              <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
                Fires a PHI violation event in the Live Feed and Governed Threads. Shows real-time detection and redaction.
              </p>
              <Button
                size="sm"
                className="w-full text-[11px] h-7 bg-warning hover:bg-warning/90 text-warning-foreground"
                onClick={() => toast.warning('⚠ PHI Violation Detected — SMS channel', { description: 'Patient SSN transmitted via unsecured channel. Auto-redacted. View in Live Feed.' })}
              >
                Fire Event
              </Button>
            </div>
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
              <p className="text-sm font-semibold text-foreground mb-1">📱 Trigger Off-Channel Detection</p>
              <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
                Fires an off-channel SMS reference detection. Shows the Off-Channel workflow in Escalation.
              </p>
              <Button
                size="sm"
                className="w-full text-[11px] h-7"
                onClick={() => toast.info('📱 Off-Channel Reference Detected', { description: 'SMS reference to patient data found in external message. Navigate to Escalations → Off-Channel workflow.' })}
              >
                Fire Event
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VOXTEN Communication Platform */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Wifi className="w-5 h-5 text-primary" />
              VOXTEN Communication Platform
            </h2>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1">
              <CheckCircle className="w-3 h-3" />
              Connected
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Region</span>
              <p className="font-medium text-foreground">East US 2</p>
            </div>
            <div>
              <span className="text-muted-foreground">Instance</span>
              <p className="font-medium text-foreground font-mono text-xs">voxten-health-prod</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Services</p>
            <div className="grid grid-cols-2 gap-2">
              {voxtenServices.map((s) => (
                <div key={s.name} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border">
                  <s.icon className="w-4 h-4 text-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-[10px] text-success">{s.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deployment */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            Healthcare Deployment Options
          </h2>
          <div className="grid gap-3">
            {[
              { icon: Cloud, title: 'HIPAA-Compliant Cloud', desc: 'Fully managed, BAA included, SOC 2 certified infrastructure' },
              { icon: Shield, title: 'Private Healthcare Cloud', desc: 'Customer-managed VPC, dedicated resources, data sovereignty' },
              { icon: HardDrive, title: 'On-Premise', desc: 'Air-gapped capable, hospital data center deployment' },
              { icon: Cloud, title: 'Hybrid', desc: 'Cloud control plane with on-premise data storage' },
            ].map((d) => (
              <div key={d.title} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <d.icon className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">{d.title}</p>
                  <p className="text-xs text-muted-foreground">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="clinical-shadow border-border">
        <CardContent className="p-5 space-y-3">
          <h2 className="font-semibold text-foreground">Session Security</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Auto-logout timeout</span>
              <Badge variant="outline">15 minutes</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Multi-Factor Authentication</span>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Password Policy</span>
              <Badge variant="outline">12+ chars, mixed case, special</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
