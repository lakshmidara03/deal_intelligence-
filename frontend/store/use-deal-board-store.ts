import { create } from "zustand";

type SyncState = "syncing" | "synced" | "failed" | "idle";

interface DealBoardState {
  selectedDealId: string | null;
  drawerOpen: boolean;
  forecastCategory: "PIPELINE" | "BEST_CASE" | "COMMIT";
  grouping: string;
  stageFilter: string;
  query: string;
  syncState: Record<string, SyncState>;
  setSelectedDeal: (id: string | null) => void;
  setForecastCategory: (category: "PIPELINE" | "BEST_CASE" | "COMMIT") => void;
  setGrouping: (grouping: string) => void;
  setStageFilter: (stage: string) => void;
  setQuery: (query: string) => void;
  setSyncState: (dealId: string, state: SyncState) => void;
}

export const useDealBoardStore = create<DealBoardState>((set) => ({
  selectedDealId: null,
  drawerOpen: false,
  forecastCategory: "PIPELINE",
  grouping: "No grouping",
  stageFilter: "All Stages",
  query: "",
  syncState: {},
  setSelectedDeal: (id) => set({ selectedDealId: id, drawerOpen: Boolean(id) }),
  setForecastCategory: (forecastCategory) => set({ forecastCategory }),
  setGrouping: (grouping) => set({ grouping }),
  setStageFilter: (stageFilter) => set({ stageFilter }),
  setQuery: (query) => set({ query }),
  setSyncState: (dealId, state) => set((current) => ({ syncState: { ...current.syncState, [dealId]: state } }))
}));
