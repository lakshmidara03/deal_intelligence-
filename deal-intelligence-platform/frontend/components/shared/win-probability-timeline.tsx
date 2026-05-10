"use client";

import { useMemo } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  AreaChart, 
  ComposedChart,
  ReferenceArea
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import type { Deal } from "@/types/deal";

export function WinProbabilityTimeline({ deal }: { deal: Deal }) {
  const data = useMemo(() => {
    const currentProb = deal.probability;
    const trend = deal.forecast_trend;
    
    // Calculate trajectory
    const getChange = (days: number) => {
      const baseChange = trend === "increasing" ? 1.5 : trend === "declining" ? -1.5 : 0;
      return baseChange * days + (Math.random() * 4 - 2);
    };

    return [
      { name: "Today", prob: currentProb, isPredicted: false },
      { name: "+7 Days", prob: Math.max(0, Math.min(100, currentProb + getChange(7))), isPredicted: true },
      { name: "+14 Days", prob: Math.max(0, Math.min(100, currentProb + getChange(14))), isPredicted: true },
      { name: "+30 Days", prob: Math.max(0, Math.min(100, currentProb + getChange(30))), isPredicted: true },
    ];
  }, [deal]);

  const latestProb = data[data.length - 1].prob;
  const isInDangerZone = latestProb < 40;

  return (
    <div className="w-full rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-2xl border border-white/10 relative overflow-hidden flex flex-col">
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full mb-6 flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Win Probability Timeline</h3>
          <p className="text-sm text-slate-400 mt-1">30-day sparkline prediction based on current trajectory</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
            Trajectory
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
            deal.forecast_trend === 'increasing' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            deal.forecast_trend === 'declining' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
            'bg-slate-500/10 text-slate-400 border-slate-500/20'
          }`}>
            {deal.forecast_trend === 'increasing' ? <TrendingUp className="w-3 h-3" /> :
             deal.forecast_trend === 'declining' ? <TrendingDown className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
            <span className="text-[10px] font-bold uppercase">{deal.forecast_trend}</span>
          </div>
        </div>
      </div>

      <div className="h-[250px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="probGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              dy={10}
            />
            <YAxis 
              domain={[0, 100]} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#fff' }}
            />
            
            {/* Danger Zone Shading */}
            <ReferenceArea 
              y1={0} 
              y2={40} 
              fill="rgba(244, 63, 94, 0.05)" 
              stroke="none"
              label={{ position: 'insideBottomLeft', value: 'Danger Zone', fill: '#fb7185', fontSize: 10, offset: 10 }}
            />

            <Area 
              type="monotone" 
              dataKey="prob" 
              stroke="#6366f1" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#probGradient)" 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {isInDangerZone && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-4"
        >
          <div className="p-2 bg-rose-500/20 rounded-lg text-rose-500">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Risk Alert: Target Probability Falling</p>
            <p className="text-xs text-rose-400/80">Projected win rate will drop below the 40% safety threshold within 30 days.</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
