import { Badge } from "@/components/ui/badge";
import type { HealthStatus } from "@/types/deal";

const styles: Record<HealthStatus, string> = {
  Healthy: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  "Needs Review": "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "At Risk": "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300"
};

export function HealthBadge({ status }: { status: HealthStatus }) {
  return <Badge className={styles[status]}>{status}</Badge>;
}
