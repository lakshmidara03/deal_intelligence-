"use client";

import { useState } from "react";
import { Bot, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RunAgentsButton() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");

  async function runAgents() {
    setStatus("running");
    try {
      const response = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: {
            inactivity_days: 9,
            stage_age_days: 31,
            next_step_defined: false,
            probability: 64,
            forecast_trend: "declining",
            interaction_text: "Buyer mentioned pricing pressure and a competitor during procurement review."
          }
        })
      });

      if (!response.ok) {
        throw new Error("Agent route failed");
      }

      await response.json();
      setStatus("done");
      window.setTimeout(() => setStatus("idle"), 2200);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 2600);
    }
  }

  return (
    <Button size="sm" onClick={runAgents} disabled={status === "running"} title="Run AI agent workflow">
      {status === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> : status === "done" ? <CheckCircle2 className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      {status === "running" ? "Running" : status === "done" ? "Agents Ran" : status === "error" ? "Retry Agents" : "Run Agents"}
    </Button>
  );
}
