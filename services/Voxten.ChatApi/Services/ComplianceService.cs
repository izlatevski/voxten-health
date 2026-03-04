using System.Text.RegularExpressions;
using Voxten.ChatApi.Models;

namespace Voxten.ChatApi.Services;

public sealed class ComplianceService
{
    public ComplianceResult Evaluate(ProcessCommunicationRequest request)
    {
        var findings = new List<ComplianceFinding>();
        var processed = request.Message;

        if (Regex.IsMatch(request.Message, @"\b\d{3}-\d{2}-\d{4}\b"))
        {
            findings.Add(new ComplianceFinding
            {
                RuleId = "HIPAA-PHI-SSN-001",
                Framework = "HIPAA",
                Severity = ComplianceSeverity.Critical,
                Action = "block",
                Confidence = 0.99,
                Reason = "Detected Social Security Number pattern in outgoing message."
            });
        }

        if (Regex.IsMatch(request.Message, @"\bMRN[\s:-]*\d{4,}\b", RegexOptions.IgnoreCase))
        {
            processed = Regex.Replace(processed, @"\bMRN[\s:-]*\d{4,}\b", "MRN [REDACTED]", RegexOptions.IgnoreCase);
            findings.Add(new ComplianceFinding
            {
                RuleId = "HIPAA-PHI-MRN-002",
                Framework = "HIPAA",
                Severity = ComplianceSeverity.High,
                Action = "redact",
                Confidence = 0.97,
                Reason = "Detected Medical Record Number in outgoing message."
            });
        }

        if (Regex.IsMatch(request.Message, @"\b(?:DOB[:\s]*)?\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", RegexOptions.IgnoreCase))
        {
            processed = Regex.Replace(processed, @"\b(?:DOB[:\s]*)?\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", "DOB [REDACTED]", RegexOptions.IgnoreCase);
            findings.Add(new ComplianceFinding
            {
                RuleId = "HIPAA-PHI-DOB-003",
                Framework = "HIPAA",
                Severity = ComplianceSeverity.High,
                Action = "redact",
                Confidence = 0.93,
                Reason = "Detected date-of-birth information in outgoing message."
            });
        }

        if (Regex.IsMatch(request.Message, @"\b(whatsapp|telegram|signal|personal\s+email)\b", RegexOptions.IgnoreCase))
        {
            findings.Add(new ComplianceFinding
            {
                RuleId = "HITRUST-COMMS-OFFCHANNEL-001",
                Framework = "HITRUST",
                Severity = ComplianceSeverity.Critical,
                Action = "block",
                Confidence = 0.92,
                Reason = "Detected reference to off-channel communication in governed thread."
            });
        }

        if (Regex.IsMatch(request.Message, @"\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b"))
        {
            processed = Regex.Replace(processed, @"\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b", "[PHONE REDACTED]");
            findings.Add(new ComplianceFinding
            {
                RuleId = "HIPAA-PHI-PHONE-004",
                Framework = "HIPAA",
                Severity = ComplianceSeverity.Medium,
                Action = "redact",
                Confidence = 0.91,
                Reason = "Detected phone number in outgoing message."
            });
        }

        processed = Regex.Replace(processed, @"\s+", " ").Trim();

        var verdict = ComplianceVerdict.Allowed;
        if (findings.Any(f => string.Equals(f.Action, "block", StringComparison.OrdinalIgnoreCase)))
        {
            verdict = ComplianceVerdict.Blocked;
        }
        else if (findings.Any(f => string.Equals(f.Action, "redact", StringComparison.OrdinalIgnoreCase)))
        {
            verdict = ComplianceVerdict.Redacted;
        }

        return new ComplianceResult
        {
            Verdict = verdict,
            ProcessedMessage = processed,
            Findings = findings,
            PolicyPackVersion = "hipaa-hitrust-poc-v1",
            Evaluator = new EvaluatorInfo
            {
                DeterministicRules = true
            }
        };
    }
}
