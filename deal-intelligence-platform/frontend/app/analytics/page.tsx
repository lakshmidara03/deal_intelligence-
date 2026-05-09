import { AppShell } from "@/components/shared/app-shell";
import { DealAnalytics } from "@/components/analytics/deal-analytics";
import { getDeals, getInteractions } from "@/lib/local-store";

export default function AnalyticsPage() {
  return (
    <AppShell>
      <DealAnalytics deals={getDeals()} interactions={getInteractions()} />
    </AppShell>
  );
}
