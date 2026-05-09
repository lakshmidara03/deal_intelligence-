import Link from "next/link";
import { AlertTriangle, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthBadge } from "@/components/deals/health-badge";
import { getDeals } from "@/lib/local-store";

export function PriorityAlerts() {
  const alerts = getDeals()
    .filter((deal) => deal.health_status === "At Risk" || deal.human_review_required || deal.inactivity_days >= 10)
    .sort((a, b) => b.ai_confidence - a.ai_confidence)
    .slice(0, 6);

  return (
    <Card className="glass-panel shadow-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          Priority Review Queue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((deal) => (
          <Link key={deal.id} href={`/deals/${deal.id}`} className="block rounded-lg border bg-background/70 p-4 transition hover:border-primary/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{deal.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{deal.account} · inactive {deal.inactivity_days} days</p>
              </div>
              <HealthBadge status={deal.health_status} />
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <UserCheck className="h-3.5 w-3.5" />
              {deal.human_review_required ? "Human manager review required" : "AI monitoring"}
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
