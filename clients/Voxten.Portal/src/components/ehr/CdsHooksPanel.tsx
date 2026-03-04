import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cdsHookCards } from '@/data/ehrData';
import { Shield, AlertTriangle, Info, CheckCircle, Send, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const indicatorConfig = {
  critical: { icon: AlertTriangle, color: 'text-stat', border: 'border-l-stat', bg: 'bg-stat/5' },
  warning: { icon: AlertTriangle, color: 'text-urgent', border: 'border-l-urgent', bg: 'bg-urgent/5' },
  info: { icon: Info, color: 'text-primary', border: 'border-l-primary', bg: 'bg-primary/5' },
};

export function CdsHooksPanel() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'cds-patient-view': true, 'cds-order-sign': true, 'cds-encounter-discharge': true });
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    'PCP notified via VOXTEN (Dr. Patel)': false,
    'Pharmacy contacted for med reconciliation': true,
    'Home health referral sent': false,
  });

  const toggleExpand = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));
  const toggleCheck = (label: string) => setChecklist((p) => ({ ...p, [label]: !p[label] }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Clinical Decision Support</h2>
        <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-primary/10 text-primary border-primary/20">CDS Hooks</Badge>
      </div>

      <div className="space-y-3">
        {cdsHookCards.map((card) => {
          const config = indicatorConfig[card.indicator];
          const Icon = config.icon;
          const isOpen = expanded[card.id];

          return (
            <Card key={card.id} className={cn('border-l-4 overflow-hidden', config.border)}>
              <CardContent className="p-0">
                <button
                  onClick={() => toggleExpand(card.id)}
                  className={cn('w-full flex items-center gap-3 px-4 py-3 text-left', config.bg)}
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0', config.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{card.summary}</p>
                    <Badge variant="outline" className="text-[9px] h-3.5 px-1 font-mono mt-1">CDS Hook: {card.hook}</Badge>
                  </div>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-2 space-y-3">
                    {card.detail && <p className="text-sm text-muted-foreground">{card.detail}</p>}

                    {card.checklist && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Checklist</p>
                        {card.checklist.map((item) => (
                          <label key={item.label} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checklist[item.label] ?? item.done}
                              onChange={() => toggleCheck(item.label)}
                              className="rounded"
                            />
                            <span className={cn(checklist[item.label] ? 'line-through text-muted-foreground' : 'text-foreground')}>
                              {item.label}
                            </span>
                            {checklist[item.label] && <CheckCircle className="w-3.5 h-3.5 text-success" />}
                          </label>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      {card.links?.map((link) => (
                        <a key={link.label} href={link.url} className="text-xs text-primary hover:underline font-medium">{link.label} →</a>
                      ))}
                      {card.suggestions?.map((sug) => (
                        <button
                          key={sug.label}
                          onClick={() => toast.success(`Alert sent: ${sug.label}`)}
                          className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> {sug.label}
                        </button>
                      ))}
                      {card.actions?.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => toast.success('All pending notifications sent')}
                          className="text-xs font-medium bg-secondary text-secondary-foreground px-3 py-1 rounded-md hover:bg-secondary/90 transition-colors flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> {action.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 text-[10px] text-muted-foreground">
                      <Shield className="w-3 h-3" />
                      <span>Source: {card.source.label}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
