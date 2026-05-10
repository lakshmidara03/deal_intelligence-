"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { DealScoreWidget } from "@/components/shared/deal-score-widget";
import { CompetitiveRadarWidget } from "@/components/shared/competitive-radar-widget";
import { StakeholderInfluenceMap } from "@/components/shared/stakeholder-influence-map";
import { WinProbabilityTimeline } from "@/components/shared/win-probability-timeline";
import type { Deal } from "@/types/deal";
import { getCompetitorsForDeal } from "@/types/competitor";
import { getStakeholderData } from "@/types/stakeholder";
import { ChevronDown, BriefcaseBusiness, Activity, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DealScorePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await fetch("/api/deals");
        const result = await response.json();
        const dealsData = result.data || [];
        setDeals(dealsData);
        if (dealsData && dealsData.length > 0) {
          setSelectedDeal(dealsData[0]);
        }
      } catch (error) {
        console.error("Failed to fetch deals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-start min-h-[calc(100vh-8rem)] pt-8 pb-20 w-full max-w-6xl mx-auto px-4 lg:px-8">
        
        {/* Page Header & Selector Toolbar */}
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Deal Intelligence Scoring
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Select a deal to simulate factors and analyze health score.</p>
          </div>

          <div className="relative w-full md:w-[380px] z-50">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-slate-800/80 border border-white/10 rounded-xl p-3 shadow-sm hover:bg-slate-700/80 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {loading ? (
                <span className="text-sm text-muted-foreground">Loading deals...</span>
              ) : selectedDeal ? (
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-primary/20 text-primary rounded-md">
                    <BriefcaseBusiness className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-slate-100 truncate max-w-[220px]">
                      {selectedDeal.account} - {selectedDeal.name}
                    </h3>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-slate-300">Select a deal...</span>
              )}
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 w-full md:w-[450px] mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto"
                >
                  {deals.length === 0 && !loading ? (
                    <div className="p-4 text-sm text-slate-400 text-center">No deals available</div>
                  ) : (
                    deals.map((deal) => (
                      <button
                        key={deal.id}
                        onClick={() => {
                          setSelectedDeal(deal);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 border-b border-white/5 last:border-0 transition-colors hover:bg-slate-700/60 ${
                          selectedDeal?.id === deal.id ? "bg-primary/10" : ""
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-slate-200">{deal.account} - {deal.name}</p>
                            <p className="text-xs text-slate-500 mt-1">Value: ${(deal.deal_value / 1000).toFixed(0)}K • Status: <span className={deal.health_status === 'Healthy' ? 'text-emerald-400' : deal.health_status === 'At Risk' ? 'text-red-400' : 'text-amber-400'}>{deal.health_status}</span></p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Deal Score Widget */}
        <div className="w-full flex flex-col items-center z-10 relative gap-8 mt-4">
          {selectedDeal ? (
            <>
              <DealScoreWidget deal={selectedDeal} />
              
              <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
                <CompetitiveRadarWidget data={getCompetitorsForDeal(selectedDeal)} />
                <StakeholderInfluenceMap data={getStakeholderData(selectedDeal)} />
              </div>
            </>
          ) : (
            <div className="mt-20 text-muted-foreground text-sm flex flex-col items-center gap-4">
               <BriefcaseBusiness className="w-12 h-12 text-slate-700" />
               <p>Please select a deal from the dropdown above to begin analysis.</p>
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
