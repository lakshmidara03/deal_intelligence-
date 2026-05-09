import { Bot, CheckCircle2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDeals } from "@/lib/local-store";
import { formatCurrency } from "@/lib/utils";

export function SolutionOverview() {
  const deals = getDeals();
  const atRisk = deals.filter((deal) => deal.health_status === "At Risk").length;
  const review = deals.filter((deal) => deal.health_status === "Needs Review" || deal.human_review_required).length;
  const pipeline = deals.reduce((sum, deal) => sum + deal.deal_value, 0);

  return (
    <Card className="glass-panel shadow-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          What This POC Solves
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            DealIQ reads CRM deal fields and interaction activity from your dataset, predicts deal health, explains risk drivers,
            tracks sentiment from calls/emails/meetings, and recommends next actions for sales managers.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-background/70 p-3">
              <p className="text-xs">Dataset deals</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{deals.length}</p>
            </div>
            <div className="rounded-lg border bg-background/70 p-3">
              <p className="text-xs">Pipeline value</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{formatCurrency(pipeline)}</p>
            </div>
            <div className="rounded-lg border bg-background/70 p-3">
              <p className="text-xs">Human review</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{review}</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {[
            `Detect ${atRisk} at-risk deals before forecast slips`,
            "Prioritize manager reviews with human-in-the-loop decisions",
            "Recommend calls, emails, and meetings as next best actions"
          ].map((item) => (
            <div key={item} className="flex gap-3 rounded-lg border bg-background/70 p-3 text-sm">
              {item.includes("Human") ? <Users className="h-4 w-4 text-primary" /> : <CheckCircle2 className="h-4 w-4 text-primary" />}
              <span>{item}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
