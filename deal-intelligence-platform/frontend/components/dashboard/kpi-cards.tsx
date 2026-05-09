import { ArrowDownRight, ArrowUpRight, BriefcaseBusiness, ShieldAlert, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getDeals } from "@/lib/local-store";
import { formatCurrency } from "@/lib/utils";

export function KpiCards() {
  const deals = getDeals();
  const pipeline = deals.reduce((sum, deal) => sum + deal.deal_value, 0);
  const atRisk = deals.filter((deal) => deal.health_status === "At Risk").length;
  const review = deals.filter((deal) => deal.human_review_required).length;

  const items = [
    { label: "Pipeline", value: formatCurrency(pipeline), icon: Wallet, trend: "+12.4%", up: true },
    { label: "Dataset Deals", value: String(deals.length), icon: BriefcaseBusiness, trend: "50-row POC", up: true },
    { label: "At-risk Deals", value: String(atRisk), icon: ShieldAlert, trend: "-8.6%", up: false },
    { label: "Human Review", value: String(review), icon: TrendingUp, trend: "manager queue", up: true }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="glass-panel shadow-panel">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {item.up ? <ArrowUpRight className="h-3 w-3 text-emerald-500" /> : <ArrowDownRight className="h-3 w-3 text-rose-500" />}
                {item.trend}
              </span>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-normal">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
