import { create } from 'zustand';
import type { DealHealth } from './types';

type DealViewState = {
  healthFilter: DealHealth | 'ALL';
  setHealthFilter: (healthFilter: DealHealth | 'ALL') => void;
};

export const useDealViewStore = create<DealViewState>((set) => ({
  healthFilter: 'ALL',
  setHealthFilter: (healthFilter) => set({ healthFilter })
}));
