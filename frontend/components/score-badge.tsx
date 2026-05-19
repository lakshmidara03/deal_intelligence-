export function ScoreBadge({ score }: { score?: number }) {
  const value = score ?? 0;
  const color = value >= 75 ? "bg-green-50 text-green-700 border-green-200" : value >= 55 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200";
  return <span className={`inline-flex min-w-14 items-center justify-center rounded-full border px-2 py-1 text-xs font-semibold ${color}`}>{value}</span>;
}
