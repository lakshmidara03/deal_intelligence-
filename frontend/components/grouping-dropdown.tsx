"use client";

import { Layers3 } from "lucide-react";
import { useDealBoardStore } from "@/store/use-deal-board-store";

export function GroupingDropdown() {
  const { grouping, setGrouping } = useDealBoardStore();
  return (
    <label className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm text-muted">
      <Layers3 size={16} />
      <select value={grouping} onChange={(event) => setGrouping(event.target.value)} className="bg-transparent text-sm text-foreground outline-none">
        <option>No grouping</option>
        <option>Group by rep</option>
        <option>Group by stage</option>
      </select>
    </label>
  );
}
