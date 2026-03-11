import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Loader2, Play, Save } from 'lucide-react';
import {
  activateRule,
  createRule,
  listPatternLibraries,
  updateRule,
  type EvalType,
  type PatternLibraryResponse,
  type RuleCategory,
  type Severity,
  type UpdateRuleRequest,
} from '@/lib/complianceApi';
import type { PolicyPackView, PolicyRuleView } from '@/lib/policyEngine';
import { usePolicyEngineStore } from '@/stores/policyEngineStore';

interface Props {
  packs: PolicyPackView[];
  rules?: PolicyRuleView[];
  onCreated?: () => void;
  mode?: 'create' | 'edit';
}

type FormMethod = 'pattern' | 'ai' | 'both';
type MatchMode = 'any' | 'all';

interface FormValues {
  name: string;
  logicalId: string;
  version: string;
  packId: string;
  description: string;
  effectiveDate: string;
  channels: string[];
  directions: string[];
  senderRoles: string;
  method: FormMethod;
  trigger: string;
  patternLibraryId: string;
  matchMode: MatchMode;
  systemPrompt: string;
  userPromptTemplate: string;
  threshold: number;
  model: string;
  action: string;
  actionChannels: string[];
  severity: Severity;
  category: RuleCategory;
  exemptionsJson: string;
  changelogJson: string;
}

function toLogicalId(name: string): string {
  return (
    name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50) || 'RULE-001'
  );
}

function toDateTimeLocalValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function parseCommaSeparated(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isJsonArray(value: string): boolean {
  try {
    return Array.isArray(JSON.parse(value));
  } catch {
    return false;
  }
}

function safeObjectParse(value?: string): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function safeActionParse(value?: string): Array<{ actionType?: string; channels?: string[] }> {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as Array<{ actionType?: string; channels?: string[] }>) : [];
  } catch {
    return [];
  }
}

const evalTypeMap: Record<FormMethod, EvalType> = {
  pattern: 'Deterministic',
  ai: 'Ai',
  both: 'Hybrid',
};

const evalTypeReverseMap: Record<EvalType, FormMethod> = {
  Deterministic: 'pattern',
  Ai: 'ai',
  Hybrid: 'both',
};

const actionTypeMap: Record<string, string> = {
  block: 'Block',
  flag: 'Alert',
  redact: 'Redact',
  log: 'Log',
  escalate: 'NotifyPrivacyOfficer',
};

const actionTypeReverseMap: Record<string, string> = {
  Block: 'block',
  Alert: 'flag',
  QuarantineForReview: 'flag',
  Redact: 'redact',
  Log: 'log',
  NotifyPrivacyOfficer: 'escalate',
};

const categoryOptions: RuleCategory[] = [
  'PhiDataPrivacy',
  'ConsentAuthorization',
  'IntegrityAudit',
  'ClinicalCommunication',
  'RetentionAccess',
  'MarketingPhiSale',
  'PatientRights',
  'SecurityBaGovernance',
];

const channelOptions = [
  { value: 'Sms', label: 'SMS' },
  { value: 'Email', label: 'Email' },
  { value: 'SecureChat', label: 'Secure Messaging' },
  { value: 'Voice', label: 'Voice' },
  { value: 'Ehr', label: 'EHR' },
] as const;
const directionOptions = [
  { value: 'Outbound', label: 'Outbound' },
  { value: 'Inbound', label: 'Inbound' },
  { value: 'Internal', label: 'Internal' },
] as const;
const modelOptions = ['gpt-4o', 'gpt-4.1', 'gpt-4o-mini'];

function getInitialValues(mode: 'create' | 'edit', selectedPackId: string | null, packs: PolicyPackView[], rule?: PolicyRuleView): FormValues {
  if (!rule || mode === 'create') {
    return {
      name: '',
      logicalId: '',
      version: '1.0.0',
      packId: selectedPackId ?? packs[0]?.id ?? '',
      description: '',
      effectiveDate: toDateTimeLocalValue(new Date()),
      channels: ['Sms'],
      directions: ['Outbound'],
      senderRoles: '',
      method: 'both',
      trigger: '',
      patternLibraryId: 'default',
      matchMode: 'any',
      systemPrompt: '',
      userPromptTemplate: '',
      threshold: 0.85,
      model: 'gpt-4o',
      action: 'block',
      actionChannels: [],
      severity: 'Critical',
      category: 'PhiDataPrivacy',
      exemptionsJson: '',
      changelogJson: '',
    };
  }

  const scope = safeObjectParse(rule.scopeJson);
  const logic = safeObjectParse(rule.logicJson);
  const actions = safeActionParse(rule.defaultActionsJson);
  const primaryAction = actions[0]?.actionType ?? '';
  const parsedChannels = Array.isArray(scope.channels) ? scope.channels.filter((item): item is string => typeof item === 'string') : [];
  const parsedDirections = Array.isArray(scope.directions)
    ? scope.directions.filter((item): item is string => typeof item === 'string')
    : [];
  const parsedSenderRoles = Array.isArray(scope.senderRoles) ? scope.senderRoles.filter((item): item is string => typeof item === 'string') : [];

  return {
    name: rule.name,
    logicalId: rule.logicalId,
    version: rule.version,
    packId: rule.packId,
    description: rule.description,
    effectiveDate: toDateTimeLocalValue(new Date(rule.effectiveDate)),
    channels: parsedChannels,
    directions: parsedDirections,
    senderRoles: parsedSenderRoles.join(', '),
    method: evalTypeReverseMap[rule.evalType],
    trigger: typeof logic.trigger === 'string' ? logic.trigger : rule.triggerSummary,
    patternLibraryId: typeof logic.patternLibraryId === 'string' ? logic.patternLibraryId : '',
    matchMode: logic.matchMode === 'all' ? 'all' : 'any',
    systemPrompt: typeof logic.systemPrompt === 'string' ? logic.systemPrompt : '',
    userPromptTemplate: typeof logic.userPromptTemplate === 'string' ? logic.userPromptTemplate : '',
    threshold: typeof logic.confidenceFloor === 'number' ? logic.confidenceFloor : 0.85,
    model: typeof logic.model === 'string' ? logic.model : 'gpt-4o',
    action: actionTypeReverseMap[primaryAction] ?? 'log',
    actionChannels: Array.isArray(actions[0]?.channels) ? actions[0].channels.filter((item): item is string => typeof item === 'string') : [],
    severity: rule.defaultSeverity,
    category: rule.category,
    exemptionsJson: rule.exemptionsJson ?? '',
    changelogJson: rule.changelogJson ?? '',
  };
}

export function RuleCreateForm({ packs, rules = [], onCreated, mode = 'create' }: Props) {
  const { setDetailMode, selectedPackId, selectedRuleId } = usePolicyEngineStore();
  const selectedRule = useMemo(
    () => (mode === 'edit' ? rules.find((item) => String(item.id) === selectedRuleId) : undefined),
    [mode, rules, selectedRuleId],
  );

  const [logicalIdTouched, setLogicalIdTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patternLibraries, setPatternLibraries] = useState<PatternLibraryResponse[]>([]);
  const [form, setForm] = useState<FormValues>(() => getInitialValues(mode, selectedPackId, packs, selectedRule));

  useEffect(() => {
    setForm(getInitialValues(mode, selectedPackId, packs, selectedRule));
    setLogicalIdTouched(mode === 'edit');
    setError(null);
  }, [mode, packs, selectedPackId, selectedRuleId, selectedRule]);

  useEffect(() => {
    if (mode === 'create' && !logicalIdTouched) {
      setForm((current) => ({ ...current, logicalId: toLogicalId(current.name) }));
    }
  }, [form.name, logicalIdTouched, mode]);

  useEffect(() => {
    let cancelled = false;

    listPatternLibraries()
      .then((items) => {
        if (!cancelled) {
          setPatternLibraries(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPatternLibraries([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleMultiValue(current: string[], value: string, setValue: (next: string[]) => void) {
    setValue(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function validateForm(): string | null {
    if (mode === 'edit' && !selectedRule) return 'No rule selected for editing.';
    if (mode === 'edit' && selectedRule?.isActive) return 'Active rules cannot be edited. Create a new version instead.';
    if (!form.name.trim()) return 'Rule name is required.';
    if (!form.logicalId.trim()) return 'Logical ID is required.';
    if (form.logicalId.trim().length > 50) return 'Logical ID must be 50 characters or fewer.';
    if (!/^[A-Za-z0-9][A-Za-z0-9.-]*$/.test(form.version.trim())) return 'Version must look like a semantic version, for example 1.0.0.';
    if (!form.packId) return 'Rule pack is required.';
    if (!form.description.trim()) return 'Description is required.';
    if (form.channels.length === 0) return 'Select at least one channel.';
    if (form.directions.length === 0) return 'Select at least one direction.';
    if (!form.effectiveDate || Number.isNaN(new Date(form.effectiveDate).getTime())) return 'Effective date is invalid.';
    if ((form.method === 'pattern' || form.method === 'both') && !form.patternLibraryId.trim()) return 'Pattern library ID is required for deterministic or hybrid rules.';
    if ((form.method === 'ai' || form.method === 'both') && !form.systemPrompt.trim()) return 'System prompt is required for AI or hybrid rules.';
    if ((form.method === 'ai' || form.method === 'both') && !form.userPromptTemplate.trim()) return 'User prompt template is required for AI or hybrid rules.';
    if (form.exemptionsJson.trim() && !isJsonArray(form.exemptionsJson)) return 'Exemptions JSON must be a valid JSON array.';
    if (mode === 'edit' && form.changelogJson.trim() && !isJsonArray(form.changelogJson)) return 'Changelog JSON must be a valid JSON array.';
    return null;
  }

  async function handleSave(andActivate: boolean) {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const scopeJson = JSON.stringify({
        channels: form.channels,
        directions: form.directions,
        senderRoles: parseCommaSeparated(form.senderRoles),
      });

      const logicJson = JSON.stringify({
        ...(form.method === 'pattern' || form.method === 'both'
          ? {
              patternLibraryId: form.patternLibraryId.trim(),
              matchMode: form.matchMode,
              confidenceFloor: form.threshold,
            }
          : {}),
        ...(form.method === 'ai' || form.method === 'both'
          ? {
              systemPrompt: form.systemPrompt.trim(),
              userPromptTemplate: form.userPromptTemplate.trim(),
              confidenceFloor: form.threshold,
              model: form.model,
            }
          : {}),
      });

      const defaultActionsJson = JSON.stringify([
        {
          actionType: actionTypeMap[form.action] ?? 'Log',
          ...(form.actionChannels.length > 0 ? { channels: form.actionChannels } : {}),
        },
      ]);

      if (mode === 'edit' && selectedRule) {
        const updateRequest: UpdateRuleRequest = {
          version: form.version.trim(),
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category,
          evalType: evalTypeMap[form.method],
          defaultSeverity: form.severity,
          effectiveDate: new Date(form.effectiveDate).toISOString(),
          scopeJson,
          logicJson,
          defaultActionsJson,
          exemptionsJson: form.exemptionsJson.trim() || undefined,
          changelogJson: form.changelogJson.trim() || undefined,
        };

        await updateRule(String(selectedRule.id), updateRequest);
      } else {
        const created = await createRule({
          logicalId: form.logicalId.trim(),
          version: form.version.trim(),
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category,
          evalType: evalTypeMap[form.method],
          defaultSeverity: form.severity,
          packId: form.packId,
          effectiveDate: new Date(form.effectiveDate).toISOString(),
          scopeJson,
          logicJson,
          defaultActionsJson,
          exemptionsJson: form.exemptionsJson.trim() || undefined,
        });

        if (andActivate) {
          await activateRule(created.id);
        }
      }

      onCreated?.();
      setDetailMode(isEditing ? 'rule-detail' : 'pack-overview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  }

  const isEditing = mode === 'edit';
  const title = isEditing ? 'Edit Rule' : 'Create Rule';
  const subtitle = isEditing ? 'Update an existing draft or inactive rule.' : 'Author a backend-native rule definition.';

  return (
    <Card className="clinical-shadow border-border h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <button className="text-muted-foreground hover:text-foreground" onClick={() => setDetailMode('rule-detail')}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
        <div>
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Identity</h3>
          <Field label="Rule Name">
            <Input value={form.name} onChange={(e) => setField('name', e.target.value)} className="h-8 text-[11px]" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Logical ID">
              <Input
                value={form.logicalId}
                onChange={(e) => {
                  setLogicalIdTouched(true);
                  setField('logicalId', e.target.value.toUpperCase());
                }}
                className="h-8 text-[11px] font-mono"
                disabled={isEditing}
              />
            </Field>
            <Field label="Version">
              <Input value={form.version} onChange={(e) => setField('version', e.target.value)} className="h-8 text-[11px] font-mono" placeholder="1.0.0" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Rule Pack">
              <Select value={form.packId} onValueChange={(value) => setField('packId', value)} disabled={isEditing}>
                <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {packs.map((pack) => (
                    <SelectItem key={pack.id} value={pack.id} className="text-[11px]">
                      {pack.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Effective Date">
              <Input type="datetime-local" value={form.effectiveDate} onChange={(e) => setField('effectiveDate', e.target.value)} className="h-8 text-[11px]" />
            </Field>
          </div>
          <Field label="Category">
            <Select value={form.category} onValueChange={(value) => setField('category', value as RuleCategory)}>
              <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option} value={option} className="text-[11px]">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => setField('description', e.target.value)} className="text-[11px] min-h-[72px]" />
          </Field>
        </div>

        <div className="border-t border-border pt-3">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Scope JSON</h3>
          <Field label="Channels">
            <div className="flex flex-wrap gap-3">
              {channelOptions.map((channel) => (
                <label key={channel.value} className="flex items-center gap-1.5 text-[11px]">
                  <Checkbox
                    checked={form.channels.includes(channel.value)}
                    onCheckedChange={() => toggleMultiValue(form.channels, channel.value, (next) => setField('channels', next))}
                    className="w-3.5 h-3.5"
                  />
                  {channel.label}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Directions">
            <div className="flex gap-3 flex-wrap">
              {directionOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-1.5 text-[11px]">
                  <Checkbox
                    checked={form.directions.includes(option.value)}
                    onCheckedChange={() => toggleMultiValue(form.directions, option.value, (next) => setField('directions', next))}
                    className="w-3.5 h-3.5"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Sender Roles (comma-separated)">
            <Input value={form.senderRoles} onChange={(e) => setField('senderRoles', e.target.value)} className="h-8 text-[11px]" placeholder="Physician, Nurse, Compliance" />
          </Field>
        </div>

        <div className="border-t border-border pt-3">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Logic JSON</h3>
          <Field label="Trigger Summary">
            <Textarea
              value={form.trigger}
              onChange={(e) => setField('trigger', e.target.value)}
              className="text-[11px] min-h-[60px]"
              placeholder="What condition or pattern should cause this rule to evaluate as a match?"
            />
          </Field>
          <Field label="Evaluation Method">
            <div className="flex gap-3">
              {[
                { value: 'pattern', label: 'Deterministic' },
                { value: 'ai', label: 'AI' },
                { value: 'both', label: 'Hybrid' },
              ].map((item) => (
                <label key={item.value} className="flex items-center gap-1.5 text-[11px]">
                  <input type="radio" name="method" checked={form.method === item.value} onChange={() => setField('method', item.value as FormMethod)} className="w-3 h-3" />
                  {item.label}
                </label>
              ))}
            </div>
          </Field>

          {(form.method === 'pattern' || form.method === 'both') ? (
            <>
              <Field label="Pattern Library ID">
                {patternLibraries.length > 0 ? (
                  <Select value={form.patternLibraryId} onValueChange={(value) => setField('patternLibraryId', value)}>
                    <SelectTrigger className="h-8 text-[11px] font-mono"><SelectValue placeholder="Select pattern library" /></SelectTrigger>
                    <SelectContent>
                      {patternLibraries.map((library) => (
                        <SelectItem key={library.id} value={library.id} className="text-[11px]">
                          {library.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={form.patternLibraryId} onChange={(e) => setField('patternLibraryId', e.target.value)} className="h-8 text-[11px] font-mono" />
                )}
                {patternLibraries.length > 0 ? (
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {patternLibraries.find((library) => library.id === form.patternLibraryId)?.description
                      ?? 'Select a reusable pattern library.'}
                  </p>
                ) : null}
              </Field>
              <Field label="Pattern Match Mode">
                <Select value={form.matchMode} onValueChange={(value) => setField('matchMode', value as MatchMode)}>
                  <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any" className="text-[11px]">Any match</SelectItem>
                    <SelectItem value="all" className="text-[11px]">All conditions</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </>
          ) : null}

          {(form.method === 'ai' || form.method === 'both') ? (
            <>
              <Field label="System Prompt">
                <Textarea value={form.systemPrompt} onChange={(e) => setField('systemPrompt', e.target.value)} className="text-[11px] min-h-[80px]" />
              </Field>
              <Field label="User Prompt Template">
                <Textarea value={form.userPromptTemplate} onChange={(e) => setField('userPromptTemplate', e.target.value)} className="text-[11px] min-h-[80px]" />
              </Field>
              <Field label="Model">
                <Select value={form.model} onValueChange={(value) => setField('model', value)}>
                  <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {modelOptions.map((option) => (
                      <SelectItem key={option} value={option} className="text-[11px]">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </>
          ) : null}

          <Field label={`Confidence Floor: ${form.threshold.toFixed(2)}`}>
            <Slider value={[form.threshold]} onValueChange={(value) => setField('threshold', value[0] ?? form.threshold)} min={0.5} max={1} step={0.01} className="py-1" />
            <p className="text-[9px] text-muted-foreground mt-0.5">Stored as `logicJson.confidenceFloor`.</p>
          </Field>
        </div>

        <div className="border-t border-border pt-3">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Default Actions JSON</h3>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Primary Action">
              <Select value={form.action} onValueChange={(value) => setField('action', value)}>
                <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="block" className="text-[11px]">Block Transmission</SelectItem>
                  <SelectItem value="flag" className="text-[11px]">Flag for Review</SelectItem>
                  <SelectItem value="redact" className="text-[11px]">Redact</SelectItem>
                  <SelectItem value="log" className="text-[11px]">Log</SelectItem>
                  <SelectItem value="escalate" className="text-[11px]">Escalate</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Default Severity">
              <Select value={form.severity} onValueChange={(value) => setField('severity', value as Severity)}>
                <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low" className="text-[11px]">Low</SelectItem>
                  <SelectItem value="Medium" className="text-[11px]">Medium</SelectItem>
                  <SelectItem value="High" className="text-[11px]">High</SelectItem>
                  <SelectItem value="Critical" className="text-[11px]">Critical</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Action Channels (optional)">
            <div className="flex flex-wrap gap-3">
              {channelOptions.map((channel) => (
                <label key={channel.value} className="flex items-center gap-1.5 text-[11px]">
                  <Checkbox
                    checked={form.actionChannels.includes(channel.value)}
                    onCheckedChange={() => toggleMultiValue(form.actionChannels, channel.value, (next) => setField('actionChannels', next))}
                    className="w-3.5 h-3.5"
                  />
                  {channel.label}
                </label>
              ))}
            </div>
          </Field>
        </div>

        <div className="border-t border-border pt-3">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Optional JSON</h3>
          <Field label="Exemptions Array">
            <Textarea
              value={form.exemptionsJson}
              onChange={(e) => setField('exemptionsJson', e.target.value)}
              className="text-[11px] min-h-[90px] font-mono"
              placeholder='[{"type":"Emergency","effect":"AllowWithLog","condition":{}}]'
            />
          </Field>
          {isEditing ? (
            <Field label="Changelog Array">
              <Textarea
                value={form.changelogJson}
                onChange={(e) => setField('changelogJson', e.target.value)}
                className="text-[11px] min-h-[90px] font-mono"
                placeholder='[{"version":"1.1.0","date":"2026-03-10","summary":"Adjusted scope"}]'
              />
            </Field>
          ) : null}
        </div>

        {error ? <p className="text-[11px] text-stat">{error}</p> : null}

        <div className="border-t border-border pt-3 flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => setDetailMode('rule-detail')} disabled={saving}>
            Cancel
          </Button>
          {isEditing ? (
            <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => handleSave(false)} disabled={saving}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
              Save Changes
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => handleSave(false)} disabled={saving}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Save as Draft
              </Button>
              <Button
                size="sm"
                className="h-8 text-[11px] gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => handleSave(true)}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Save & Activate
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 mb-2">
      <label className="text-[10px] text-muted-foreground font-medium">{label}</label>
      {children}
    </div>
  );
}
