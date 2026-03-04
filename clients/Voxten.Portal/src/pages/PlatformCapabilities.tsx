import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquareLock,
  Video,
  AlertTriangle,
  UserRoundSearch,
  Send,
  FileLock2,
  ShieldCheck,
  LockKeyhole,
  BarChart3,
  Plug,
  Clock,
  type LucideIcon,
} from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  tagline: string;
}

const features: Feature[] = [
  { icon: MessageSquareLock, title: 'Secure Clinical Messaging', tagline: 'Every message encrypted, logged, and tied to a patient.' },
  { icon: Video, title: 'Embedded Voice & Video', tagline: 'Secure clinical calls that never leave the compliance perimeter.' },
  { icon: AlertTriangle, title: 'Clinical Escalation Engine', tagline: 'When seconds matter, the system acts — not a person.' },
  { icon: UserRoundSearch, title: 'Patient Context Engine', tagline: 'Every communication linked to the patient it\'s about.' },
  { icon: Send, title: 'Patient Outreach', tagline: 'Reach patients by text, email, or phone — from inside the chart.' },
  { icon: FileLock2, title: 'Immutable Compliance Records', tagline: 'Sealed evidence. Available when regulators ask.' },
  { icon: ShieldCheck, title: 'Compliance Intelligence', tagline: 'See your compliance posture in real time.' },
  { icon: LockKeyhole, title: 'Role-Based Access', tagline: 'The right information to the right clinician. Nothing more.' },
  { icon: BarChart3, title: 'Operational Intelligence', tagline: 'Measure response times, escalation rates, communication coverage.' },
  { icon: Plug, title: 'EHR Integration', tagline: 'VOXTEN lives inside your clinical ecosystem.' },
];

const roadmap = [
  { title: 'AI Clinical Triage', desc: 'Automated message priority detection and escalation recommendation', status: 'Planned' },
  { title: 'AI Communication Summarization', desc: 'Auto-generated shift summaries from communication data', status: 'Planned' },
  { title: 'Prior Authorization Thread Management', desc: 'Structured PA communication with payer integration', status: 'Planned' },
  { title: 'SDOH Context Integration', desc: 'Social determinants data in patient communication context', status: 'In Development' },
  { title: 'Real-Time Language Translation', desc: 'In-chat translation for multilingual care teams', status: 'Planned' },
  { title: 'Voice-Activated Messaging', desc: 'Hands-free clinical messaging for OR and procedural settings', status: 'Planned' },
];

export default function PlatformCapabilities() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Platform Capabilities</h1>
        <p className="text-sm text-muted-foreground mt-1">VOXTEN's comprehensive healthcare communication compliance feature set</p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((f) => (
          <Card key={f.title} className="clinical-shadow border-border hover:border-primary/30 transition-colors group">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors flex-shrink-0">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{f.tagline}</p>
                <button className="text-xs font-medium text-primary hover:underline mt-2 inline-block">Learn More →</button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Roadmap */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">What's Next</h2>
        <p className="text-sm text-muted-foreground mb-4">Upcoming capabilities on the VOXTEN roadmap</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roadmap.map((r) => (
            <Card key={r.title} className="border-border border-dashed">
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{r.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] flex-shrink-0 bg-primary/5 text-primary border-primary/20">
                  {r.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-2">
        <ShieldCheck className="w-4 h-4 text-success" />
        <span className="text-xs text-muted-foreground">Secured by VOXTEN | HIPAA Compliant | HITRUST Aligned</span>
      </div>
    </div>
  );
}
