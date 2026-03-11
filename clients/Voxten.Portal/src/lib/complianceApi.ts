import { fetchWithAuth } from "@/lib/fetchWithAuth";

// ─── Base URLs ────────────────────────────────────────────────────────────────

function portalBase(): string {
  return (import.meta.env.VITE_PORTAL_API_BASE_URL || "http://localhost:5008").replace(/\/$/, "");
}

function complianceBase(): string {
  return (import.meta.env.VITE_COMPLIANCE_API_BASE_URL || "http://localhost:5009").replace(/\/$/, "");
}

async function portalGet<T>(path: string): Promise<T> {
  const res = await fetchWithAuth(`${portalBase()}${path}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`PortalApi ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function portalPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetchWithAuth(`${portalBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PortalApi ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function portalPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetchWithAuth(`${portalBase()}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PortalApi ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function portalPatch<T>(path: string): Promise<T> {
  const res = await fetchWithAuth(`${portalBase()}${path}`, { method: "PATCH" });
  if (!res.ok) throw new Error(`PortalApi ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function complianceGet<T>(path: string): Promise<T> {
  const res = await fetchWithAuth(`${complianceBase()}${path}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`ComplianceApi ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ─── Rule Packs ───────────────────────────────────────────────────────────────

export interface RulePackResponse {
  id: string;
  name: string;
  description?: string;
  sector: string;
  isActive: boolean;
  retentionDays: number;
  ruleCount: number;
}

export interface PatternLibraryResponse {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateRulePackRequest {
  id: string;
  name: string;
  description?: string;
  sector: string;
  retentionDays: number;
}

export interface UpdateRulePackRequest {
  name: string;
  description?: string;
  retentionDays: number;
}

export function listPacks(): Promise<RulePackResponse[]> {
  return portalGet("/api/compliance/packs");
}

export function getPack(id: string): Promise<RulePackResponse> {
  return portalGet(`/api/compliance/packs/${encodeURIComponent(id)}`);
}

export function createPack(req: CreateRulePackRequest): Promise<RulePackResponse> {
  return portalPost("/api/compliance/packs", req);
}

export function updatePack(id: string, req: UpdateRulePackRequest): Promise<RulePackResponse> {
  return portalPut(`/api/compliance/packs/${encodeURIComponent(id)}`, req);
}

export function togglePack(id: string): Promise<{ id: string; isActive: boolean }> {
  return portalPatch(`/api/compliance/packs/${encodeURIComponent(id)}/toggle`);
}

export function listPatternLibraries(): Promise<PatternLibraryResponse[]> {
  return portalGet("/api/compliance/pattern-libraries");
}

// ─── Rules ────────────────────────────────────────────────────────────────────

export type RuleCategory =
  | "PhiDataPrivacy" | "ConsentAuthorization" | "IntegrityAudit"
  | "ClinicalCommunication" | "RetentionAccess" | "MarketingPhiSale"
  | "PatientRights" | "SecurityBaGovernance";

export type EvalType = "Deterministic" | "Ai" | "Hybrid";
export type Severity = "Critical" | "High" | "Medium" | "Low";
export type RuleStatus = "Draft" | "Active" | "Deprecated";

export interface RuleResponse {
  id: string;
  logicalId: string;
  version: string;
  name: string;
  description: string;
  category: RuleCategory;
  evalType: EvalType;
  defaultSeverity: Severity;
  status: RuleStatus;
  isActive: boolean;
  packId: string;
  effectiveDate: string;
  deprecatedDate?: string;
  scopeJson: string;
  logicJson: string;
  defaultActionsJson: string;
  exemptionsJson?: string;
  changelogJson?: string;
}

export interface CreateRuleRequest {
  logicalId: string;
  version: string;
  name: string;
  description: string;
  category: RuleCategory;
  evalType: EvalType;
  defaultSeverity: Severity;
  packId: string;
  effectiveDate: string;
  scopeJson: string;
  logicJson: string;
  defaultActionsJson: string;
  exemptionsJson?: string;
}

export interface UpdateRuleRequest {
  version: string;
  name: string;
  description: string;
  category: RuleCategory;
  evalType: EvalType;
  defaultSeverity: Severity;
  effectiveDate: string;
  scopeJson: string;
  logicJson: string;
  defaultActionsJson: string;
  exemptionsJson?: string;
  changelogJson?: string;
}

export interface RuleListFilters {
  packId?: string;
  status?: RuleStatus;
  activeOnly?: boolean;
}

export function listRules(filters: RuleListFilters = {}): Promise<RuleResponse[]> {
  const params = new URLSearchParams();
  if (filters.packId) params.set("packId", filters.packId);
  if (filters.status) params.set("status", filters.status);
  if (filters.activeOnly != null) params.set("activeOnly", String(filters.activeOnly));
  const qs = params.toString();
  return portalGet(`/api/compliance/rules${qs ? `?${qs}` : ""}`);
}

export function getRule(id: string): Promise<RuleResponse> {
  return portalGet(`/api/compliance/rules/${encodeURIComponent(id)}`);
}

export function createRule(req: CreateRuleRequest): Promise<RuleResponse> {
  return portalPost("/api/compliance/rules", req);
}

export function updateRule(id: string, req: UpdateRuleRequest): Promise<RuleResponse> {
  return portalPut(`/api/compliance/rules/${encodeURIComponent(id)}`, req);
}

export function activateRule(id: string): Promise<{ id: string; logicalId: string; version: string; isActive: boolean }> {
  return portalPost(`/api/compliance/rules/${encodeURIComponent(id)}/activate`, {});
}

export function deprecateRule(id: string): Promise<{ id: string; status: string }> {
  return portalPost(`/api/compliance/rules/${encodeURIComponent(id)}/deprecate`, {});
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export interface AuditSummary {
  auditId: string;
  messageId: string;
  complianceState: string;
  overallVerdict: string;
  maxViolationSeverity?: string;
  totalRulesEvaluated: number;
  violationCount: number;
  senderId?: string;
  senderRole?: string;
  threadId?: string;
  sourceChannel?: string;
  direction?: string;
  engineVersion: string;
  isDisclosure: boolean;
  messageTimestamp: string;
  createdAt: string;
  retainUntil: string;
}

export interface EvaluationResultSummary {
  ruleLogicalId: string;
  ruleVersion: string;
  evalLane: string;
  verdict: string;
  violationSeverity?: string;
  confidence?: number;
  evidenceJson: string;
  evaluationLatencyMs: number;
  isDegradedMode: boolean;
  degradedReason?: string;
}

export interface AuditDetail extends AuditSummary {
  ingestHash: string;
  evaluationHash: string;
  signingKeyId: string;
  ruleVersionsSnapshotJson: string;
  contentBlobRef: string;
  messageContent?: string;
  evaluationResults: EvaluationResultSummary[];
}

export interface AuditPage {
  items: AuditSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AuditFilters {
  threadId?: string;
  senderId?: string;
  complianceState?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export function queryAuditRecords(filters: AuditFilters = {}): Promise<AuditPage> {
  const params = new URLSearchParams();
  if (filters.threadId) params.set("threadId", filters.threadId);
  if (filters.senderId) params.set("senderId", filters.senderId);
  if (filters.complianceState) params.set("complianceState", filters.complianceState);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.page != null) params.set("page", String(filters.page));
  if (filters.pageSize != null) params.set("pageSize", String(filters.pageSize));
  const qs = params.toString();
  return complianceGet(`/api/compliance/audit${qs ? `?${qs}` : ""}`);
}

export function getAuditRecord(auditId: string): Promise<AuditDetail> {
  return complianceGet(`/api/compliance/audit/${encodeURIComponent(auditId)}`);
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface TopRuleDto {
  ruleLogicalId: string;
  ruleVersion: string;
  fireCount: number;
}

export interface ComplianceStats {
  windowDays: number;
  total: number;
  passed: number;
  flagged: number;
  redacted: number;
  blocked: number;
  topRulesFired: TopRuleDto[];
}

export function getComplianceStats(windowDays = 30): Promise<ComplianceStats> {
  return complianceGet(`/api/compliance/stats?windowDays=${windowDays}`);
}
