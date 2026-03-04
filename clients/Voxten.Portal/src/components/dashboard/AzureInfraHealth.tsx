import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AzureService {
  name: string;
  role: string;
  status: 'healthy' | 'degraded' | 'down';
  metric: string;
}

const services: AzureService[] = [
  { name: 'ACS', role: 'Communication Pipes', status: 'healthy', metric: '<20ms' },
  { name: 'ACS Video', role: 'Telehealth Sessions', status: 'healthy', metric: '<120ms' },
  { name: 'Event Hubs', role: 'Immutable Audit Ledger', status: 'healthy', metric: '<8ms' },
  { name: 'Azure OpenAI', role: 'Semantic Content Analysis', status: 'healthy', metric: '<95ms' },
  { name: 'Azure Speech', role: 'Video Transcription', status: 'healthy', metric: 'Avg 2.1min' },
  { name: 'Purview', role: 'Data Governance & Labels', status: 'healthy', metric: 'Synced' },
  { name: 'Sentinel', role: 'SIEM / Security Export', status: 'healthy', metric: '<12ms' },
  { name: 'Key Vault', role: 'Customer-Managed Keys', status: 'healthy', metric: 'Active' },
  { name: 'Conf. Computing', role: 'Enclave Processing', status: 'healthy', metric: 'SGX' },
  { name: 'Blob Storage', role: 'HIPAA WORM Archive', status: 'healthy', metric: 'WORM' },
];

const statusDot: Record<string, string> = {
  healthy: 'bg-success',
  degraded: 'bg-urgent',
  down: 'bg-stat',
};

export function AzureInfraHealth() {
  return (
    <Card className="clinical-shadow border-border flex-1">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Azure Infrastructure</h2>
          <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px] h-5">
            All Healthy
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {services.map((s) => (
            <div key={s.name} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', statusDot[s.status])} />
                <div>
                  <span className="font-medium text-foreground">{s.name}</span>
                  <span className="text-muted-foreground ml-1">({s.role})</span>
                </div>
              </div>
              <span className="text-muted-foreground font-mono tabular-nums">{s.metric}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
