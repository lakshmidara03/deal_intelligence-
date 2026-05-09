import { Bot, CheckCircle2, Route, Sparkles, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Deal } from "@/types/deal";

export function InsightsPanel({ deal }: { deal: Deal }) {
  return (
    <Card className="glass-panel shadow-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Deal Brief
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border bg-background/70 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            Next Best Action
          </div>
          <p className="text-sm text-muted-foreground">{deal.next_best_action}</p>
        </div>
        <div>
          <p className="mb-3 flex items-center gap-2 text-sm font-medium">
            <TriangleAlert className="h-4 w-4 text-rose-500" />
            Primary Drivers
          </p>
          <div className="flex flex-wrap gap-2">
            {deal.drivers.map((driver) => (
              <Badge key={driver} className="bg-muted text-muted-foreground">{driver}</Badge>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Route className="h-3.5 w-3.5" />
              Momentum
            </p>
            <p className="mt-2 text-sm font-semibold capitalize">{deal.forecast_trend}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" />
              AI Confidence
            </p>
            <p className="mt-2 text-sm font-semibold">{deal.ai_confidence}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
