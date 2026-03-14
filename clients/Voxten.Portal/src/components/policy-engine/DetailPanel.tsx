import { usePolicyEngineStore } from '@/stores/policyEngineStore';
import type { PolicyPackView, PolicyRuleView } from '@/lib/policyEngine';
import { PackOverview } from './PackOverview';
import { PatternLibraryDetailView } from './PatternLibraryDetailView';
import { PatternLibraryForm } from './PatternLibraryForm';
import { PatternLibraryOverview } from './PatternLibraryOverview';
import { RuleDetailView } from './RuleDetailView';
import { RuleCreateForm } from './RuleCreateForm';
import type { PatternLibraryResponse } from '@/lib/complianceApi';

interface Props {
  packs: PolicyPackView[];
  rules: PolicyRuleView[];
  patternLibraries: PatternLibraryResponse[];
  onRuleCreated?: () => void;
  onRuleChanged?: () => void;
  onPatternLibraryChanged?: () => void;
}

export function DetailPanel({
  packs,
  rules,
  patternLibraries,
  onRuleCreated,
  onRuleChanged,
  onPatternLibraryChanged,
}: Props) {
  const { detailMode, workspaceMode } = usePolicyEngineStore();

  switch (detailMode) {
    case 'pack-overview':
      return <PackOverview packs={packs} rules={rules} />;
    case 'rule-detail':
      return <RuleDetailView rules={rules} onRuleChanged={onRuleChanged} />;
    case 'rule-create':
      return <RuleCreateForm packs={packs} onCreated={onRuleCreated} />;
    case 'rule-edit':
      return <RuleCreateForm packs={packs} rules={rules} onCreated={onRuleChanged} mode="edit" />;
    case 'pattern-library-overview':
      return <PatternLibraryOverview libraries={patternLibraries} />;
    case 'pattern-library-detail':
      return <PatternLibraryDetailView libraries={patternLibraries} />;
    case 'pattern-library-create':
      return <PatternLibraryForm libraries={patternLibraries} onSaved={onPatternLibraryChanged} mode="create" />;
    case 'pattern-library-edit':
      return <PatternLibraryForm libraries={patternLibraries} onSaved={onPatternLibraryChanged} mode="edit" />;
    default:
      return workspaceMode === 'patterns'
        ? <PatternLibraryOverview libraries={patternLibraries} />
        : <PackOverview packs={packs} rules={rules} />;
  }
}
