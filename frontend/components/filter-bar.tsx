"use client";

import { Filter } from "lucide-react";
import { useDealBoardStore } from "@/store/use-deal-board-store";
import { GroupingDropdown } from "./grouping-dropdown";

export function FilterBar() {
  const { query, stageFilter, setQuery, setStageFilter } = useDealBoardStore();

  return (
    <div className="flex flex-wrap items-center gap-3 border-y border-border bg-slate-50/80 px-4 py-3">
      <div className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm text-muted">
        <Filter size={16} />
        Locked filters: Owner = Sales Rep
      </div>
      <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-primary">
        Dataset loads automatically from <span className="font-semibold">datasets/deal_intelligence_dataset_cleaned.xlsx</span> on backend start
      </div>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter deals"
        className="h-9 w-64 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
      />
      <select
        value={stageFilter}
        onChange={(event) => setStageFilter(event.target.value)}
        className="h-9 rounded-md border border-border bg-white px-3 text-sm"
      >
        <option>All Stages</option>
        <option>Prospecting</option>
        <option>Qualification</option>
        <option>Discovery</option>
        <option>Proposal</option>
        <option>Negotiation</option>
        <option>Contract</option>
      </select>
      <GroupingDropdown />
    </div>
  );
}
