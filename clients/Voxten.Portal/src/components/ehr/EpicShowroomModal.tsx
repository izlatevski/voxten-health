import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function EpicShowroomModal({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            VOXTEN Clinical Messenger
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">SMART on FHIR Certified</Badge>
            <Badge variant="outline">Epic Connection Hub Ready</Badge>
          </div>

          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Category:</span> Clinical Communication & Escalation
          </p>

          <p className="text-sm text-foreground leading-relaxed">
            VOXTEN Clinical Messenger provides HIPAA-compliant, real-time clinical communication with automated escalation workflows. 
            Deeply integrated with Epic via SMART on FHIR, VOXTEN extends your EHR with intelligent messaging, critical result 
            alerting, and cross-facility communication — all with a complete audit trail and offline resilience.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline" className="gap-1 text-[11px]">
              <CheckCircle className="w-3 h-3 text-success" />
              SMART on FHIR
            </Badge>
            <Badge variant="outline" className="gap-1 text-[11px]">
              <CheckCircle className="w-3 h-3 text-success" />
              HL7 FHIR R4
            </Badge>
            <Badge variant="outline" className="gap-1 text-[11px]">
              <CheckCircle className="w-3 h-3 text-success" />
              HITRUST Certified
            </Badge>
            <Badge variant="outline" className="gap-1 text-[11px]">
              <CheckCircle className="w-3 h-3 text-success" />
              SOC 2 Type II
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
