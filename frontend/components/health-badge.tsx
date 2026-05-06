import { AlertTriangle, CheckCircle2, CircleHelp } from 'lucide-react';
import type { DealHealth } from '@/lib/types';
import { label } from '@/lib/format';

const styles: Record<DealHealth, string> = {
  HEALTHY: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  AT_RISK: 'border-coral bg-red-50 text-red-800',
  NEEDS_REVIEW: 'border-gold bg-amber-50 text-amber-900'
};

export function HealthBadge({ health }: { health: DealHealth }) {
  const Icon = health === 'HEALTHY' ? CheckCircle2 : health === 'AT_RISK' ? AlertTriangle : CircleHelp;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${styles[health]}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label(health)}
    </span>
  );
}
