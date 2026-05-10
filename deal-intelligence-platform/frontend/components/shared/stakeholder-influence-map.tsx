"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Shield, Zap, AlertTriangle, Info, X } from "lucide-react";
import type { Stakeholder, StakeholderMapData } from "@/types/stakeholder";
import { Badge } from "@/components/ui/badge";

export function StakeholderInfluenceMap({ data }: { data: StakeholderMapData }) {
  const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null);

  // SVG dimensions
  const width = 600;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;

  // Calculate node positions in a circle around the center
  const getStakeholderPos = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const radius = 140;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Economic Buyer": return <Zap className="w-4 h-4" />;
      case "Champion": return <Shield className="w-4 h-4" />;
      case "Blocker": return <AlertTriangle className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "fill-emerald-500 stroke-emerald-400";
      case "negative": return "fill-rose-500 stroke-rose-400";
      default: return "fill-slate-500 stroke-slate-400";
    }
  };

  const getSentimentBg = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "negative": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="w-full rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-2xl border border-white/10 relative overflow-hidden flex flex-col items-center">
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full mb-8 text-center md:text-left">
        <h3 className="text-2xl font-bold text-white tracking-tight">Stakeholder Influence Map</h3>
        <p className="text-sm text-slate-400 mt-1">Force graph of contact influence and engagement pulse</p>
      </div>

      <div className="relative w-full aspect-[3/2] max-w-[600px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Connection Lines */}
          {data.stakeholders.map((sh, i) => {
            const pos = getStakeholderPos(i, data.stakeholders.length);
            return (
              <line
                key={`line-${sh.id}`}
                x1={centerX}
                y1={centerY}
                x2={pos.x}
                y2={pos.y}
                stroke="white"
                strokeOpacity="0.1"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Center Deal Node */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="cursor-default"
          >
            <circle cx={centerX} cy={centerY} r="35" className="fill-primary/20 stroke-primary/40" strokeWidth="2" />
            <circle cx={centerX} cy={centerY} r="25" className="fill-primary stroke-white/20" strokeWidth="1" />
            <text
              x={centerX}
              y={centerY + 5}
              textAnchor="middle"
              className="text-[10px] font-bold fill-white pointer-events-none uppercase tracking-tighter"
            >
              DEAL
            </text>
          </motion.g>

          {/* Stakeholder Nodes */}
          {data.stakeholders.map((sh, i) => {
            const pos = getStakeholderPos(i, data.stakeholders.length);
            const radius = 15 + (sh.influence * 2.5);
            const isLowEngagement = sh.engagementScore < 50;

            return (
              <motion.g
                key={sh.id}
                initial={{ x: centerX, y: centerY, opacity: 0 }}
                animate={{ x: pos.x, y: pos.y, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                className="cursor-pointer"
                onClick={() => setSelectedStakeholder(sh)}
              >
                {/* Pulse for low engagement */}
                {isLowEngagement && (
                  <motion.circle
                    r={radius + 8}
                    className="fill-rose-500/20"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                <circle
                  r={radius}
                  className={`${getSentimentColor(sh.sentiment)} transition-all duration-300`}
                  strokeWidth="2"
                />
                <circle r={radius - 5} fill="rgba(0,0,0,0.2)" />
                
                <foreignObject x={-10} y={-10} width={20} height={20} className="pointer-events-none">
                  <div className="flex items-center justify-center h-full text-white">
                    {getRoleIcon(sh.role)}
                  </div>
                </foreignObject>

                <text
                  y={radius + 15}
                  textAnchor="middle"
                  className="text-[10px] font-medium fill-slate-300 pointer-events-none"
                >
                  {sh.name.split(' ')[0]}
                </text>
              </motion.g>
            );
          })}
        </svg>

        {/* Selected Stakeholder Detail Overlay */}
        <AnimatePresence>
          {selectedStakeholder && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute inset-x-4 bottom-4 md:inset-auto md:right-4 md:top-4 md:w-72 bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl z-50"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getSentimentBg(selectedStakeholder.sentiment)}`}>
                    {getRoleIcon(selectedStakeholder.role)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{selectedStakeholder.name}</h4>
                    <p className="text-xs text-slate-400">{selectedStakeholder.title}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStakeholder(null)} className="text-slate-500 hover:text-white transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Role</span>
                  <Badge variant="outline" className="text-[10px] h-5">{selectedStakeholder.role}</Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Influence</span>
                  <div className="flex gap-0.5">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < selectedStakeholder.influence ? 'bg-primary' : 'bg-slate-700'}`} />
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Engagement Pulse</span>
                    <span className={selectedStakeholder.engagementScore < 50 ? 'text-rose-400' : 'text-emerald-400'}>
                      {selectedStakeholder.engagementScore}%
                    </span>
                  </div>
                  <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedStakeholder.engagementScore}%` }}
                      className={`h-full ${selectedStakeholder.engagementScore < 50 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    />
                  </div>
                </div>
                <div className="pt-2 flex items-center gap-2 text-[10px] text-slate-500 border-t border-white/5">
                  <Info className="w-3 h-3" />
                  Last interacted {selectedStakeholder.lastInteractionDays} days ago
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="w-full flex flex-wrap justify-center gap-6 mt-4 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" /> Positive
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500" /> Negative
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-500" /> Neutral
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full border border-rose-500 animate-pulse" /> Low Engagement
        </div>
      </div>
    </div>
  );
}
