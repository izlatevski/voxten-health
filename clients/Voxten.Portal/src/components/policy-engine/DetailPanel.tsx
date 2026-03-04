import { usePolicyEngineStore } from '@/stores/policyEngineStore';
import { PackOverview } from './PackOverview';
import { RuleDetailView } from './RuleDetailView';
import { RuleTester } from './RuleTester';
import { RuleCreateForm } from './RuleCreateForm';

export function DetailPanel() {
  const { detailMode } = usePolicyEngineStore();

  switch (detailMode) {
    case 'pack-overview':
      return <PackOverview />;
    case 'rule-detail':
      return <RuleDetailView />;
    case 'rule-tester':
      return <RuleTester />;
    case 'rule-create':
      return <RuleCreateForm />;
    default:
      return <PackOverview />;
  }
}
