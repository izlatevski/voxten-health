import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Search, User, AlertTriangle, MessageSquare, Mic, Bot,
  Monitor, Activity, Clock, CheckCircle, ChevronDown,
} from 'lucide-react';

/* ── Patient Data ── */
interface Patient {
  id: string;
  name: string;
  mrn: string;
  age: number;
  gender: string;
  location: string;
  attending: string;
  status: 'critical' | 'stable' | 'discharge-pending';
  allergies: string[];
  department: string;
  timeline: TimelineEvent[];
}

interface TimelineEvent {
  time: string;
  channel: string;
  icon: React.ElementType;
  participants: string;
  desc: string;
  verdict: string;
  verdictColor: string;
}

const patients: Patient[] = [
  {
    id: '1', name: 'Martinez, Robert', mrn: 'MRN-0038291', age: 67, gender: 'M',
    location: '4N-302', attending: 'Dr. Rivera', status: 'critical', department: 'Medicine',
    allergies: ['Sulfa', 'Penicillin'],
    timeline: [
      { time: '14:23', channel: 'Secure Chat', icon: MessageSquare, participants: 'Dr. Rivera → Care Team', desc: 'Treatment plan discussion', verdict: '✓ Compliant', verdictColor: 'text-success' },
      { time: '14:15', channel: 'AI-Generated', icon: Bot, participants: 'Copilot', desc: 'Clinical summary', verdict: '✓ AI Governed', verdictColor: 'text-success' },
      { time: '13:45', channel: 'Voice Call', icon: Mic, participants: 'Dr. Rivera → Pharmacy', desc: 'Medication verification', verdict: '✓ Compliant', verdictColor: 'text-success' },
      { time: '12:30', channel: 'System', icon: AlertTriangle, participants: 'VOXTEN', desc: 'Critical lab escalation triggered | K+ 6.8', verdict: 'Escalated', verdictColor: 'text-destructive' },
      { time: '11:00', channel: 'Secure Chat', icon: MessageSquare, participants: 'Torres, RN → Dr. Rivera', desc: 'Vital signs update', verdict: '✓ Compliant', verdictColor: 'text-success' },
      { time: '09:30', channel: 'EHR Sync', icon: Activity, participants: 'Epic', desc: 'ADT: Admitted to 4N-302', verdict: '✓ Logged', verdictColor: 'text-success' },
    ],
  },
  {
    id: '2', name: 'Liu, Robert', mrn: 'MRN-51023', age: 57, gender: 'M',
    location: '305A', attending: 'Dr. Patel', status: 'stable', department: 'Cardiology',
    allergies: ['None'],
    timeline: [
      { time: '13:10', channel: 'Secure Chat', icon: MessageSquare, participants: 'Dr. Patel → Care Team', desc: 'Echo results review — EF 45%', verdict: '✓ Compliant', verdictColor: 'text-success' },
      { time: '11:30', channel: 'AI-Generated', icon: Bot, participants: 'Copilot', desc: 'Discharge summary draft', verdict: '✓ AI Governed', verdictColor: 'text-success' },
      { time: '09:00', channel: 'EHR Sync', icon: Activity, participants: 'Epic', desc: 'Lab results: BNP 280 pg/mL', verdict: '✓ Logged', verdictColor: 'text-success' },
    ],
  },
  {
    id: '3', name: 'Rivera, Juan', mrn: 'MRN-33104', age: 50, gender: 'M',
    location: '218C', attending: 'Dr. Thornton', status: 'discharge-pending', department: 'Orthopedics',
    allergies: ['Aspirin'],
    timeline: [
      { time: '14:00', channel: 'Secure Chat', icon: MessageSquare, participants: 'Dr. Thornton → Case Mgmt', desc: 'Discharge planning coordination', verdict: '✓ Compliant', verdictColor: 'text-success' },
      { time: '12:15', channel: 'AI-Generated', icon: Bot, participants: 'Discharge Agent', desc: 'Discharge instructions generated', verdict: '✓ AI Governed', verdictColor: 'text-success' },
      { time: '10:45', channel: 'Voice Call', icon: Mic, participants: 'PT → Dr. Thornton', desc: 'Physical therapy clearance', verdict: '✓ Compliant', verdictColor: 'text-success' },
    ],
  },
  {
    id: '4', name: 'Williams, David', mrn: 'MRN-67234', age: 72, gender: 'M',
    location: '4N-308', attending: 'Dr. Chen', status: 'stable', department: 'Medicine',
    allergies: ['None'],
    timeline: [
      { time: '13:50', channel: 'Secure Chat', icon: MessageSquare, participants: 'Dr. Chen → Care Team', desc: 'Medication adjustment — Warfarin dosing', verdict: '✓ Compliant', verdictColor: 'text-success' },
      { time: '11:20', channel: 'Voice Call', icon: Mic, participants: 'Dr. Chen → Lab', desc: 'INR result follow-up', verdict: '✓ Compliant', verdictColor: 'text-success' },
      { time: '08:45', channel: 'EHR Sync', icon: Activity, participants: 'Epic', desc: 'Lab results: INR 2.4', verdict: '✓ Logged', verdictColor: 'text-success' },
    ],
  },
  {
    id: '5', name: 'Adams, Patricia', mrn: 'MRN-51098', age: 58, gender: 'F',
    location: 'ICU-2', attending: 'Dr. Rivera', status: 'critical', department: 'ICU',
    allergies: ['Morphine', 'Latex'],
    timeline: [
      { time: '14:18', channel: 'Secure Chat', icon: MessageSquare, participants: 'Dr. Rivera → ICU Team', desc: 'Ventilator weaning protocol update', verdict: '✓ Compliant', verdictColor: 'text-success' },
      { time: '13:30', channel: 'System', icon: AlertTriangle, participants: 'VOXTEN', desc: 'Critical vitals alert — BP 82/54', verdict: 'Escalated', verdictColor: 'text-destructive' },
      { time: '12:00', channel: 'AI-Generated', icon: Bot, participants: 'Clinical Agent', desc: 'ICU progress note generated', verdict: '✓ AI Governed', verdictColor: 'text-success' },
      { time: '10:15', channel: 'Voice Call', icon: Mic, participants: 'Dr. Rivera → Pulmonology', desc: 'Consult request — respiratory failure', verdict: '✓ Compliant', verdictColor: 'text-success' },
      { time: '08:00', channel: 'EHR Sync', icon: Activity, participants: 'Epic', desc: 'ADT: Transferred to ICU from 3E', verdict: '✓ Logged', verdictColor: 'text-success' },
    ],
  },
  {
    id: '6', name: 'Johnson, Michael', mrn: 'MRN-89451', age: 45, gender: 'M',
    location: '3E-215', attending: 'Dr. Park', status: 'stable', department: 'Medicine',
    allergies: ['None'],
    timeline: [
      { time: '13:00', channel: 'Secure Chat', icon: MessageSquare, participants: 'Dr. Park → Care Team', desc: 'Post-procedure assessment — stable', verdict: '✓ Compliant', verdictColor: 'text-success' },
      { time: '10:30', channel: 'AI-Generated', icon: Bot, participants: 'Copilot', desc: 'Procedure note summary', verdict: '✓ AI Governed', verdictColor: 'text-success' },
      { time: '09:15', channel: 'EHR Sync', icon: Activity, participants: 'Epic', desc: 'Procedure completed: Colonoscopy', verdict: '✓ Logged', verdictColor: 'text-success' },
    ],
  },
];

const statusBadge = {
  critical: 'bg-stat/10 text-stat border-stat/20',
  stable: 'bg-success/10 text-success border-success/20',
  'discharge-pending': 'bg-urgent/10 text-urgent border-urgent/20',
};

const statusLabel = {
  critical: 'Critical',
  stable: 'Stable',
  'discharge-pending': 'Discharge Pending',
};

export default function PatientCases() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Patient Cases</h1>
          <p className="text-sm text-muted-foreground mt-1">Active patient encounters with linked communications</p>
        </div>
        <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 w-72">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by MRN or name..." className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground" />
        </div>
      </div>

      <div className="grid gap-3">
        {patients.map((p) => (
          <Card
            key={p.id}
            className={cn(
              'clinical-shadow border-border transition-shadow cursor-pointer',
              p.status === 'critical' && 'border-l-4 border-l-stat',
              expandedId === p.id && 'ring-1 ring-primary/20',
            )}
          >
            <CardContent className="p-0">
              {/* Patient Row */}
              <button
                onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                className="w-full text-left px-5 py-4 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground text-sm">{p.name}</h3>
                      <Badge variant="outline" className="font-mono text-[10px]">{p.mrn}</Badge>
                      <Badge variant="outline" className={cn('text-[10px]', statusBadge[p.status])}>
                        {statusLabel[p.status]}
                      </Badge>
                      {p.status === 'critical' && <AlertTriangle className="w-3.5 h-3.5 text-stat" />}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>{p.age}/{p.gender}</span>
                      <span>{p.department} — {p.location}</span>
                      <span>Attending: {p.attending}</span>
                      {p.allergies[0] !== 'None' && (
                        <span className="text-destructive">Allergies: {p.allergies.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 mt-1">
                  <span className="text-[10px] text-muted-foreground">{p.timeline.length} events</span>
                  <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', expandedId === p.id && 'rotate-180')} />
                </div>
              </button>

              {/* Expanded Timeline */}
              {expandedId === p.id && (
                <div className="px-5 pb-4 border-t border-border pt-3">
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Communication Timeline — {p.name}
                  </h4>
                  <div className="space-y-0">
                    {p.timeline.map((evt, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/40 text-xs relative">
                        {/* Vertical connector line */}
                        {i < p.timeline.length - 1 && (
                          <div className="absolute left-[22px] top-[28px] w-px h-[calc(100%-12px)] bg-border" />
                        )}
                        <span className="font-mono text-muted-foreground w-10 shrink-0 tabular-nums">{evt.time}</span>
                        <evt.icon className={cn('w-3.5 h-3.5 shrink-0', evt.verdict === 'Escalated' ? 'text-destructive' : 'text-primary')} />
                        <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0 w-20 justify-center">{evt.channel}</Badge>
                        <span className="text-foreground font-medium shrink-0">{evt.participants}</span>
                        <span className="text-muted-foreground flex-1 truncate">{evt.desc}</span>
                        <span className={cn('text-[10px] font-medium shrink-0', evt.verdictColor)}>{evt.verdict}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
