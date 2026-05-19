"use client";

import { Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Filter } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { DealDrawer } from "@/components/deal-drawer";
import { api } from "@/services/api";
import { useDealBoardStore } from "@/store/use-deal-board-store";
import type { ApiDeal } from "@/types/api";

const boardConfig = {
  "my-deals": { title: "My Deals — Q2", lockedFilter: "Owner = Me - locked" },
  "enterprise-deals-q2": { title: "Enterprise Deals Q2", lockedFilter: "Owner = Sarah Chen - locked" },
  "team-pipeline-west": { title: "Team Pipeline - West", lockedFilter: "Owner = Michael Rodriguez - locked" },
  "strategic-accounts": { title: "Strategic Accounts", lockedFilter: "Owner = John Smith - locked" }
} as const;

const stages = ["Proposal", "Negotiation", "Discovery", "Closed Won", "Qualification", "Prospecting", "Closed Lost"];
const forecastTabs = [
  { label: "Pipeline", value: "PIPELINE" },
  { label: "Best Case", value: "BEST_CASE" },
  { label: "Commit", value: "COMMIT" }
] as const;
const forecastCategories = [
  { label: "Pipeline", value: "PIPELINE" },
  { label: "Best Case", value: "BEST_CASE" },
  { label: "Commit", value: "COMMIT" },
  { label: "Closed", value: "CLOSED" },
  { label: "Omitted", value: "OMITTED" }
] as const;

type ForecastFilter = (typeof forecastCategories)[number]["value"];
type Summary = Record<(typeof forecastTabs)[number]["value"], number>;

export default function MyDealsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50 px-4 py-2 sm:px-6 lg:px-8" />}>
      <MyDealsContent />
    </Suspense>
  );
}

function MyDealsContent() {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [forecastFilter, setForecastFilter] = useState<ForecastFilter>("PIPELINE");
  const searchParams = useSearchParams();
  const boardKey = searchParams.get("board") ?? "my-deals";
  const board = boardConfig[boardKey as keyof typeof boardConfig] ?? boardConfig["my-deals"];
  const { forecastCategory, stageFilter, grouping, query, setForecastCategory, setGrouping, setQuery, setStageFilter, setSelectedDeal } = useDealBoardStore();
  const stageParam = stageFilter === "All Stages" ? "" : `&stage=${encodeURIComponent(stageFilter)}`;
  const forecastParam = forecastFilter === "CLOSED" || forecastFilter === "OMITTED" ? "" : `forecastCategory=${forecastFilter}`;

  const { data: summary } = useQuery({
    queryKey: ["deals-summary"],
    queryFn: () => api<Summary>("/deals/summary"),
    refetchInterval: 10000
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["deals", forecastFilter, query, stageFilter],
    queryFn: async () => {
      try {
        const remote = await api<ApiDeal[]>(`/deals?${forecastParam}&q=${encodeURIComponent(query)}${stageParam}&limit=100`);
        if (remote.length) return remote;
      } catch {
        // fall back to the local Excel preview route when the database is still loading
      }

      const fallback = await fetch(`/api/local-deals?${forecastParam}&q=${encodeURIComponent(query)}${stageParam}`, { cache: "no-store" });
      if (!fallback.ok) throw new Error("Unable to load deals from the local Excel dataset");
      return (await fallback.json()) as ApiDeal[];
    },
    refetchInterval: 5000
  });

  const filteredDeals = useMemo(() => {
    const amountMinValue = amountMin ? Number(amountMin) : null;
    const amountMaxValue = amountMax ? Number(amountMax) : null;
    const closeDateValue = closeDate ? new Date(closeDate) : null;

    const deals = (data ?? []).filter((deal) => {
      const amount = Number(deal.amount ?? deal.value ?? 0);
      const closeDate = deal.closeDate ? new Date(deal.closeDate) : null;

      if (forecastFilter === "CLOSED" && !String(deal.stage ?? "").toLowerCase().includes("closed")) return false;
      if (forecastFilter === "OMITTED" && String(deal.stage ?? "").toLowerCase().includes("closed")) return false;
      if (amountMinValue !== null && amount < amountMinValue) return false;
      if (amountMaxValue !== null && amount > amountMaxValue) return false;
      if (closeDateValue && (!closeDate || closeDate.toISOString().slice(0, 10) !== closeDateValue.toISOString().slice(0, 10))) return false;
      return true;
    });

    return [...deals].sort((left, right) => new Date(right.lastActivityAt ?? 0).getTime() - new Date(left.lastActivityAt ?? 0).getTime());
  }, [amountMax, amountMin, closeDate, data, forecastFilter]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-4 sm:px-6 lg:px-8">
      <section className="w-full bg-white">
        <div className="px-0 pt-5">
          <Link href="/boards" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft size={18} />
            <span>Deal Boards</span>
          </Link>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <h1 className="font-serif text-[28px] font-semibold leading-tight text-slate-950">{board.title}</h1>
              <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-normal text-emerald-800">{board.lockedFilter}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFiltersOpen((current) => !current)}
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-base font-normal text-slate-800 hover:bg-slate-50"
              >
                <Filter size={20} strokeWidth={1.8} />
                Filters
              </button>
              <select
                value={grouping}
                onChange={(event) => setGrouping(event.target.value)}
                className="h-12 min-w-[190px] rounded-lg border border-slate-300 bg-white px-4 text-base font-normal text-slate-800 outline-none focus:border-blue-400"
              >
                <option>No grouping</option>
                <option>Group by rep</option>
                <option>Group by stage</option>
              </select>
            </div>
          </div>

          {filtersOpen ? (
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-6 py-5">
              <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr_1fr]">
                <label className="block">
                  <span className="mb-3 block text-sm font-medium text-slate-900">Stage</span>
                  <select
                    value={stageFilter === "All Stages" ? "" : stageFilter}
                    onChange={(event) => setStageFilter(event.target.value || "All Stages")}
                    size={5}
                    className="h-[118px] w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-base leading-6 text-slate-950 outline-none focus:border-blue-400"
                  >
                    <option value="">All Stages</option>
                    {stages.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-3 block text-sm font-medium text-slate-900">Forecast Category</span>
                  <select
                    value={forecastFilter}
                    onChange={(event) => {
                      const next = event.target.value as ForecastFilter;
                      setForecastFilter(next);
                      if (next === "PIPELINE" || next === "BEST_CASE" || next === "COMMIT") setForecastCategory(next);
                    }}
                    size={5}
                    className="h-[118px] w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-base leading-6 text-slate-950 outline-none focus:border-blue-400"
                  >
                    {forecastCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <span className="mb-3 block text-sm font-medium text-slate-900">Amount</span>
                  <div className="space-y-3">
                    <input
                      value={amountMin}
                      onChange={(event) => setAmountMin(event.target.value)}
                      inputMode="numeric"
                      placeholder="Min"
                      className="h-[52px] w-full rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-400"
                    />
                    <input
                      value={amountMax}
                      onChange={(event) => setAmountMax(event.target.value)}
                      inputMode="numeric"
                      placeholder="Max"
                      className="h-[52px] w-full rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <span className="mb-3 block text-sm font-medium text-slate-900">Close Date</span>
                  <input
                    type="date"
                    value={closeDate}
                    onChange={(event) => setCloseDate(event.target.value)}
                    className="h-[52px] w-full rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStageFilter("All Stages");
                  setForecastFilter("PIPELINE");
                  setForecastCategory("PIPELINE");
                  setAmountMin("");
                  setAmountMax("");
                  setCloseDate("");
                  refetch();
                }}
                className="mt-5 text-base font-normal text-blue-600 hover:text-blue-700"
              >
                Clear all filters
              </button>
            </div>
          ) : null}

          <div className="mt-6 flex h-12 items-end gap-7 border-b border-slate-200">
            {forecastTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setForecastFilter(tab.value);
                  setForecastCategory(tab.value);
                }}
                className={`h-full border-b-2 px-5 text-base font-normal transition ${
                  forecastFilter === tab.value ? "border-blue-500 text-blue-600" : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label} <span className="ml-1 font-semibold">{summary?.[tab.value] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-0 pb-12 pt-7">
          {isLoading ? (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-5" />
              <div className="space-y-0">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-[86px] animate-pulse border-b border-slate-200 bg-white px-4 py-4">
                    <div className="h-5 w-1/3 rounded bg-slate-100" />
                    <div className="mt-3 h-4 w-1/5 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>
          ) : isError ? (
            <div className="rounded-lg border border-red-200 bg-white p-8 text-center text-sm text-red-600">Unable to load deals right now.</div>
          ) : (
            <DataTable data={filteredDeals} onOpen={setSelectedDeal} grouping={grouping} />
          )}
        </div>
      </section>
      <DealDrawer />
    </main>
  );
}
