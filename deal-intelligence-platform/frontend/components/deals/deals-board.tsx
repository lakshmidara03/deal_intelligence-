"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpDown, Plus, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HealthBadge } from "@/components/deals/health-badge";
import { formatCurrency } from "@/lib/utils";
import type { Deal, HealthStatus } from "@/types/deal";

export function DealsBoard() {
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState<"all" | HealthStatus>("all");
  const [stage, setStage] = useState("all");
  const [priceBand, setPriceBand] = useState("all");
  const [sortRiskFirst, setSortRiskFirst] = useState(true);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  async function loadDeals() {
    const response = await fetch("/api/deals?limit=500", { cache: "no-store" });
    const payload = await response.json();
    setDeals(payload.data);
  }

  useEffect(() => {
    loadDeals();
  }, []);

  async function createDeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      account: String(form.get("account") ?? ""),
      owner: String(form.get("owner") ?? ""),
      deal_stage: String(form.get("deal_stage") ?? "Discovery"),
      opportunity_type: String(form.get("opportunity_type") ?? "New Business"),
      deal_value: Number(form.get("deal_value") ?? 0),
      probability: Number(form.get("probability") ?? 25),
      close_date: String(form.get("close_date") ?? "")
    };
    const response = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      event.currentTarget.reset();
      setIsCreating(false);
      await loadDeals();
    }
  }

  const filtered = useMemo(() => {
    const base = deals.filter((deal) => {
      const matchesQuery = `${deal.name} ${deal.account} ${deal.owner}`.toLowerCase().includes(query.toLowerCase());
      const matchesHealth = health === "all" || deal.health_status === health;
      const matchesStage = stage === "all" || deal.deal_stage === stage;
      const matchesPrice =
        priceBand === "all" ||
        (priceBand === "low" && deal.deal_value < 1000000) ||
        (priceBand === "mid" && deal.deal_value >= 1000000 && deal.deal_value < 7500000) ||
        (priceBand === "high" && deal.deal_value >= 7500000);
      return matchesQuery && matchesHealth && matchesStage && matchesPrice;
    });
    return base.sort((a, b) => sortRiskFirst ? b.ai_confidence - a.ai_confidence : b.deal_value - a.deal_value);
  }, [deals, health, priceBand, query, sortRiskFirst, stage]);

  const stages = useMemo(() => Array.from(new Set(deals.map((deal) => deal.deal_stage))).sort(), [deals]);

  return (
    <Card className="glass-panel shadow-panel">
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>Deals Board</CardTitle>
        <div className="flex w-full max-w-3xl flex-wrap items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search deal, account, owner" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <select value={health} onChange={(event) => setHealth(event.target.value as typeof health)} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="all">All health</option>
            <option value="Healthy">Healthy</option>
            <option value="Needs Review">Needs Review</option>
            <option value="At Risk">At Risk</option>
          </select>
          <select value={stage} onChange={(event) => setStage(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="all">All stages</option>
            {stages.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={priceBand} onChange={(event) => setPriceBand(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="all">All values</option>
            <option value="low">Under 10L</option>
            <option value="mid">10L-75L</option>
            <option value="high">75L+</option>
          </select>
          <Button variant="outline" size="icon" onClick={() => setSortRiskFirst((value) => !value)} title="Toggle sort">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setIsCreating((value) => !value)}>
            <Plus className="h-4 w-4" />
            New Deal
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isCreating && (
          <form onSubmit={createDeal} className="mb-4 grid gap-3 rounded-lg border bg-background/70 p-4 md:grid-cols-4">
            <Input name="name" placeholder="Deal name" required />
            <Input name="account" placeholder="Account" required />
            <Input name="owner" placeholder="Owner" required />
            <Input name="deal_stage" placeholder="Stage" defaultValue="Discovery" />
            <Input name="opportunity_type" placeholder="Type" defaultValue="New Business" />
            <Input name="deal_value" type="number" placeholder="Deal value" defaultValue="0" />
            <Input name="probability" type="number" min="0" max="100" placeholder="Probability" defaultValue="25" />
            <Input name="close_date" type="date" />
            <div className="md:col-span-4">
              <Button type="submit" size="sm">Create Deal</Button>
            </div>
          </form>
        )}
        <div className="grid gap-3">
          {filtered.map((deal, index) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Link href={`/deals/${deal.id}`} className="group relative grid gap-3 rounded-lg border bg-background/70 p-4 transition hover:border-primary/40 hover:shadow-panel md:grid-cols-[1.5fr_1fr_1fr_0.7fr]">
                <div>
                  <p className="font-medium">{deal.name}</p>
                  <p className="text-sm text-muted-foreground">{deal.account} · {deal.owner}</p>
                  <div className="pointer-events-none absolute left-4 top-14 z-20 hidden w-80 rounded-lg border bg-card p-4 text-sm shadow-panel group-hover:block">
                    <p className="font-semibold">{deal.account}</p>
                    <p className="mt-1 text-muted-foreground">{deal.deal_stage} · {formatCurrency(deal.deal_value)} · {deal.probability}%</p>
                    <p className="mt-3 text-xs text-muted-foreground">Next step</p>
                    <p className="mt-1">{deal.next_best_action}</p>
                    <p className="mt-3 text-xs text-muted-foreground">Human review</p>
                    <p className="mt-1">{deal.human_review_required ? "Required" : "Not required"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stage</p>
                  <p className="text-sm font-medium">{deal.deal_stage}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Value / Probability</p>
                  <p className="text-sm font-medium">{formatCurrency(deal.deal_value)} · {deal.probability}%</p>
                </div>
                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <HealthBadge status={deal.health_status} />
                  <p className="text-sm font-semibold">{deal.ai_confidence}%</p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
