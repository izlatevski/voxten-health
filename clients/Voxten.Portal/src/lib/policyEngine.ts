import type { RulePackResponse, RuleResponse } from '@/lib/complianceApi';
import type { AnalysisMethod, RuleAction, RuleSeverity } from '@/stores/policyEngineStore';

export interface PolicyPackView extends RulePackResponse {
  icon: string;
}

export interface PolicyRuleScope {
  channels: string[];
  directions: string[];
  senderRoles: string[];
}

export interface PolicyActionDefinition {
  actionType: string;
  channels?: string[];
}

export interface PolicyRuleView extends RuleResponse {
  analysisMethod: AnalysisMethod;
  action: RuleAction;
  severity: RuleSeverity;
  scope: PolicyRuleScope;
  logic: Record<string, unknown>;
  defaultActions: PolicyActionDefinition[];
  triggerSummary: string;
}

const sectorIcons: Record<string, string> = {
  Healthcare: '🛡',
  Finance: '💰',
  Government: '🏛',
  Technology: '💻',
  Legal: '⚖',
};

const evalTypeMap: Record<string, AnalysisMethod> = {
  Deterministic: 'pattern',
  '0': 'pattern',
  Ai: 'ai',
  '1': 'ai',
  Hybrid: 'both',
  '2': 'both',
};

const severityMap: Record<string, RuleSeverity> = {
  Critical: 'critical',
  '1': 'critical',
  High: 'high',
  '2': 'high',
  Medium: 'medium',
  '3': 'medium',
  Low: 'low',
  '4': 'low',
};

function safeObjectParse(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function safeArrayParse(value: string): PolicyActionDefinition[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed as PolicyActionDefinition[] : [];
  } catch {
    return [];
  }
}

function parseAction(defaultActionsJson: string): RuleAction {
  const actions = safeArrayParse(defaultActionsJson);
  const actionType = actions[0]?.actionType?.toLowerCase() ?? '';
  if (actionType === 'block' || actionType === 'blocktransmission') return 'block';
  if (actionType === 'flag' || actionType === 'flagforreview' || actionType === 'quarantineforreview' || actionType === 'alert') return 'flag';
  if (actionType === 'redact') return 'redact';
  if (actionType === 'escalate') return 'escalate';
  return 'log';
}

function parseScope(scopeJson: string): PolicyRuleScope {
  const parsed = safeObjectParse(scopeJson);

  const channels = Array.isArray(parsed.channels) ? parsed.channels.filter((v): v is string => typeof v === 'string') : [];
  const directionsSource = Array.isArray(parsed.directions)
    ? parsed.directions
    : typeof parsed.direction === 'string'
      ? [parsed.direction]
      : [];
  const directions = directionsSource.filter((v): v is string => typeof v === 'string');
  const senderRoles = Array.isArray(parsed.senderRoles) ? parsed.senderRoles.filter((v): v is string => typeof v === 'string') : [];

  return {
    channels,
    directions,
    senderRoles,
  };
}

function deriveTriggerSummary(rule: RuleResponse, logic: Record<string, unknown>): string {
  if (typeof logic.trigger === 'string' && logic.trigger.trim()) {
    return logic.trigger;
  }

  if (typeof logic.patternLibraryId === 'string' && logic.patternLibraryId.trim()) {
    return `Pattern library: ${logic.patternLibraryId}`;
  }

  if (typeof logic.systemPrompt === 'string' && logic.systemPrompt.trim()) {
    return 'AI prompt-defined rule';
  }

  return rule.description;
}

export function toPolicyPackView(pack: RulePackResponse): PolicyPackView {
  return {
    ...pack,
    icon: sectorIcons[pack.sector] ?? '📋',
  };
}

export function toPolicyRuleView(rule: RuleResponse): PolicyRuleView {
  const logic = safeObjectParse(rule.logicJson);

  return {
    ...rule,
    analysisMethod: evalTypeMap[String(rule.evalType)] ?? 'pattern',
    action: parseAction(rule.defaultActionsJson),
    severity: severityMap[String(rule.defaultSeverity)] ?? 'medium',
    scope: parseScope(rule.scopeJson),
    logic,
    defaultActions: safeArrayParse(rule.defaultActionsJson),
    triggerSummary: deriveTriggerSummary(rule, logic),
  };
}

export function formatDateTime(value?: string | null): string {
  if (!value) return 'Not set';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatList(values: string[], fallback = 'All'): string {
  return values.length > 0 ? values.join(', ') : fallback;
}
