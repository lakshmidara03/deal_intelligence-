import { notFound } from "next/navigation";
import { DealDetail } from "@/components/deals/deal-detail";
import { AppShell } from "@/components/shared/app-shell";
import { getDeal, getInteractions } from "@/lib/local-store";

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = getDeal(id);

  if (!deal) {
    notFound();
  }

  return (
    <AppShell>
      <DealDetail deal={deal} interactions={getInteractions(id)} />
    </AppShell>
  );
}
