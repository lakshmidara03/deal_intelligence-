"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { WinProbabilityTimeline } from "@/components/shared/win-probability-timeline";
import type { Deal } from "@/types/deal";
import { ChevronDown, BriefcaseBusiness, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WinProbabilityPage() {
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
              <TrendingUp className="w-6 h-6 text-primary" />
              Win Probability Forecast
            </h1>
            <p className="text-sm text-muted-foreground mt-1">AI-driven trajectory predictions for the next 30 days.</p>
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

        {/* Prediction Content */}
        <div className="w-full flex flex-col items-center z-10 relative gap-8 mt-4">
          {selectedDeal ? (
            <div className="w-full">
              <WinProbabilityTimeline deal={selectedDeal} />
              
              {/* Additional insights for this page */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">7-Day Outlook</h4>
                  <p className="text-lg font-bold text-white">
                    {selectedDeal.forecast_trend === 'increasing' ? 'Upward' : selectedDeal.forecast_trend === 'declining' ? 'Downward' : 'Stable'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Based on recent email velocity and meeting sentiment.</p>
                </div>
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Target Close</h4>
                  <p className="text-lg font-bold text-white">{selectedDeal.close_date}</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedDeal.close_date_pushed ? '⚠ Recently pushed out 15 days' : '✓ On track with original forecast'}</p>
                </div>
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">AI Confidence</h4>
                  <p className="text-lg font-bold text-white">{selectedDeal.ai_confidence}%</p>
                  <p className="text-xs text-slate-500 mt-1">Reliability score for the current 30-day projection.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-20 text-muted-foreground text-sm flex flex-col items-center gap-4">
               <TrendingUp className="w-12 h-12 text-slate-700" />
               <p>Please select a deal to view win probability forecasts.</p>
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
