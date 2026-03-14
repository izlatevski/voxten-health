import { Activity, AlertTriangle, Bot, Lock, Shield, ShieldAlert, ShieldCheck, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ThreadUiMessage } from "@/hooks/useThreadMessages";

export function GovernedMessage({ msg }: { msg: ThreadUiMessage }) {
  const isSystem = msg.type === "system";
  const g = msg.governance;

  if (isSystem) {
    return (
      <div className="flex gap-3 py-2">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <Activity className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="bg-muted rounded-lg px-4 py-3">
            <p className="text-sm text-muted-foreground">{msg.content}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[10px] text-muted-foreground font-mono">{msg.timestamp}</span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-muted border-border text-muted-foreground">VOXTEN System</Badge>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === "blocked") {
    return (
      <div className="flex gap-3 py-2">
        <div className="w-8 h-8 rounded-full bg-stat/10 flex items-center justify-center flex-shrink-0">
          <ShieldAlert className="w-4 h-4 text-stat" />
        </div>
        <div className="flex-1">
          <div className="bg-stat/5 border border-stat/20 rounded-lg px-4 py-3">
            <p className="text-sm text-stat font-medium">{msg.content}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[10px] text-muted-foreground font-mono">{msg.timestamp}</span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-stat/10 text-stat border-stat/20">BLOCKED</Badge>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = (content: string) => {
    const parts = content.split(/(\[REDACTED])/g);
    return parts.map((part, i) =>
      part === "[REDACTED]" ? (
        <span key={i} className="bg-stat/15 text-stat font-semibold px-1 rounded-sm border border-stat/20">[REDACTED]</span>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  };

  return (
    <div className={cn("flex gap-3 py-2", msg.priority === "stat" && "border-l-2 border-stat pl-3")}>
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", msg.isAI ? "bg-ehr-part2/10" : "bg-primary/10")}>
        {msg.isAI ? <Bot className="w-4 h-4 text-ehr-part2" /> : <User className="w-4 h-4 text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{msg.sender}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{msg.role}</Badge>
          {msg.isAI && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-ehr-part2/10 text-ehr-part2 border-ehr-part2/20">AI-Generated</Badge>}
          {msg.priority === "stat" && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-stat/10 text-stat border-stat/20 font-bold">STAT</Badge>}
          <span className="text-[10px] text-muted-foreground ml-auto font-mono">{msg.timestamp}</span>
        </div>
        <p className="text-sm text-foreground mt-1.5 leading-relaxed">{renderContent(msg.content)}</p>

        {msg.isAI && g.aiGoverned && (
          <div className={cn("mt-2 px-3 py-1.5 rounded text-[11px] border", g.aiGoverned.startsWith("⚠") ? "bg-urgent/5 border-urgent/20 text-urgent" : "bg-ehr-part2/5 border-ehr-part2/20 text-ehr-part2")}>
            <Bot className="w-3 h-3 inline mr-1" />
            AI Content Governed: {g.aiGoverned}
          </div>
        )}
        {g.compliance === "redacted" && g.redactedEntities && (
          <div className="mt-2 px-3 py-2 rounded border border-urgent/20 bg-urgent/5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-urgent">
              <AlertTriangle className="w-3.5 h-3.5" />
              ⚠ REDACTED — {g.redactedEntities.length} entities detected and redacted before delivery
            </div>
            {g.redactedEntities.map((entity, i) => (
              <div key={i} className="text-[10px] text-muted-foreground pl-5">
                • {entity.type}: <span className="text-foreground font-medium">{entity.rule}</span>
              </div>
            ))}
            <div className="text-[10px] text-muted-foreground pl-5">
              • Original preserved in audit trail: <span className="font-mono text-foreground">{g.auditId}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground flex-wrap">
          <span className={cn("flex items-center gap-1",
            g.compliance === "passed" ? "text-success" :
            g.compliance === "redacted" ? "text-urgent" :
            g.compliance === "flagged" ? "text-urgent" : "text-stat",
          )}>
            <ShieldCheck className="w-3 h-3" />
            {g.compliance === "passed" ? "✓ Compliant" : g.compliance === "redacted" ? "⚠ Redacted" : g.compliance === "flagged" ? "⚠ Flagged" : "✖ Blocked"}
          </span>
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            {g.encryption}
          </span>
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {g.syncStatus}
          </span>
          {g.compliance === "redacted" && (
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Audit Hash: SHA-256
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
