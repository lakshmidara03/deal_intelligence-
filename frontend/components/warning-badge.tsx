import type { Warning } from "@dealboards/types";

export function WarningBadge({ warnings }: { warnings: Warning[] }) {
  if (!warnings.length) return <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">Clear</span>;
  const critical = warnings.some((warning) => String(warning.severity).toUpperCase() === "CRITICAL");
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${critical ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
      {warnings.length} warning{warnings.length > 1 ? "s" : ""}
    </span>
  );
}
