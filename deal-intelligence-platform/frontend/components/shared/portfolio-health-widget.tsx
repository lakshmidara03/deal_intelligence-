"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PortfolioHealthWidgetProps {
  score: number;
  trend?: "up" | "down" | "stable";
  maxScore?: number;
}

export function PortfolioHealthWidget({
  score,
  trend = "stable",
  maxScore = 100
}: PortfolioHealthWidgetProps) {
  const percentage = (score / maxScore) * 100;

  const getScoreClass = (value: number) => {
    if (value >= 80) return "text-green-500";
    if (value >= 60) return "text-yellow-500";
    if (value >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getBgClass = (value: number) => {
    if (value >= 80) return "bg-green-500/10";
    if (value >= 60) return "bg-yellow-500/10";
    if (value >= 40) return "bg-orange-500/10";
    return "bg-red-500/10";
  };

  const getStatusLabel = (value: number) => {
    if (value >= 80) return "Strong";
    if (value >= 60) return "Good";
    if (value >= 40) return "Fair";
    return "Critical";
  };

  return (
    <Link href="/dashboard">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`${getBgClass(score)} mx-2 mb-4 mt-6 cursor-pointer rounded-lg border border-transparent px-3 py-4 transition hover:border-primary/50`}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Portfolio Health
            </h4>
            {trend === "up" && (
              <TrendingUp className="h-3 w-3 text-green-500" />
            )}
            {trend === "down" && (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            {trend === "stable" && (
              <Minus className="h-3 w-3 text-muted-foreground" />
            )}
          </div>

          <div className="flex items-end gap-2">
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`text-3xl font-bold ${getScoreClass(score)}`}
            >
              {Math.round(score)}
            </motion.span>
            <span className="text-xs text-muted-foreground mb-1">
              /{maxScore}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-muted-foreground/20 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, type: "spring" }}
              className={`h-full ${
                percentage >= 80
                  ? "bg-green-500"
                  : percentage >= 60
                    ? "bg-yellow-500"
                    : percentage >= 40
                      ? "bg-orange-500"
                      : "bg-red-500"
              }`}
            />
          </div>

          <p className="text-xs font-medium text-foreground">
            {getStatusLabel(score)} • View Details →
          </p>
        </div>
      </motion.div>
    </Link>
  );
}
