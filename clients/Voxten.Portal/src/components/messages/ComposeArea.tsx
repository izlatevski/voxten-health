import { useState } from "react";
import { Shield, Lock, Send } from "lucide-react";
import { cn } from "@/lib/utils";
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
  variant = "governed",
}: {
  isSending: boolean;
  onSend: (input: { text: string; channel: string }) => Promise<void>;
  lastOutcome: ComposeOutcome | null;
  variant?: "governed" | "chat";
}) {
  const [text, setText] = useState("");

  const hasPHI = [
    /(?<!\d)\d{3}(?:[-\s]?\d{2}[-\s]?\d{4})(?!\d)/,
    /\bMRN[\-:\s#]*\d{4,12}\b/i,
    /\b(?:DOB|date of birth|born)[:\s]+\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/i,
    /(?<!\d)(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}(?!\d)/,
    /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/,
    /\b(?:member\s*(?:ID|#)|policy\s*(?:number|#)|ins(?:urance)?\s*ID)[:\s]*[A-Z0-9][A-Z0-9\-]{5,19}\b/i,
  ].some((pattern) => pattern.test(text));
  const hasSUD = /substance use|alcohol use|opioid|SUD/i.test(text);
  const status = hasSUD ? "violation" : hasPHI ? "warning" : "safe";
  const isChatVariant = variant === "chat";

  return (
    <div className={cn("border-t border-border bg-card", isChatVariant ? "p-3" : "p-4")}>
      {!isChatVariant && (
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1.5">
            <Shield className={cn("w-3.5 h-3.5", status === "safe" ? "text-success" : status === "warning" ? "text-urgent" : "text-stat")} />
            <span className={cn("text-[11px] font-medium", status === "safe" ? "text-success" : status === "warning" ? "text-urgent" : "text-stat")}>
              {status === "safe" ? "Compliant" : status === "warning" ? "Potential PHI detected" : "Policy violation detected"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="ml-auto text-[10px] text-muted-foreground">Secure message</span>
            <Lock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">AES-256 E2E</span>
          </div>
        </div>
      )}
      {isChatVariant && (
        <div className="mb-2 flex items-center gap-2 px-1">
          <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Secure message
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Shield className={cn("w-3.5 h-3.5", status === "safe" ? "text-success" : status === "warning" ? "text-urgent" : "text-stat")} />
            <span className={cn("text-[11px]", status === "safe" ? "text-muted-foreground" : status === "warning" ? "text-urgent" : "text-stat")}>
              {status === "safe" ? "Secure channel" : status === "warning" ? "Potential PHI detected" : "Policy violation detected"}
            </span>
          </div>
        </div>
      )}
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
        <div className={cn("flex-1 flex items-center gap-2 bg-muted rounded-lg", isChatVariant ? "px-3 py-2" : "px-4 py-2.5")}>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isChatVariant ? "Type a message..." : "Type a governed message..."}
            className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground"
            onKeyDown={async (e) => {
              if (e.key !== "Enter" || !text.trim() || isSending) return;
              e.preventDefault();
              await onSend({ text, channel: "secure" });
              setText("");
            }}
          />
        </div>
        <button
          className="p-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!text.trim() || isSending}
          onClick={async () => {
            if (!text.trim() || isSending) return;
            await onSend({ text, channel: "secure" });
            setText("");
          }}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
