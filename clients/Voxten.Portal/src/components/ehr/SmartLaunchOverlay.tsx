import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useEHRStore } from '@/stores/ehrStore';
import { CheckCircle, Loader2 } from 'lucide-react';

const steps = [
  { label: 'Contacting FHIR endpoint...', delay: 400 },
  { label: 'Validating OAuth2 token...', delay: 400 },
  { label: 'Loading patient context...', delay: 400 },
  { label: 'Session established', delay: 500 },
];

export function SmartLaunchOverlay() {
  const { smartLaunchComplete, setSmartLaunchComplete } = useEHRStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (smartLaunchComplete) {
      setVisible(false);
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;
    const runSteps = (step: number) => {
      if (step >= steps.length) {
        timeout = setTimeout(() => {
          setSmartLaunchComplete(true);
          setVisible(false);
        }, 500);
        return;
      }
      setCurrentStep(step);
      timeout = setTimeout(() => runSteps(step + 1), steps[step].delay);
    };

    timeout = setTimeout(() => runSteps(0), 300);
    return () => clearTimeout(timeout);
  }, [smartLaunchComplete, setSmartLaunchComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-card rounded-xl border border-border clinical-shadow-md p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">V</span>
          </div>
          <div>
            <h2 className="font-semibold text-foreground">SMART on FHIR Launch</h2>
            <p className="text-xs text-muted-foreground">Establishing secure EHR connection</p>
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step, i) => (
            <div
              key={step.label}
              className={cn(
                'flex items-center gap-3 transition-opacity duration-300',
                i > currentStep && 'opacity-30'
              )}
            >
              {i < currentStep ? (
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
              ) : i === currentStep ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0" />
              )}
              <span className={cn('text-sm', i <= currentStep ? 'text-foreground' : 'text-muted-foreground')}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-mono">ISS: epic-fhir.commonspirit.org/R4</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
            <span className="font-mono">Client: voxten-clinical-messenger</span>
          </div>
        </div>
      </div>
    </div>
  );
}
