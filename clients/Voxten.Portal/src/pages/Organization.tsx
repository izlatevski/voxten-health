import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2, Users, MapPin, Key, Plus, CreditCard, Globe,
} from 'lucide-react';

/* ── Facilities ── */
const facilities = [
  { name: 'St. Mary Medical Center', location: 'San Francisco, CA', status: 'Active', users: 342, messages: '47,291' },
  { name: 'Dignity Health — Mercy General', location: 'Sacramento, CA', status: 'Active', users: 218, messages: '31,456' },
  { name: 'Virginia Mason Franciscan', location: 'Seattle, WA', status: 'Active', users: 189, messages: '28,102' },
  { name: 'CHI Memorial', location: 'Chattanooga, TN', status: 'Onboarding', users: 0, messages: '—' },
];

/* ── Role Mapping ── */
const roleMappings = [
  { group: 'CSH-Clinicians-Physicians', role: 'Hospitalist / Physician', nav: 'Command Center, Communications', users: 156 },
  { group: 'CSH-Clinicians-Nursing', role: 'Charge Nurse / RN', nav: 'Command Center, Communications', users: 284 },
  { group: 'CSH-Compliance-Officers', role: 'Chief Compliance Officer', nav: 'Full Access', users: 8 },
  { group: 'CSH-Security-Admins', role: 'CISO / VP Technology', nav: 'Integration, Administration, Compliance', users: 4 },
  { group: 'CSH-IT-Administrators', role: 'Platform Admin', nav: 'Administration', users: 12 },
];

export default function Organization() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">Organization</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Tenant configuration, facilities, and user management</p>
      </div>

      {/* SECTION 1 — Organization Details */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            CommonSpirit Health
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {[
              { k: 'Tenant ID', v: 'csh-voxten-prod-2026' },
              { k: 'Azure Subscription', v: 'CommonSpirit-Azure-Enterprise' },
              { k: 'Entra Directory', v: 'commonspirithealth.onmicrosoft.com' },
              { k: 'VOXTEN Instance', v: 'voxten-health-prod' },
              { k: 'Region', v: 'East US 2' },
              { k: 'Contract', v: 'Enterprise (Annual) — Renews: Jan 2027' },
            ].map((row) => (
              <div key={row.k} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                <span className="text-muted-foreground w-36 shrink-0">{row.k}</span>
                <span className="text-foreground font-medium font-mono text-[11px]">{row.v}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2 — Facilities */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Facilities
            </h2>
            <Button size="sm" variant="outline" className="text-[11px] h-7 gap-1">
              <Plus className="w-3 h-3" /> Add Facility
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Facility</th>
                  <th className="pb-2 font-medium">Location</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Users</th>
                  <th className="pb-2 font-medium text-right">Governed Messages (30d)</th>
                </tr>
              </thead>
              <tbody>
                {facilities.map((f) => (
                  <tr key={f.name} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2.5 pr-3 font-medium text-foreground">{f.name}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{f.location}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`font-medium flex items-center gap-1 ${f.status === 'Active' ? 'text-success' : 'text-muted-foreground'}`}>
                        {f.status === 'Active' ? '●' : '○'} {f.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-foreground">{f.users || '—'}</td>
                    <td className="py-2.5 text-right tabular-nums text-foreground">{f.messages}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3 — Role Mapping */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            Entra ID Security Group → VOXTEN Role Mapping
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Entra Security Group</th>
                  <th className="pb-2 font-medium">VOXTEN Role</th>
                  <th className="pb-2 font-medium">Nav Access</th>
                  <th className="pb-2 font-medium text-right">Users</th>
                </tr>
              </thead>
              <tbody>
                {roleMappings.map((r) => (
                  <tr key={r.group} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2.5 pr-3">
                      <code className="font-mono text-foreground text-[11px]">{r.group}</code>
                    </td>
                    <td className="py-2.5 pr-3 text-foreground font-medium">{r.role}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{r.nav}</td>
                    <td className="py-2.5 text-right tabular-nums text-foreground">{r.users}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4 — License Summary */}
      <Card className="clinical-shadow border-border">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            License Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <span className="text-muted-foreground w-32 shrink-0">Active Licenses</span>
              <span className="text-foreground font-bold text-sm">749 / 1,000</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <span className="text-muted-foreground w-32 shrink-0">License Type</span>
              <span className="text-foreground font-medium">VOXTEN Professional ($28/user/mo)</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <span className="text-muted-foreground w-32 shrink-0">Marketplace</span>
              <span className="text-foreground font-medium">Azure Marketplace — MACC Eligible</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <span className="text-muted-foreground w-32 shrink-0">Billing</span>
              <span className="text-foreground font-medium">Monthly via Azure subscription</span>
            </div>
          </div>
          {/* Usage bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>License utilization</span>
              <span>74.9%</span>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-primary/60 rounded-full" style={{ width: '74.9%' }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
