export function HealthIndicator({ category, score }: { category?: string; score?: number }) {
  const normalized = category ?? (score !== undefined && score >= 70 ? "healthy" : score !== undefined && score >= 40 ? "watch" : "risk");
  const classes =
    normalized === "healthy"
      ? "border-green-200 bg-green-50 text-green-700"
      : normalized === "watch"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-red-200 bg-red-50 text-red-700";
  return <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold capitalize ${classes}`}>{normalized}</span>;
}
