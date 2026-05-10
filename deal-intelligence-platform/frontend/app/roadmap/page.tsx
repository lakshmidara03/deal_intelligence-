"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/shared/app-shell";
import type { Deal } from "@/types/deal";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Smile, Ghost, Target, Clock, Globe, 
  ChevronDown, Sparkles, Zap, MessageSquare, 
  BarChart, AlertCircle, TrendingUp, Mail, Bot
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const roadmapFeatures = [
  {
    id: "01",
    title: "Buyer Emotion Tracker",
    icon: Smile,
    badge: "AI x Psychology",
    color: "bg-indigo-500/20 text-indigo-400",
    description: "Not sentiment. Actual emotions — curiosity, hesitation, skepticism — extracted from call transcripts and mapped to a timeline. A manager sees the exact moment the buyer's temperature changed.",
    renderDemo: (deal: Deal) => {
      const seed = deal.name.length;
      const emotions = [
        { time: "05:12", emotion: "Curiosity", score: 70 + (seed % 30), color: "bg-emerald-500" },
        { time: "12:45", emotion: seed % 2 === 0 ? "Hesitation" : "Skepticism", score: 40 + (seed % 40), color: "bg-amber-500" },
        { time: "22:30", emotion: deal.health_status === "Healthy" ? "Confidence" : "Concern", score: 30 + (seed % 50), color: "bg-rose-500" },
      ];
      return (
        <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Emotion Analysis: {deal.account}</span>
            <Badge variant="outline" className="text-[9px] h-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active Analysis</Badge>
          </div>
          <div className="space-y-4">
            {emotions.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 w-8">{item.time}</span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.score}%` }}
                    className={`h-full ${item.color}`}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-300 w-16">{item.emotion}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10px] text-slate-500 italic">"Detected {emotions[1].emotion.toLowerCase()} during pricing discussion. {deal.account} stakeholders showing {deal.health_status === 'Healthy' ? 'high' : 'variable'} curiosity."</p>
        </div>
      );
    }
  },
  {
    id: "02",
    title: "Deal Ghost Detector",
    icon: Ghost,
    badge: "Silence = Signal",
    color: "bg-emerald-500/20 text-emerald-400",
    description: "Predicts 48 hours in advance when a buyer will go permanently silent, based on decay curves matched against historical lost deals. Auto-drafts a rescue message tuned to the buyer's last emotional signal.",
    renderDemo: (deal: Deal) => {
      const risk = deal.health_status === "At Risk" ? 92 : deal.health_status === "Needs Review" ? 65 : 18;
      return (
        <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className={`w-4 h-4 ${risk > 50 ? 'text-rose-500' : 'text-emerald-500'}`} />
              <span className="text-xs font-bold text-white">Ghosting Risk: {risk}%</span>
            </div>
            <span className="text-[10px] text-slate-500">Analysis: {deal.name}</span>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">AI Rescue Draft (Dynamic)</p>
            <div className="p-3 bg-slate-800 rounded-lg text-xs text-slate-300 leading-relaxed border border-white/5">
              "Hi {deal.account.split(' ')[0]}, noticed we haven't connected since our talk about {deal.drivers[0]}. I know that's a high-priority point—I've prepared a brief overview for your team..."
            </div>
            <div className="flex gap-2 mt-2">
              <button className="px-3 py-1 bg-primary/20 text-primary rounded-md text-[10px] font-bold">Approve & Send</button>
            </div>
          </div>
        </div>
      );
    }
  },
  {
    id: "03",
    title: "Deal Pressure Test",
    icon: Target,
    badge: "Simulation",
    color: "bg-amber-500/20 text-amber-400",
    description: "The AI role-plays a skeptical CFO, a procurement blocker, and a competitor-friendly champion against your deal. Scores your rep's readiness before the real call happens.",
    renderDemo: (deal: Deal) => {
      const seed = deal.name.length;
      return (
        <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-white/5">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Value Prop", score: 7 + (seed % 4), color: "text-emerald-400" },
              { label: "Technical", score: 6 + (seed % 5), color: "text-emerald-400" },
              { label: "Procurement", score: 3 + (seed % 3), color: "text-rose-400" },
            ].map((item, i) => (
              <div key={i} className="text-center p-2 bg-slate-800 rounded-lg border border-white/5">
                <p className="text-[9px] text-slate-500 uppercase font-bold">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>{item.score}/10</p>
              </div>
            ))}
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3 h-3 text-indigo-400" />
              <p className="text-[10px] font-bold text-indigo-400 uppercase">CFO Persona Objection for {deal.account}</p>
            </div>
            <p className="text-xs text-slate-300 italic">"The ROI model for {deal.drivers[0]} seems aggressive. If we don't hit target efficiency, what's the clawback?"</p>
          </div>
        </div>
      );
    }
  },
  {
    id: "04",
    title: "Optimal Outreach Clock",
    icon: Clock,
    badge: "Behavioral AI",
    color: "bg-rose-500/20 text-rose-400",
    description: "Learns this specific buyer's actual reply behavior — not generic stats. Knows that Sarah Chen replies within 8 minutes if you send between 8:10–8:40am on Tuesdays.",
    renderDemo: (deal: Deal) => {
      const seed = deal.name.length;
      const hour = 8 + (seed % 2);
      const minute = 10 + (seed % 30);
      return (
        <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-white/5 flex flex-col items-center">
          <div className="relative w-24 h-24 mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f43f5e" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={180 - (seed * 5)} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-white">{hour}:{minute < 10 ? `0${minute}` : minute}</span>
              <span className="text-[8px] text-slate-500 uppercase">AM</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-white">Optimal Window for {deal.account}</p>
            <p className="text-[10px] text-slate-500 mt-1">High probability of immediate reply from your champions.</p>
            <button className="mt-3 px-4 py-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-[10px] font-bold flex items-center gap-2 mx-auto">
              <Mail className="w-3 h-3" /> Schedule for {deal.close_date_pushed ? 'Monday' : 'Tuesday'}
            </button>
          </div>
        </div>
      );
    }
  },
  {
    id: "05",
    title: "External Signal Radar",
    icon: Globe,
    badge: "Live Intelligence",
    color: "bg-sky-500/20 text-sky-400",
    description: "Watches the open web for events that silently change your deal's context — layoffs, funding rounds, competitor price drops, job postings that reveal intent.",
    renderDemo: (deal: Deal) => {
      const seed = deal.name.length;
      return (
        <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-white/5">
          <div className="space-y-3">
            {[
              { type: "Context", company: deal.account, news: `${deal.account} hiring in ${deal.drivers[0]}`, icon: Zap, color: "text-amber-400" },
              { type: "Market", company: "Competitors", news: `${deal.health_status === 'Healthy' ? 'Low' : 'High'} activity in sector`, icon: BarChart, color: "text-sky-400" },
              { type: "Signal", company: deal.account, news: `Recent executive engagement at ${deal.account}`, icon: TrendingUp, color: "text-emerald-400" },
            ].map((signal, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-slate-800 rounded-lg border border-white/5">
                <div className={`p-1.5 rounded bg-slate-900 ${signal.color}`}>
                  <signal.icon className="w-3 h-3" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">{signal.type}</span>
                    <span className="text-[8px] text-slate-600">Now</span>
                  </div>
                  <p className="text-[10px] font-bold text-white">{signal.news}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  }
];

export default function RoadmapPage() {
  const [expandedId, setExpandedId] = useState<string | null>("01");
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
      <div className="max-w-4xl mx-auto py-10 px-4">
        {/* Deal Selector Toolbar */}
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4 bg-slate-800/40 p-6 rounded-[2rem] border border-white/5">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/20 text-primary rounded-xl">
               <Bot className="w-5 h-5" />
             </div>
             <div>
               <h2 className="text-sm font-bold text-white">Innovation Context</h2>
               <p className="text-[10px] text-slate-500 uppercase tracking-widest">Select target account for analysis</p>
             </div>
          </div>

          <div className="relative w-full md:w-[320px] z-50">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-slate-900/80 border border-white/10 rounded-xl p-3 shadow-sm hover:bg-slate-800/80 transition-all"
            >
              {loading ? (
                <span className="text-xs text-muted-foreground">Loading...</span>
              ) : selectedDeal ? (
                <span className="text-xs font-semibold text-slate-100 truncate">
                  {selectedDeal.account}
                </span>
              ) : (
                <span className="text-xs text-slate-300">Select a deal...</span>
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

        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-4 uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            Product Innovation Lab
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-4">The Future of Deal Intelligence</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Explore our advanced R&D pipeline. These features represent the next generation of 
            agentic sales tools, moving from data tracking to predictive psychology.
          </p>
        </div>

        <div className="space-y-4">
          {roadmapFeatures.map((feature) => (
            <motion.div
              key={feature.id}
              layout
              initial={false}
              className={`group rounded-2xl border transition-all duration-300 ${
                expandedId === feature.id 
                  ? 'bg-slate-800/80 border-primary/30 shadow-2xl' 
                  : 'bg-slate-800/40 border-white/5 hover:border-white/20'
              }`}
            >
              <button
                onClick={() => setExpandedId(expandedId === feature.id ? null : feature.id)}
                className="w-full p-6 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-6">
                  <span className="text-xl font-black text-slate-700 group-hover:text-slate-500 transition-colors">
                    {feature.id}
                  </span>
                  <div className={`p-3 rounded-xl ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                    <Badge variant="secondary" className={`mt-1 bg-white/5 text-[10px] uppercase font-bold tracking-tighter`}>
                      {feature.badge}
                    </Badge>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${expandedId === feature.id ? 'rotate-180 text-primary' : ''}`} />
              </button>

              <AnimatePresence>
                {expandedId === feature.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-20 pb-8 grid md:grid-cols-2 gap-8 items-start border-t border-white/5 pt-6 mx-6">
                      <div className="space-y-4">
                        <p className="text-sm text-slate-400 leading-relaxed">
                          {feature.description}
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                          <Link 
                            href={`/roadmap/${feature.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-lg text-xs font-bold hover:bg-primary/30 transition-colors"
                          >
                            Explore Full Concept
                            <Sparkles className="w-3 h-3" />
                          </Link>
                        </div>
                        <div className="flex items-center gap-4 pt-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Complexity</span>
                            <div className="flex gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <div key={s} className={`w-3 h-1 rounded-full ${s <= 4 ? 'bg-primary' : 'bg-slate-700'}`} />
                              ))}
                            </div>
                          </div>
                          <div className="h-8 w-px bg-white/5" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Impact</span>
                            <div className="flex gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <div key={s} className="w-3 h-1 rounded-full bg-emerald-500" />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Interactive Proof-of-Concept</p>
                        {selectedDeal ? feature.renderDemo(selectedDeal) : (
                          <div className="p-8 bg-slate-900/50 rounded-xl border border-dashed border-white/10 text-center">
                            <p className="text-xs text-slate-500">Please select a deal above to load dynamic analysis</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-[2rem] bg-gradient-to-r from-primary/10 to-indigo-500/10 border border-primary/20 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Want to see these in action?</h3>
          <p className="text-sm text-slate-400 mb-6">These features are currently in private beta for selected enterprise partners.</p>
          <button className="px-8 py-3 bg-primary text-primary-foreground font-black rounded-full hover:scale-105 transition-transform">
            Request Early Access
          </button>
        </div>
      </div>
    </AppShell>
  );
}
