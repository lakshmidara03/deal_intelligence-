import { create } from 'zustand';
import type { RiskCategory } from './signals';
import type { DealHealth } from './types';

type DealViewState = {
  healthFilter: DealHealth | 'ALL';
  searchTerm: string;
  riskCategory: RiskCategory;
  setHealthFilter: (healthFilter: DealHealth | 'ALL') => void;
  setSearchTerm: (searchTerm: string) => void;
  setRiskCategory: (riskCategory: RiskCategory) => void;
};

export const useDealViewStore = create<DealViewState>((set) => ({
  healthFilter: 'ALL',
  searchTerm: '',
  riskCategory: 'ALL',
  setHealthFilter: (healthFilter) => set({ healthFilter }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setRiskCategory: (riskCategory) => set({ riskCategory })
}));
