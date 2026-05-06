import type { DriverImpact } from '@/lib/types';
import { label } from '@/lib/format';

const styles: Record<DriverImpact, string> = {
  POSITIVE: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  NEGATIVE: 'border-red-300 bg-red-50 text-red-800',
  NEUTRAL: 'border-zinc-300 bg-zinc-50 text-zinc-700'
};

export function ImpactBadge({ impact }: { impact: DriverImpact }) {
  return <span className={`rounded-md border px-2 py-1 text-xs font-medium ${styles[impact]}`}>{label(impact)}</span>;
}
