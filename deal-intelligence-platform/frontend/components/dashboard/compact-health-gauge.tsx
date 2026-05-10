"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ArrowUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Deal } from "@/types/deal";

interface CompactHealthGaugeProps {
  onDealSelect?: (deal: Deal) => void;
}

export function CompactHealthGauge({ onDealSelect }: CompactHealthGaugeProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [projectedScore, setProjectedScore] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const currentDeal = selectedDeal;
  const currentScore = currentDeal
    ? Math.round((currentDeal.ai_confidence * 100) / 100)
    : 0;

  const displayScore = isAnimating && projectedScore !== null ? projectedScore : currentScore;

  const handleSelectAction = (impact: number) => {
    const newScore = Math.min(currentScore + impact, 100);
    setProjectedScore(newScore);
    setIsAnimating(true);

    // Reset after 2 seconds
    setTimeout(() => {
      setProjectedScore(null);
      setIsAnimating(false);
    }, 2000);
  };

  const getScoreColor = (value: number) => {
    if (value >= 80) return "#22c55e";
    if (value >= 60) return "#eab308";
    if (value >= 40) return "#f97316";
    return "#ef4444";
  };

  const getStatusLabel = (value: number) => {
    if (value >= 80) return "Healthy";
    if (value >= 60) return "Good";
    if (value >= 40) return "Fair";
    return "At Risk";
  };

  const percentage = (displayScore / 100) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sampleActions = [
    { name: "Meeting Scheduled", impact: 8 },
    { name: "Send Demo", impact: 12 },
    { name: "Resolve Objection", impact: 15 }
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Deal Selector Card */}
      <Card className="glass-panel shadow-panel">
        <CardContent className="p-5">
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="text-sm text-muted-foreground">Loading deals...</div>
              </div>
            ) : deals.length === 0 ? (
              <div className="flex items-center justify-center py-6">
                <div className="text-sm text-muted-foreground">No deals found</div>
              </div>
            ) : (
              <>
                <div className="relative">
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between rounded-lg border border-muted-foreground/30 bg-muted/50 px-3 py-2 text-left text-sm hover:bg-muted transition"
                  >
                    <span className="truncate">
                      {currentDeal ? `${currentDeal.name} - ${currentDeal.account}` : "Select a deal"}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Dropdown */}
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 right-0 z-50 mt-2 max-h-48 overflow-y-auto rounded-lg border border-muted-foreground/30 bg-background/95 backdrop-blur-sm shadow-lg"
                    >
                      {deals.map((deal) => (
                        <button
                          key={deal.id}
                          onClick={() => {
                            setSelectedDeal(deal);
                            setIsOpen(false);
                            onDealSelect?.(deal);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs hover:bg-muted transition ${
                            selectedDeal?.id === deal.id ? "bg-primary/10" : ""
                          }`}
                        >
                          <p className="font-medium">{deal.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {deal.account} • ${(deal.deal_value / 1000).toFixed(0)}K
                          </p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

            {/* Health Score Gauge - Compact */}
            <div className="flex flex-col items-center space-y-2">
              <div className="relative h-40 w-40">
                <svg
                  viewBox="0 0 120 120"
                  className="h-full w-full transform -rotate-90"
                >
                  {/* Background circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted-foreground/20"
                  />

                  {/* Progress arc */}
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    strokeWidth="8"
                    stroke={getScoreColor(displayScore)}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 0.6, type: "spring" }}
                  />

                  {/* Needle */}
                  <motion.g
                    animate={{
                      rotate: (displayScore / 100) * 180 - 90
                    }}
                    transition={{ duration: 0.8, type: "spring", stiffness: 50 }}
                    style={{ transformOrigin: "60px 60px" }}
                  >
                    <line
                      x1="60"
                      y1="60"
                      x2="60"
                      y2="20"
                      stroke={getScoreColor(displayScore)}
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="60" cy="60" r="4" fill={getScoreColor(displayScore)} />
                  </motion.g>
                </svg>

                {/* Center score */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    key={displayScore}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-3xl font-bold"
                    style={{ color: getScoreColor(displayScore) }}
                  >
                    {displayScore}
                  </motion.span>
                </div>
              </div>

            </div>


            {/* Deal Info */}
            {currentDeal && (
              <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Value</span>
                  <span className="font-semibold">
                    ${(currentDeal.deal_value / 1000).toFixed(0)}K
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Stage</span>
                  <span className="font-semibold">{currentDeal.deal_stage}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-semibold">
                    {Math.round(currentDeal.ai_confidence)}%
                  </span>
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card className="glass-panel shadow-panel">
        <CardContent className="p-5">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Impact Simulator</h4>
            <p className="text-xs text-muted-foreground">
              Select an action to see how it affects the score
            </p>

            <div className="space-y-2">
              {sampleActions.map((action) => (
                <motion.button
                  key={action.name}
                  onClick={() => handleSelectAction(action.impact)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isAnimating}
                  className="w-full rounded-lg border border-muted-foreground/30 bg-muted/50 p-3 text-left text-sm hover:bg-muted hover:border-primary/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{action.name}</span>
                    <div className="flex items-center gap-1 rounded bg-green-500/20 px-2 py-1">
                      <ArrowUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                        +{action.impact}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Projected: {Math.min(currentScore + action.impact, 100)}
                  </p>
                </motion.button>
              ))}
            </div>

            {isAnimating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium"
              >
                ✓ Action recorded! Resetting in 2s...
              </motion.div>
            )}

            {/* Key Factors */}
            {currentDeal && (
              <div className="space-y-2 rounded-lg bg-muted/50 p-3 mt-4">
                <h5 className="text-xs font-semibold">Deal Factors</h5>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Engagement Score</span>
                    <span className="font-semibold">
                      {Math.round(currentDeal.engagement_score)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Probability</span>
                    <span className="font-semibold">{currentDeal.probability}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Inactivity Days</span>
                    <span className="font-semibold">{currentDeal.inactivity_days}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
