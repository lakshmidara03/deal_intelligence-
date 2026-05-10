"use client";

import { useState, useEffect } from "react";
import { motion, animate, useMotionValue, useTransform } from "framer-motion";
import type { Deal } from "@/types/deal";

interface Factor {
  id: string;
  label: string;
  status: string;
  impact: number;
  active: boolean;
}

const fallbackFactors: Factor[] = [
  { id: "f1", label: "Executive Alignment", status: "High", impact: 15, active: true },
  { id: "f2", label: "Budget Confirmed", status: "Medium", impact: 10, active: false },
  { id: "f3", label: "Security Review", status: "Average", impact: 8, active: true },
  { id: "f4", label: "Competitor Active", status: "Poor", impact: -12, active: false },
  { id: "f5", label: "Timeline Agreed", status: "Good", impact: 10, active: true },
];

function getFactorsForDeal(deal?: Deal): Factor[] {
  if (!deal) return fallbackFactors;

  return [
    {
      id: "engagement",
      label: "High Buyer Engagement",
      status: deal.engagement_score > 60 ? "Strong" : deal.engagement_score < 40 ? "Weak" : "Average",
      impact: 15,
      active: deal.engagement_score > 60,
    },
    {
      id: "competitor",
      label: "Competitor Involved",
      status: deal.competitor_mentioned ? "Active Threat" : "None Detected",
      impact: -12,
      active: deal.competitor_mentioned,
    },
    {
      id: "next_step",
      label: "Clear Next Steps",
      status: deal.next_step_defined ? "Scheduled" : "Missing",
      impact: 10,
      active: deal.next_step_defined,
    },
    {
      id: "stalled",
      label: "Deal Stalled (>14 Days)",
      status: deal.inactivity_days > 14 ? "Stalled" : "Active",
      impact: -15,
      active: deal.inactivity_days > 14,
    },
    {
      id: "close_date",
      label: "Close Date Slipped",
      status: deal.close_date_pushed ? "Pushed" : "On Track",
      impact: -10,
      active: deal.close_date_pushed,
    }
  ];
}

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(value);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest));
  
  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.8, type: "spring", bounce: 0.2 });
    return controls.stop;
  }, [value, motionValue]);

  return <motion.span>{rounded}</motion.span>;
}

export function DealScoreWidget({ deal }: { deal?: Deal }) {
  const [factors, setFactors] = useState(() => getFactorsForDeal(deal));
  const [baseScore, setBaseScore] = useState(55);

  useEffect(() => {
    if (deal) {
      const dealFactors = getFactorsForDeal(deal);
      setFactors(dealFactors);
      const activeImpact = dealFactors.filter(f => f.active).reduce((acc, f) => acc + f.impact, 0);
      setBaseScore(Math.round(deal.ai_confidence) - activeImpact);
    }
  }, [deal]); 
  
  const score = baseScore + factors.filter(f => f.active).reduce((acc, f) => acc + f.impact, 0);
  const normalizedScore = Math.max(0, Math.min(100, score));
  
  // Angle for the needle: -90 deg to 90 deg
  const angle = (normalizedScore / 100) * 180 - 90;

  const toggleFactor = (id: string) => {
    setFactors(factors.map(f => f.id === id ? { ...f, active: !f.active } : f));
  };

  const getScoreStatus = (s: number) => {
    if (s >= 80) return { label: "Excellent", color: "text-emerald-500", labelColor: "text-emerald-400", bgColor: "bg-emerald-500" };
    if (s >= 60) return { label: "Good", color: "text-amber-500", labelColor: "text-amber-400", bgColor: "bg-amber-500" };
    if (s >= 40) return { label: "Fair", color: "text-orange-500", labelColor: "text-orange-400", bgColor: "bg-orange-500" };
    return { label: "Poor", color: "text-red-500", labelColor: "text-red-400", bgColor: "bg-red-500" };
  };

  const status = getScoreStatus(normalizedScore);

  return (
    <div className="w-full max-w-5xl rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-2xl border border-white/10 relative overflow-hidden mt-2 grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* Background Glow */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Left Column: Gauge */}
      <div className="flex flex-col items-center justify-center border-r-0 lg:border-r border-white/5 pr-0 lg:pr-10 relative z-10">
        
        {/* Gauge Container */}
        <div className="relative w-[320px] h-[160px] flex flex-col items-center justify-end overflow-visible z-10 mt-8 mb-6">
           {/* SVG Gauge Background */}
           <svg className="absolute bottom-0 w-[320px] h-[160px] drop-shadow-md overflow-visible" viewBox="0 0 100 50">
             <defs>
               <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                 <stop offset="0%" stopColor="#ef4444" />
                 <stop offset="100%" stopColor="#f97316" />
               </linearGradient>
               <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                 <stop offset="0%" stopColor="#facc15" />
                 <stop offset="100%" stopColor="#84cc16" />
               </linearGradient>
               <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                 <stop offset="0%" stopColor="#22c55e" />
                 <stop offset="100%" stopColor="#10b981" />
               </linearGradient>
             </defs>

             {/* Outer track */}
             <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#334155" strokeWidth="6" strokeLinecap="round" strokeDasharray="1 4" />

             {/* Colored segments */}
             <path d="M 10 50 A 40 40 0 0 1 28.35 14.33" fill="none" stroke="url(#redGradient)" strokeWidth="8" strokeLinecap="round" />
             <path d="M 33.64 12.01 A 40 40 0 0 1 73.11 17.55" fill="none" stroke="url(#yellowGradient)" strokeWidth="8" strokeLinecap="round" />
             <path d="M 77.64 21.11 A 40 40 0 0 1 90 50" fill="none" stroke="url(#greenGradient)" strokeWidth="8" strokeLinecap="round" />

             {/* Tick marks */}
             {Array.from({ length: 21 }).map((_, i) => {
               const tickAngle = (i / 20) * Math.PI;
               const x1 = 50 - 34 * Math.cos(tickAngle);
               const y1 = 50 - 34 * Math.sin(tickAngle);
               const x2 = 50 - 36 * Math.cos(tickAngle);
               const y2 = 50 - 36 * Math.sin(tickAngle);
               return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 5 === 0 ? "#94a3b8" : "#475569"} strokeWidth={i % 5 === 0 ? "1.5" : "0.5"} />;
             })}
           </svg>

           {/* Needle */}
           <motion.div
             className="absolute bottom-0 w-full h-[130px] flex justify-center origin-bottom z-20"
             initial={{ rotate: -90 }}
             animate={{ rotate: angle }}
             transition={{ type: "spring", stiffness: 60, damping: 15 }}
           >
             <div className="w-[4px] h-[75px] bg-white rounded-t-full shadow-lg relative -top-3" />
             <div className="w-5 h-5 bg-white border-[4px] border-slate-900 rounded-full absolute -bottom-2.5 z-30 shadow-[0_0_15px_rgba(255,255,255,0.6)]" />
           </motion.div>

           {/* Scale values */}
           <div className="absolute -bottom-6 w-full flex justify-between px-1 text-xs text-slate-400 font-medium">
             <span>0</span>
             <span>100</span>
           </div>
        </div>

        <div className="text-center mt-6 z-10 relative">
          <div className="text-7xl font-bold text-white tracking-tight drop-shadow-lg">
            <AnimatedNumber value={normalizedScore} />
          </div>
          <p className="text-base text-slate-300 mt-2 font-medium">
            Deal Health is <span className={status.labelColor}>{status.label}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-10 w-full max-w-sm">
          <div className="bg-slate-800/80 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center">
            <span className="text-[11px] text-slate-400 mb-1 uppercase tracking-wider">Last Updated</span>
            <span className="text-sm font-semibold text-slate-200">Just now</span>
          </div>
          <div className="bg-slate-800/80 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center">
            <span className="text-[11px] text-slate-400 mb-1 uppercase tracking-wider">Sync Status</span>
            <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Simulator */}
      <div className="flex flex-col relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-white">Risk & Impact Simulator</h4>
            <p className="text-xs text-slate-400 mt-1">Toggle factors to simulate score outcomes</p>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          {factors.map((factor) => (
            <div 
              key={factor.id} 
              className={`flex items-center justify-between cursor-pointer group p-4 rounded-xl border transition-all ${factor.active ? 'bg-slate-800/60 border-primary/20 shadow-sm' : 'bg-slate-800/30 border-white/5 hover:border-white/10'}`}
              onClick={() => toggleFactor(factor.id)}
            >
              <div className="flex flex-col">
                <span className={`text-sm font-semibold transition-colors ${factor.active ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{factor.label}</span>
                <span className="text-xs text-slate-500 mt-1">Status: <span className="text-slate-400">{factor.status}</span></span>
              </div>
              <div className="flex items-center gap-5">
                <div className="text-right flex flex-col items-end">
                  <span className={`text-sm font-bold ${factor.impact > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {factor.impact > 0 ? '+' : ''}{factor.impact}
                  </span>
                </div>
                
                {/* Custom Toggle */}
                <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${factor.active ? 'bg-primary' : 'bg-slate-700'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${factor.active ? 'translate-x-2.5' : '-translate-x-2.5'}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
