export function AIInsightCard({ title, value }: { title: string; value?: string }) {
  return (
    <section className="rounded-lg border border-border bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{value || "Run AI prediction after uploading dataset."}</p>
    </section>
  );
}
