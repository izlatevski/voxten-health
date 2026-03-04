import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  ChevronRight,
  User,
  Shield,
  FileText,
  Zap,
  ArrowRight,
  Timer,
  Bell,
} from 'lucide-react';

/* ── Types ── */
interface WorkflowNode {
  id: string;
  role: string;
  icon: React.ElementType;
  timeout: string;
  timeoutSeconds: number;
  action: string;
  state: 'completed' | 'active' | 'pending';
  auditNote?: string;
}

interface EscalationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  status: 'active' | 'idle' | 'resolved';
  nodes: WorkflowNode[];
  activeInstances: number;
  totalTriggered: number;
}

/* ── Demo Data ── */
const workflows: EscalationWorkflow[] = [
  {
    id: 'CRIT-LAB-001',
    name: 'Critical Lab Escalation',
    description: 'Automated escalation chain for critical laboratory results requiring immediate clinical response.',
    trigger: 'Critical lab result detected (K+ >6.0, Troponin >0.04, Lactate >4.0)',
    status: 'active',
    activeInstances: 1,
    totalTriggered: 47,
    nodes: [
      { id: 'n1', role: 'Lab Result Trigger', icon: Zap, timeout: '0 min', timeoutSeconds: 0, action: 'Event logged, policy evaluated (HIPAA)', state: 'completed', auditNote: 'VOX-2026-0048201 — HIPAA check passed' },
      { id: 'n2', role: 'Notify Attending Physician', icon: User, timeout: '5 min', timeoutSeconds: 300, action: 'Secure message + push notification', state: 'completed', auditNote: 'Dr. Chen acknowledged at 14:19:22' },
      { id: 'n3', role: 'Primary Nurse', icon: User, timeout: '5 min', timeoutSeconds: 300, action: 'Secure message + bedside alert', state: 'completed', auditNote: 'Nurse Torres confirmed treatment at 14:21:47' },
      { id: 'n4', role: 'Department Chief', icon: User, timeout: '10 min', timeoutSeconds: 600, action: 'Alert if no response from attending', state: 'pending' },
      { id: 'n5', role: 'CMO + Compliance', icon: Shield, timeout: '15 min', timeoutSeconds: 900, action: 'Executive escalation + compliance review', state: 'pending' },
    ],
  },
  {
    id: 'COMPLIANCE-001',
    name: 'Compliance Violation Escalation',
    description: 'Automated response chain when a policy violation is detected in any governed communication.',
    trigger: 'Policy engine returns BLOCK or FLAG verdict with severity >= High',
    status: 'active',
    activeInstances: 1,
    totalTriggered: 23,
    nodes: [
      { id: 'c1', role: 'Violation Detected', icon: Zap, timeout: '0 min', timeoutSeconds: 0, action: 'Event logged, communication held', state: 'completed', auditNote: 'PHI sent via unsecured channel — 2:15 PM' },
      { id: 'c2', role: 'CCO Notified', icon: Shield, timeout: 'Immediate', timeoutSeconds: 0, action: 'Patricia Okonkwo notified via secure alert', state: 'completed', auditNote: 'Patricia Okonkwo notified via secure alert — 2:15 PM' },
      { id: 'c3', role: 'Investigation Opened', icon: FileText, timeout: '30 min', timeoutSeconds: 1800, action: 'Case #VOX-INV-2026-0089 — Assigned to Compliance Team', state: 'active' },
      { id: 'c4', role: 'Remediation Plan', icon: User, timeout: '72 hours', timeoutSeconds: 259200, action: 'Due within 72 hours per policy', state: 'pending' },
      { id: 'c5', role: 'Resolution Verified', icon: CheckCircle, timeout: 'Manual', timeoutSeconds: 0, action: 'Requires CCO sign-off', state: 'pending' },
    ],
  },
  {
    id: 'OFFCHANNEL-001',
    name: 'Off-Channel Communication Detection',
    description: 'Detects and escalates business communications conducted on unapproved personal messaging channels.',
    trigger: 'Off-channel communication detected referencing patient data',
    status: 'active',
    activeInstances: 1,
    totalTriggered: 8,
    nodes: [
      { id: 'o1', role: 'Off-Channel Reference Detected', icon: Zap, timeout: '0 min', timeoutSeconds: 0, action: 'SMS reference to patient data detected in external message', state: 'completed', auditNote: 'Detected at 11:42 AM' },
      { id: 'o2', role: 'Employee Notified', icon: Bell, timeout: 'Immediate', timeoutSeconds: 0, action: 'Automated notification sent with policy reminder', state: 'completed', auditNote: 'Automated notification sent with policy reminder' },
      { id: 'o3', role: 'Manager Alerted', icon: User, timeout: '5 min', timeoutSeconds: 300, action: 'Department head notification — Awaiting acknowledgment', state: 'active' },
      { id: 'o4', role: 'Compliance Review', icon: Shield, timeout: '30 days', timeoutSeconds: 2592000, action: '30-day review window', state: 'pending' },
      { id: 'o5', role: 'Policy Acknowledgment Required', icon: FileText, timeout: 'Manual', timeoutSeconds: 0, action: 'Employee must re-certify communication policy', state: 'pending' },
    ],
  },
];

/* ── Active escalation with countdown ── */
interface ActiveEscalation {
  workflowId: string;
  workflowName: string;
  trigger: string;
  startedAt: string;
  currentNode: string;
  nextNode: string;
  countdown: number; // seconds remaining
  patient?: string;
}

const activeEscalations: ActiveEscalation[] = [
  {
    workflowId: 'CRIT-LAB-001',
    workflowName: 'Critical Lab Escalation',
    trigger: 'K+ 6.8 mEq/L — Patient Martinez, R.',
    startedAt: '14:18:03',
    currentNode: 'Primary Nurse',
    nextNode: 'Department Chief',
    countdown: 487,
    patient: 'Martinez, R. (MRN-0038291)',
  },
];

/* ── Countdown Timer ── */
function CountdownTimer({ initial }: { initial: number }) {
  const [remaining, setRemaining] = useState(initial);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [initial]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isUrgent = remaining < 120;

  return (
    <span className={cn('font-mono font-bold tabular-nums text-lg', isUrgent ? 'text-stat' : 'text-urgent')}>
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  );
}

/* ── Workflow Visualizer ── */
function WorkflowVisualizer({ workflow }: { workflow: EscalationWorkflow }) {
  return (
    <div className="flex items-start gap-1 overflow-x-auto py-4 px-2">
      {workflow.nodes.map((node, i) => {
        const isLast = i === workflow.nodes.length - 1;
        return (
          <div key={node.id} className="flex items-start flex-shrink-0">
            {/* Node */}
            <div className={cn(
              'w-44 rounded-lg border p-3 transition-all',
              node.state === 'completed' && 'border-success/30 bg-success/5',
              node.state === 'active' && 'border-urgent/30 bg-urgent/5 ring-2 ring-urgent/20',
              node.state === 'pending' && 'border-border bg-muted/30 opacity-60',
            )}>
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                  node.state === 'completed' && 'bg-success/20',
                  node.state === 'active' && 'bg-urgent/20',
                  node.state === 'pending' && 'bg-muted',
                )}>
                  {node.state === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : node.state === 'active' ? (
                    <Timer className="w-4 h-4 text-urgent animate-pulse-subtle" />
                  ) : (
                    <node.icon className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-foreground truncate">{node.role}</p>
                  <p className="text-[10px] text-muted-foreground">{node.timeout}</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{node.action}</p>
              {node.auditNote && (
                <p className="text-[9px] text-success font-mono mt-1.5 border-t border-border pt-1">{node.auditNote}</p>
              )}
            </div>
            {/* Arrow */}
            {!isLast && (
              <div className="flex items-center px-1 mt-8">
                <div className={cn('w-6 h-px', node.state === 'completed' ? 'bg-success' : 'bg-border')} />
                <ChevronRight className={cn('w-3 h-3 -ml-1', node.state === 'completed' ? 'text-success' : 'text-muted-foreground')} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Page ── */
export default function Escalations() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('CRIT-LAB-001');
  const activeWorkflow = workflows.find((w) => w.id === selectedWorkflow)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-urgent" />
          <h1 className="text-2xl font-semibold text-foreground">Escalation Workflows</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Automated escalation chains ensuring critical events are responded to within required timeframes.
        </p>
      </div>

      {/* Active Escalations */}
      {activeEscalations.length > 0 && (
        <Card className="clinical-shadow border-urgent/30 bg-urgent/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Timer className="w-4 h-4 text-urgent animate-pulse-subtle" />
              <h2 className="text-sm font-semibold text-foreground">Active Escalations</h2>
              <Badge variant="outline" className="bg-urgent/10 text-urgent border-urgent/20 text-[10px]">{activeEscalations.length} active</Badge>
            </div>
            {activeEscalations.map((esc) => (
              <div key={esc.workflowId} className="flex items-center justify-between bg-card rounded-lg p-4 border border-border">
                <div>
                  <p className="text-xs font-semibold text-foreground">{esc.trigger}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {esc.workflowName} · Started {esc.startedAt} · Current: <strong>{esc.currentNode}</strong>
                  </p>
                  {esc.patient && (
                    <Badge variant="outline" className="text-[9px] mt-1 font-mono">{esc.patient}</Badge>
                  )}
                </div>
                <div className="text-center flex-shrink-0 ml-4">
                  <p className="text-[10px] text-muted-foreground mb-1">Next escalation in</p>
                  <CountdownTimer initial={esc.countdown} />
                  <p className="text-[10px] text-muted-foreground mt-0.5">→ {esc.nextNode}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Workflow Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {workflows.map((w) => (
          <button
            key={w.id}
            onClick={() => setSelectedWorkflow(w.id)}
            className={cn(
              'text-left p-4 rounded-lg border transition-colors',
              selectedWorkflow === w.id ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:bg-muted/50',
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-foreground">{w.name}</span>
              <Badge variant="outline" className={cn('text-[9px] h-4 px-1.5',
                w.status === 'active' ? 'bg-urgent/10 text-urgent border-urgent/20' :
                w.status === 'resolved' ? 'bg-success/10 text-success border-success/20' :
                'bg-muted text-muted-foreground border-border'
              )}>
                {w.status === 'active' ? `${w.activeInstances} Active` : w.status === 'resolved' ? 'Resolved' : 'Idle'}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground line-clamp-2">{w.description}</p>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
              <span>{w.nodes.length} steps</span>
              <span>·</span>
              <span>{w.totalTriggered}× triggered</span>
            </div>
          </button>
        ))}
      </div>

      {/* Workflow Detail */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{activeWorkflow.name}</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{activeWorkflow.id}</p>
            </div>
            <Badge variant="outline" className={cn('text-[10px]',
              activeWorkflow.status === 'active' ? 'bg-urgent/10 text-urgent border-urgent/20' : 'bg-muted text-muted-foreground border-border'
            )}>
              {activeWorkflow.status === 'active' ? 'Active' : 'Idle'}
            </Badge>
          </div>
          <div className="mb-3">
            <p className="text-[11px] text-muted-foreground">
              <strong className="text-foreground">Trigger:</strong> {activeWorkflow.trigger}
            </p>
          </div>

          {/* Visual Workflow */}
          <WorkflowVisualizer workflow={activeWorkflow} />

          {/* Audit footer */}
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Triggered {activeWorkflow.totalTriggered} times · {activeWorkflow.nodes.length} escalation steps</span>
            <button className="text-primary font-medium hover:underline flex items-center gap-1">
              <FileText className="w-3 h-3" />
              View Audit Trail
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
