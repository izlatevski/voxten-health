import { usePolicyEngineStore } from '@/stores/policyEngineStore';
import type { PolicyPackView, PolicyRuleView } from '@/lib/policyEngine';
import { PackOverview } from './PackOverview';
import { RuleDetailView } from './RuleDetailView';
import { RuleTester } from './RuleTester';
import { RuleCreateForm } from './RuleCreateForm';

interface Props {
  packs: PolicyPackView[];
  rules: PolicyRuleView[];
  onRuleCreated?: () => void;
  onRuleChanged?: () => void;
}

export function DetailPanel({ packs, rules, onRuleCreated, onRuleChanged }: Props) {
  const { detailMode } = usePolicyEngineStore();

  switch (detailMode) {
    case 'pack-overview':
      return <PackOverview packs={packs} rules={rules} />;
    case 'rule-detail':
      return <RuleDetailView rules={rules} onRuleChanged={onRuleChanged} />;
    case 'rule-tester':
      return <RuleTester rules={rules} />;
    case 'rule-create':
      return <RuleCreateForm packs={packs} onCreated={onRuleCreated} />;
    case 'rule-edit':
      return <RuleCreateForm packs={packs} rules={rules} onCreated={onRuleChanged} mode="edit" />;
    default:
      return <PackOverview packs={packs} rules={rules} />;
  }
}
