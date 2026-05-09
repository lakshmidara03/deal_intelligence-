"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddInteractionForm({ dealId }: { dealId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deal_id: dealId,
        channel: form.get("channel"),
        actor: form.get("actor"),
        summary: form.get("summary"),
        sentiment: form.get("sentiment")
      })
    });
    if (response.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Activity
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border bg-background/70 p-4 md:grid-cols-4">
      <select name="channel" className="h-10 rounded-md border bg-background px-3 text-sm">
        <option value="call">Call</option>
        <option value="email">Email</option>
        <option value="meeting">Meeting</option>
      </select>
      <Input name="actor" placeholder="Actor" defaultValue="Sales team" />
      <select name="sentiment" className="h-10 rounded-md border bg-background px-3 text-sm">
        <option value="neutral">Neutral</option>
        <option value="positive">Positive</option>
        <option value="negative">Negative</option>
      </select>
      <Input name="summary" placeholder="Interaction summary" required />
      <div className="md:col-span-4">
        <Button type="submit" size="sm">Save Activity</Button>
      </div>
    </form>
  );
}
