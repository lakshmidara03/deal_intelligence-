"use client";

import { useState, useEffect } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { CompetitorRadarData } from "@/types/competitor";
import { Loader2 } from "lucide-react";

export function CompetitiveRadarWidget({ dealId, data: initialData }: { dealId?: string; data?: CompetitorRadarData }) {
  const [data, setData] = useState<CompetitorRadarData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [showYou, setShowYou] = useState(true);
  const [showRivalA, setShowRivalA] = useState(true);
  const [showRivalB, setShowRivalB] = useState(true);

  // Animation variants
  const tableContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  useEffect(() => {
    // If we have initialData, don't fetch
    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }

    async function fetchData() {
      if (!dealId) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/deals/${dealId}/competitors`);
        const result = await response.json();
        if (result.data) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch competitor data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dealId, initialData]);

  if (loading || !data) {
    return (
      <div className="w-full rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-2xl border border-white/10 relative overflow-hidden flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-slate-400">Loading competitive signals...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="w-full rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-2xl border border-white/10 relative overflow-hidden flex flex-col xl:flex-row gap-10">
      {/* Background Glow */}
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header and Radar Chart Section (Left) */}
      <div className="flex-1 min-w-[300px] relative z-10 flex flex-col">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white tracking-tight">Competitive Positioning</h3>
          <p className="text-sm text-slate-400 mt-1">Based on extracted call signals + CRM data</p>
        </div>

        <div className="h-[350px] w-full flex-1 relative -left-4">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.data}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              
              {showRivalB && data.rivalBName && (
                <Radar
                  name={data.rivalBName}
                  dataKey="rivalB"
                  stroke="#64748b"
                  fill="#64748b"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              )}
              {showRivalA && (
                <Radar
                  name={data.rivalAName}
                  dataKey="rivalA"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              )}
              {showYou && (
                <Radar
                  name="You"
                  dataKey="you"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.4}
                  strokeWidth={2.5}
                />
              )}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend and Data Table Section (Right) */}
      <div className="flex-1 flex flex-col relative z-10 justify-center min-w-[350px]">
        {/* Interactive Legend Toggles */}
        <div className="flex justify-end gap-3 mb-6">
          <button
            onClick={() => setShowYou(!showYou)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              showYou 
                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' 
                : 'bg-slate-800 text-slate-500 border-white/5 hover:bg-slate-700'
            }`}
          >
            You
          </button>
          <button
            onClick={() => setShowRivalA(!showRivalA)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              showRivalA 
                ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                : 'bg-slate-800 text-slate-500 border-white/5 hover:bg-slate-700'
            }`}
          >
            {data.rivalAName}
          </button>
          {data.rivalBName && (
            <button
              onClick={() => setShowRivalB(!showRivalB)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                showRivalB 
                  ? 'bg-slate-500/20 text-slate-300 border-slate-500/30' 
                  : 'bg-slate-800 text-slate-500 border-white/5 hover:bg-slate-700'
              }`}
            >
              {data.rivalBName}
            </button>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-4 px-6 py-4 border-b border-white/5 bg-slate-800/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <div className="col-span-1">Dimension</div>
            <div className={`text-center transition-opacity ${showYou ? 'text-indigo-400' : 'opacity-30'}`}>You</div>
            <div className={`text-center transition-opacity ${showRivalA ? 'text-red-400' : 'opacity-30'}`}>{data.rivalAName}</div>
            {data.rivalBName && <div className={`text-center transition-opacity ${showRivalB ? 'text-slate-300' : 'opacity-30'}`}>{data.rivalBName}</div>}
          </div>

          <motion.div 
            className="flex flex-col"
            variants={tableContainerVariants}
            initial="hidden"
            animate="show"
          >
            {data.data.map((row, i) => (
              <motion.div 
                key={row.dimension}
                variants={rowVariants}
                className={`grid grid-cols-4 px-6 py-4 items-center transition-colors hover:bg-slate-800/40 ${
                  i !== data.data.length - 1 ? 'border-b border-white/5' : ''
                }`}
              >
                <div className="col-span-1 text-sm font-medium text-slate-200">
                  {row.dimension}
                </div>
                <div className={`text-center font-bold transition-opacity ${showYou ? 'text-white' : 'opacity-30 text-slate-500'}`}>
                  {row.you}
                </div>
                <div className={`text-center font-bold transition-opacity ${showRivalA ? 'text-white' : 'opacity-30 text-slate-500'}`}>
                  {row.rivalA || '-'}
                </div>
                {data.rivalBName && (
                  <div className={`text-center font-bold transition-opacity ${showRivalB ? 'text-white' : 'opacity-30 text-slate-500'}`}>
                    {row.rivalB || '-'}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
