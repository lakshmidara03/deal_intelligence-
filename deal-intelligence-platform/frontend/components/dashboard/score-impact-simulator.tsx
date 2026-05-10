"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ScoreAction {
  id: string;
  title: string;
  description: string;
  impact: number;
  category: "engagement" | "timeline" | "communication" | "strategy";
  difficulty: "Easy" | "Medium" | "Hard";
}

interface ScoreImpactSimulatorProps {
  currentScore: number;
  maxScore?: number;
  actions?: ScoreAction[];
}

const defaultActions: ScoreAction[] = [
  {
    id: "1",
    title: "Schedule Next Meeting",
    description: "Book a meeting with the prospect",
    impact: 8,
    category: "engagement",
    difficulty: "Easy"
  },
  {
    id: "2",
    title: "Send Product Demo",
    description: "Share a personalized product demonstration",
    impact: 12,
    category: "communication",
    difficulty: "Medium"
  },
  {
    id: "3",
    title: "Resolve Key Objection",
    description: "Address the main concern blocking the deal",
    impact: 15,
    category: "strategy",
    difficulty: "Hard"
  },
  {
    id: "4",
    title: "Increase Engagement",
    description: "Add 3+ interactions this week",
    impact: 10,
    category: "engagement",
    difficulty: "Medium"
  },
  {
    id: "5",
    title: "Update Deal Info",
    description: "Refresh deal details and timeline",
    impact: 5,
    category: "timeline",
    difficulty: "Easy"
  },
  {
    id: "6",
    title: "Get Executive Buy-in",
    description: "Involve decision makers in the process",
    impact: 20,
    category: "strategy",
    difficulty: "Hard"
  }
];

export function ScoreImpactSimulator({
  currentScore,
  maxScore = 100,
  actions = defaultActions
}: ScoreImpactSimulatorProps) {
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  const toggleAction = (id: string) => {
    setSelectedActions((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const calculateProjectedScore = () => {
    const totalImpact = actions
      .filter((a) => selectedActions.includes(a.id))
      .reduce((sum, a) => sum + a.impact, 0);
    return Math.min(currentScore + totalImpact, maxScore);
  };

  const projectedScore = calculateProjectedScore();
  const scoreGain = projectedScore - currentScore;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "engagement":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
      case "communication":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-400";
      case "timeline":
        return "bg-amber-500/20 text-amber-700 dark:text-amber-400";
      case "strategy":
        return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400";
      default:
        return "bg-gray-500/20 text-gray-700";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-500/20 text-green-700 dark:text-green-400";
      case "Medium":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
      case "Hard":
        return "bg-red-500/20 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-500/20 text-gray-700";
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header with score projection */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Score Impact Simulator</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1 rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Current Score</p>
              <p className="text-2xl font-bold">{currentScore}</p>
            </div>
            <div className="flex items-center justify-center">
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1 rounded-lg bg-emerald-500/10 p-3">
              <p className="text-xs text-muted-foreground">Projected Score</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{projectedScore}</p>
                {scoreGain > 0 && (
                  <Badge variant="outline" className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                    +{scoreGain}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Recommended Actions</h4>
            {selectedActions.length > 0 && (
              <Badge variant="secondary">
                {selectedActions.length} selected
              </Badge>
            )}
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            <AnimatePresence>
              {actions.map((action) => {
                const isSelected = selectedActions.includes(action.id);

                return (
                  <motion.button
                    key={action.id}
                    onClick={() => toggleAction(action.id)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={`w-full text-left transition-all duration-200 ${
                      isSelected
                        ? "bg-primary/10 border-primary/50"
                        : "bg-muted/50 border-muted-foreground/20 hover:bg-muted"
                    } rounded-lg border p-4`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p
                            className={`font-medium ${
                              isSelected ? "text-primary" : ""
                            }`}
                          >
                            {action.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 rounded-lg bg-green-500/10 px-2 py-1">
                            <ArrowUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                              +{action.impact}
                            </span>
                          </div>
                          <div
                            className={`h-5 w-5 rounded border-2 ${
                              isSelected
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/30"
                            } flex items-center justify-center`}
                          >
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-xs text-primary-foreground"
                              >
                                ✓
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={getCategoryColor(action.category)}
                        >
                          {action.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getDifficultyColor(action.difficulty)}
                        >
                          {action.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Buttons */}
        {selectedActions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 border-t pt-4"
          >
            <Button
              onClick={() => setSelectedActions([])}
              variant="outline"
              className="flex-1"
            >
              Clear Selection
            </Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90">
              Implement Selected Actions
            </Button>
          </motion.div>
        )}
      </div>
    </Card>
  );
}
