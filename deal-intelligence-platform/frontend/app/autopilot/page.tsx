"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/shared/app-shell";
import type { Deal } from "@/types/deal";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Radio, Zap, Shield, AlertCircle, ChevronDown, 
  BriefcaseBusiness, Bot, Play, Pause, Settings2,
  Clock, CheckCircle2, MessageSquare, Search, TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

function CustomToggle({ defaultChecked = true }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <button
      onClick={() => setChecked(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-primary' : 'bg-slate-700'
      }`}
    >
      <motion.div
        animate={{ x: checked ? 20 : 2 }}
        className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

export default function AutopilotPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [intensity, setIntensity] = useState([65]);
  const [isActive, setIsActive] = useState(true);

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

  const actionLog = [
    { time: "02:14 AM", action: "Sentiment Analysis", detail: "Scanned 14 new emails. Detected 'skepticism' drift in Economic Buyer.", type: "analysis" },
    { time: "03:45 AM", action: "Competitive Intel", detail: "Competitor X dropped price by 12% in sector. Updated Win Probability.", type: "signal" },
    { time: "05:00 AM", action: "Auto-Draft", detail: "Drafted rescue email for Marcus T. (Empathetic Tone). Ready for review.", type: "action" },
    { time: "06:12 AM", action: "Signal Watch", detail: "Detected new 'Security' job posting at account. Signaling expansion intent.", type: "signal" },
  ];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto py-8 px-4 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                isActive ? 'bg-primary shadow-[0_0_30px_rgba(99,102,241,0.5)]' : 'bg-slate-800'
              }`}>
                <Radio className={`w-8 h-8 ${isActive ? 'text-primary-foreground animate-pulse' : 'text-slate-500'}`} />
              </div>
              {isActive && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Deal Autopilot</h1>
              <p className="text-slate-400 mt-1 flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                {isActive ? 'AI is currently monitoring your deals in the background' : 'Autopilot is paused'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/40 p-2 rounded-2xl border border-white/5 backdrop-blur-sm">
             <button 
              onClick={() => setIsActive(!isActive)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                isActive 
                  ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' 
                  : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
              }`}
             >
               {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
               {isActive ? 'Pause System' : 'Resume System'}
             </button>
             <div className="h-10 w-px bg-white/10 mx-2" />
             <div className="relative w-[300px] z-50">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between bg-slate-900/60 border border-white/10 rounded-xl p-3 shadow-sm hover:bg-slate-800/60 transition-all"
                >
                  {loading ? (
                    <span className="text-xs text-muted-foreground">Loading...</span>
                  ) : selectedDeal ? (
                    <span className="text-xs font-semibold text-slate-100 truncate">
                      {selectedDeal.account}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">Select Deal Context</span>
                  )}
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute top-full right-0 w-full mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto"
                    >
                      {deals.map((deal) => (
                        <button
                          key={deal.id}
                          onClick={() => {
                            setSelectedDeal(deal);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs border-b border-white/5 last:border-0 hover:bg-slate-700/60 ${
                            selectedDeal?.id === deal.id ? "bg-primary/10 text-primary" : "text-slate-300"
                          }`}
                        >
                          {deal.account}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Controls Panel */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Intensity Control */}
            <div className="bg-slate-800/40 border border-white/5 rounded-[2rem] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Settings2 className="w-24 h-24 text-primary" />
              </div>
              
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">AI Intensity</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Autonomy Level Control</p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-primary">{intensity}%</span>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">
                    {intensity[0] < 30 ? 'Observer Mode' : intensity[0] < 70 ? 'Augmented Intelligence' : 'Full Autonomy'}
                  </p>
                </div>
              </div>

              <div className="my-12 relative h-6 flex items-center group cursor-pointer">
                <div 
                  className="absolute inset-0 bg-slate-900/60 rounded-full border border-white/5" 
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const newIntensity = Math.round((x / rect.width) * 100);
                    setIntensity([Math.max(0, Math.min(100, newIntensity))]);
                  }}
                />
                <motion.div 
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-primary/50 to-primary rounded-full"
                  initial={false}
                  animate={{ width: `${intensity[0]}%` }}
                />
                <motion.div 
                  className="absolute w-8 h-8 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] border-4 border-primary z-10 -ml-4"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0}
                  onDrag={(e, info) => {
                    const trackWidth = (e.currentTarget.parentElement?.offsetWidth || 1);
                    const deltaX = info.delta.x;
                    const deltaPercent = (deltaX / trackWidth) * 100;
                    setIntensity([Math.max(0, Math.min(100, intensity[0] + deltaPercent))]);
                  }}
                  initial={false}
                  animate={{ left: `${intensity[0]}%` }}
                  style={{ touchAction: 'none' }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className={`p-4 rounded-2xl border transition-all ${intensity[0] < 30 ? 'bg-primary/10 border-primary/30' : 'bg-slate-900/40 border-white/5 opacity-50'}`}>
                  <p className="text-[10px] font-black text-slate-400 mb-1 uppercase">Suggest Only</p>
                  <p className="text-xs text-white">Passive monitoring</p>
                </div>
                <div className={`p-4 rounded-2xl border transition-all ${intensity[0] >= 30 && intensity[0] < 70 ? 'bg-primary/10 border-primary/30' : 'bg-slate-900/40 border-white/5 opacity-50'}`}>
                  <p className="text-[10px] font-black text-slate-400 mb-1 uppercase">Hybrid</p>
                  <p className="text-xs text-white">AI-guided actions</p>
                </div>
                <div className={`p-4 rounded-2xl border transition-all ${intensity[0] >= 70 ? 'bg-primary/10 border-primary/30' : 'bg-slate-900/40 border-white/5 opacity-50'}`}>
                  <p className="text-[10px] font-black text-slate-400 mb-1 uppercase">Full Auto</p>
                  <p className="text-xs text-white">Autonomous deals</p>
                </div>
              </div>
            </div>

            {/* Automation Rules */}
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: "Sentiment Drift Engine", desc: "Monitors emails for emotional shifts.", icon: Zap },
                { title: "Competitor Price Watcher", desc: "Open web scraping for pricing data.", icon: Search },
                { title: "Engagement Decay Rescue", desc: "Auto-sends messages to silent buyers.", icon: MessageSquare },
                { title: "Expansion Intent Radar", desc: "Job board and funding alert analysis.", icon: TrendingUp },
              ].map((rule, i) => (
                <div key={i} className="bg-slate-800/40 border border-white/5 rounded-2xl p-6 flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-slate-900 rounded-xl text-primary border border-white/5">
                      <rule.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{rule.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{rule.desc}</p>
                    </div>
                  </div>
                  <CustomToggle defaultChecked />
                </div>
              ))}
            </div>
          </div>

          {/* Action Log Panel */}
          <div className="bg-slate-900/80 border border-white/5 rounded-[2rem] p-8 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-8">
              <Clock className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-bold text-white">24H Action Log</h3>
            </div>

            <div className="space-y-8 flex-1 relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/5" />
              {actionLog.map((log, i) => (
                <div key={i} className="relative pl-8">
                  <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-slate-900 flex items-center justify-center ${
                    log.type === 'action' ? 'bg-emerald-500' : log.type === 'signal' ? 'bg-indigo-500' : 'bg-primary'
                  }`}>
                    {log.type === 'action' ? <CheckCircle2 className="w-3 h-3 text-white" /> : <Zap className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{log.time}</span>
                    <h4 className="text-xs font-bold text-white mt-1">{log.action}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {log.detail.replace('Economic Buyer', selectedDeal?.account || 'Account')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-10 w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl border border-white/5 text-sm transition-colors">
              Download Full Export
            </button>
          </div>

        </div>

        {/* Footer Insight */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-[2rem] flex flex-col md:flex-row items-center gap-6"
        >
          <div className="p-4 bg-primary/20 text-primary rounded-2xl">
            <Shield className="w-8 h-8" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-lg font-bold text-white">Governance & Safety</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every autonomous action is recorded and can be reverted within 2 hours. Autopilot logic follows your enterprise 
              governance rules and never commits to pricing without final human approval.
            </p>
          </div>
          <button className="px-8 py-3 bg-white text-slate-900 font-bold rounded-full text-sm hover:scale-105 transition-transform">
            View Rule Ledger
          </button>
        </motion.div>

      </div>
    </AppShell>
  );
}
