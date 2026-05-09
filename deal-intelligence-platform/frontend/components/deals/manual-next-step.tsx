"use client";

import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ManualNextStep({ initialStep }: { initialStep?: string }) {
  const [step, setStep] = useState(initialStep ?? "");
  const [saved, setSaved] = useState(false);

  return (
    <div className="rounded-lg border bg-background/70 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <ClipboardCheck className="h-4 w-4 text-primary" />
        Manual Next Step
      </div>
      <div className="flex gap-2">
        <Input
          value={step}
          onChange={(event) => {
            setStep(event.target.value);
            setSaved(false);
          }}
          placeholder="Add manager-approved next step, e.g. call CFO tomorrow"
        />
        <Button type="button" size="sm" onClick={() => setSaved(true)}>Save</Button>
      </div>
      {saved && <p className="mt-2 text-xs text-muted-foreground">Saved locally for this review session.</p>}
    </div>
  );
}
