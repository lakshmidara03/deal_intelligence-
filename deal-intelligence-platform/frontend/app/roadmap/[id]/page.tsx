"use client";

import { useState, useEffect, use } from "react";
import { AppShell } from "@/components/shared/app-shell";
import type { Deal } from "@/types/deal";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Smile, Ghost, Target, Clock, Globe, 
  ArrowLeft, Sparkles, Zap, Shield, AlertTriangle,
  ChevronDown, BriefcaseBusiness, Bot
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const roadmapFeatures = [
  {
    id: "01",
    title: "Buyer Emotion Tracker",
    icon: Smile,
    badge: "AI x Psychology",
    color: "text-indigo-400 bg-indigo-500/10",
    description: "Deep-dive analysis of buyer psychological states extracted from call transcripts. Unlike standard sentiment, this tracks Curiosity, Hesitation, and Skepticism to map the 'deal temperature' throughout the sales cycle.",
    whyItMatters: "Standard sentiment often misses the nuances that lead to deal stalls. Knowing exactly when a buyer became skeptical allows for immediate, targeted interventions."
  },
  {
    id: "02",
    title: "Deal Ghost Detector",
    icon: Ghost,
    badge: "Silence = Signal",
    color: "text-emerald-400 bg-emerald-500/10",
    description: "Predictive model that identifies patterns of buyer disengagement before they happen. It uses decay curves from thousands of lost deals to warn reps 48 hours before a buyer is likely to stop responding.",
    whyItMatters: "Most reps only realize they've been ghosted when it's too late. This provides a critical 48-hour window to send a 'rescue' message."
  },
  {
    id: "03",
    title: "Deal Pressure Test",
    icon: Target,
    badge: "Simulation",
    color: "text-amber-400 bg-amber-500/10",
    description: "Advanced AI agents that role-play your toughest stakeholders. Before your real meeting, the AI will grill you from the perspective of a skeptical CFO or a competitor-friendly champion.",
    whyItMatters: "Reps often walk into executive meetings unprepared for specific financial or technical pushback. This 'flight simulator' builds muscle memory for tough objections."
  },
  {
    id: "04",
    title: "Optimal Outreach Clock",
    icon: Clock,
    badge: "Behavioral AI",
    color: "text-rose-400 bg-rose-500/10",
    description: "Hyper-personalized scheduling based on individual buyer behavior. This isn't 'best time for industry'—it's 'best time for this specific person' based on their historical reply latency.",
    whyItMatters: "Average email open rates are declining. Hitting a buyer's specific 'active window' increases reply probability by up to 300%."
  },
  {
    id: "05",
    title: "External Signal Radar",
    icon: Globe,
    badge: "Live Intelligence",
    color: "text-sky-400 bg-sky-500/10",
    description: "Continuous monitoring of the open web for signals that change deal context. It tracks job postings, funding rounds, price changes, and executive departures across your entire target account list.",
    whyItMatters: "Context changes faster than CRM data. Knowing a competitor just dropped prices or a new CISO was hired can completely change your deal strategy."
  }
];

export default function FeatureDeepDivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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

  const feature = roadmapFeatures.find(f => f.id === id);

  if (!feature) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
          <h1 className="text-2xl font-bold text-white">Feature Not Found</h1>
          <Link href="/roadmap" className="mt-4 text-primary hover:underline">Back to Roadmap</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/roadmap" 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Roadmap
          </Link>

          <div className="relative w-[280px] z-50">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-slate-800/80 border border-white/10 rounded-xl p-2.5 shadow-sm hover:bg-slate-700/80 transition-all"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Bot className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-semibold text-slate-100 truncate">
                  {selectedDeal ? selectedDeal.account : "Select Deal"}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
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

        <div className="flex flex-col md:flex-row md:items-center gap-8 mb-12">
          <div className={`p-6 rounded-3xl ${feature.color} border border-white/10`}>
            <feature.icon className="w-12 h-12" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl font-black text-slate-700">FEATURE {feature.id}</span>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase tracking-widest px-2">
                {feature.badge}
              </Badge>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight">{feature.title}</h1>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-12">
            <section>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Concept for {selectedDeal?.account || "Selected Deal"}
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                {feature.description}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-500" />
                Strategic Advantage
              </h2>
              <p className="text-slate-400 leading-relaxed bg-slate-800/40 p-6 rounded-2xl border border-white/5 italic">
                "For {selectedDeal?.account || 'the buyer'}, {feature.whyItMatters.replace('Standard', 'standard')}"
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-6">Development Status</h2>
              <div className="space-y-6">
                {[
                  { label: "Data Pipeline", progress: 100 },
                  { label: "AI Model Training", progress: 85 },
                  { label: "UX/UI Design", progress: 60 },
                  { label: "Public Beta", progress: 20 },
                ].map((step) => (
                  <div key={step.label} className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{step.label}</span>
                      <span className="text-slate-500">{step.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${step.progress}%` }}
                        className="h-full bg-primary"
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 shadow-2xl">
              <h3 className="text-sm font-bold text-white mb-4">Beta Program</h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                We are currently onboarding selected accounts for early testing of this feature.
              </p>
              <button className="w-full py-3 bg-primary text-primary-foreground font-black rounded-full text-xs hover:scale-105 transition-transform">
                Join Waitlist
              </button>
            </div>

            <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5">
              <h3 className="text-sm font-bold text-white mb-3">Related Agents</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-slate-700 text-slate-300">Psychology Agent</Badge>
                <Badge variant="secondary" className="bg-slate-700 text-slate-300">Sentiment Engine</Badge>
                <Badge variant="secondary" className="bg-slate-700 text-slate-300">NLP Core</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
