"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HealthFactor {
  name: string;
  value: number;
  status: "Excellent" | "Good" | "Average" | "Poor";
  change?: number;
}

interface DealHealthScoreProps {
  score: number;
  maxScore?: number;
  status: "Healthy" | "Needs Review" | "At Risk";
  lastUpdated?: string;
  factors?: HealthFactor[];
}

export function DealHealthScore({
  score,
  maxScore = 100,
  status,
  lastUpdated,
  factors = []
}: DealHealthScoreProps) {
  const percentage = (score / maxScore) * 100;

  const getScoreColor = (value: number) => {
    if (value >= 80) return "from-green-400 to-green-600";
    if (value >= 60) return "from-yellow-400 to-yellow-600";
    if (value >= 40) return "from-orange-400 to-orange-600";
    return "from-red-400 to-red-600";
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "Healthy":
        return "bg-green-500/20 text-green-700 dark:text-green-400";
      case "Needs Review":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
      case "At Risk":
        return "bg-red-500/20 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-500/20 text-gray-700";
    }
  };

  const getFactorColor = (factorStatus: string) => {
    switch (factorStatus) {
      case "Excellent":
        return "text-green-500";
      case "Good":
        return "text-green-400";
      case "Average":
        return "text-yellow-500";
      case "Poor":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Deal Health Score</h3>
          <Badge className={getStatusColor(status)}>{status}</Badge>
        </div>

        {/* Score Gauge */}
        <div className="flex flex-col items-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative h-48 w-48"
          >
            <svg className="h-full w-full" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-muted-foreground/20"
              />

              {/* Progress arc */}
              <motion.circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                strokeWidth="12"
                strokeDasharray={`${(percentage / 100) * 565.48} 565.48`}
                className={`text-transparent stroke-current transition-all`}
                style={{
                  background: `conic-gradient(${
                    percentage >= 80
                      ? "#22c55e"
                      : percentage >= 60
                        ? "#eab308"
                        : percentage >= 40
                          ? "#f97316"
                          : "#ef4444"
                  } 0deg, #1f2937 ${percentage * 3.6}deg)`
                }}
                initial={{ strokeDasharray: "0 565.48" }}
                animate={{ strokeDasharray: `${(percentage / 100) * 565.48} 565.48` }}
                transition={{ duration: 1.5 }}
                style={{
                  stroke:
                    percentage >= 80
                      ? "#22c55e"
                      : percentage >= 60
                        ? "#eab308"
                        : percentage >= 40
                          ? "#f97316"
                          : "#ef4444",
                  transform: "rotate(-90deg)",
                  transformOrigin: "100px 100px"
                }}
              />

              {/* Center text */}
              <text
                x="100"
                y="90"
                textAnchor="middle"
                className="text-3xl font-bold fill-foreground"
              >
                {Math.round(score)}
              </text>
              <text
                x="100"
                y="115"
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
              >
                out of {maxScore}
              </text>
            </svg>
          </motion.div>

          <div className="text-center space-y-1">
            <p className="text-2xl font-bold">Your Score is {status}</p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Updated on {new Date(lastUpdated).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Key Factors */}
        {factors.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Key Factors</h4>
            <div className="space-y-2">
              {factors.map((factor) => (
                <motion.div
                  key={factor.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between rounded-md bg-muted/50 p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{factor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {factor.value}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {factor.change !== undefined && (
                      <div className="flex items-center gap-1">
                        {factor.change > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : factor.change < 0 ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : null}
                        <span className={factor.change > 0 ? "text-green-600 dark:text-green-400" : factor.change < 0 ? "text-red-600 dark:text-red-400" : ""}>
                          {factor.change > 0 ? "+" : ""}{factor.change}%
                        </span>
                      </div>
                    )}
                    <Badge
                      variant="outline"
                      className={`${getFactorColor(factor.status)}`}
                    >
                      {factor.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
