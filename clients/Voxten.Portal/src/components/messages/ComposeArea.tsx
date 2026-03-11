import { useState } from "react";
import { Shield, Lock, Paperclip, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ComplianceVerdict } from "@/lib/chatApi";

export type ComposeOutcome = {
  verdict: ComplianceVerdict;
  auditId: string;
  reason?: string;
};

export function ComposeArea({
  isSending,
  onSend,
  lastOutcome,
}: {
  isSending: boolean;
  onSend: (input: { text: string; channel: string }) => Promise<void>;
  lastOutcome: ComposeOutcome | null;
}) {
  const [text, setText] = useState("");
  const [channel, setChannel] = useState("secure");

  const hasPHI = /\b(mrn|ssn|patient|diagnosis|potassium)\b/i.test(text);
  const hasSUD = /substance use|alcohol use|opioid|SUD/i.test(text);
  const status = hasSUD ? "violation" : hasPHI ? "warning" : "safe";

  return (
    <div className="border-t border-border p-4 bg-card">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-1.5">
          <Shield className={cn("w-3.5 h-3.5", status === "safe" ? "text-success" : status === "warning" ? "text-urgent" : "text-stat")} />
          <span className={cn("text-[11px] font-medium", status === "safe" ? "text-success" : status === "warning" ? "text-urgent" : "text-stat")}>
            {status === "safe" ? "Compliant" : status === "warning" ? "Potential PHI detected" : "Policy violation detected"}
          </span>
        </div>

        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="h-6 text-[10px] w-[130px] ml-auto"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="secure" className="text-xs">Secure Message</SelectItem>
            <SelectItem value="sms" className="text-xs">SMS</SelectItem>
            <SelectItem value="email" className="text-xs">Email</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">AES-256 E2E</span>
        </div>
      </div>
      {lastOutcome && (
        <div
          className={cn(
            "mb-2 px-3 py-1.5 rounded border text-[11px]",
            lastOutcome.verdict === "passed"
              ? "bg-success/10 border-success/20 text-success"
              : lastOutcome.verdict === "flagged"
                ? "bg-urgent/10 border-urgent/20 text-urgent"
                : lastOutcome.verdict === "redacted"
                  ? "bg-urgent/10 border-urgent/20 text-urgent"
                  : "bg-stat/10 border-stat/20 text-stat",
          )}
        >
          {lastOutcome.verdict === "passed" && `✓ Sent — audit ${lastOutcome.auditId}`}
          {lastOutcome.verdict === "flagged" && `⚠ Sent (flagged) — audit ${lastOutcome.auditId}`}
          {lastOutcome.verdict === "redacted" && `⚠ Sent with redaction — audit ${lastOutcome.auditId}`}
          {lastOutcome.verdict === "blocked" && `⛔ Blocked — audit ${lastOutcome.auditId}${lastOutcome.reason ? ` (${lastOutcome.reason})` : ""}`}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-muted rounded-lg px-4 py-2.5">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a governed message..."
            className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground"
            onKeyDown={async (e) => {
              if (e.key !== "Enter" || !text.trim() || isSending) return;
              e.preventDefault();
              await onSend({ text, channel });
              setText("");
            }}
          />
        </div>
        <button className="p-2.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
          <Paperclip className="w-5 h-5" />
        </button>
        <button
          className="p-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!text.trim() || isSending}
          onClick={async () => {
            if (!text.trim() || isSending) return;
            await onSend({ text, channel });
            setText("");
          }}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
