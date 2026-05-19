import type { Activity } from "@dealboards/types";

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (!activities?.length) return <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">No activity imported yet.</p>;

  const sorted = [...activities].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  const colors = {
    our: "bg-pink-500",
    customer: "bg-violet-500"
  };

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-blue-500 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-slate-900">Activity Timeline</h3>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <LegendDot color="bg-pink-500" label="Our interaction" />
            <LegendDot color="bg-violet-500" label="Customer interaction" />
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-blue-500 bg-slate-50 p-4">
          <div className="grid grid-cols-[repeat(4,1fr)] gap-4 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {timelineLabels(sorted).map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>
          <div className="relative mt-8 h-24">
            <div className="absolute left-4 right-4 top-10 h-[2px] bg-slate-300" />
            {sorted.map((activity, index) => {
              const left = `${((index + 1) / (sorted.length + 1)) * 100}%`;
              const ours = activity.sentiment && activity.sentiment.toLowerCase() === "negative" ? colors.our : colors.customer;
              return (
                <div key={activity.id} className="absolute top-9" style={{ left }}>
                  <span className={`absolute left-[-4px] top-[-4px] h-3 w-3 rounded-full ${ours}`} />
                  <span className={`absolute left-[-4px] top-[14px] h-2.5 w-2.5 rounded-full ${ours} opacity-80`} />
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex justify-center">
            <div className="relative h-2 w-[88%] rounded-full bg-slate-200">
              <div className="absolute right-[18%] top-[-6px] h-8 w-8 rounded-full border-4 border-white bg-slate-900 shadow" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Activity Details</h3>
        <div className="space-y-3">
          {sorted.map((activity) => (
            <article key={activity.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="mt-2 h-3 w-3 rounded-full bg-pink-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{activity.subject}</p>
                  <p className="mt-1 text-sm text-slate-500">{activity.subject}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                {activity.durationMinutes ? <span className="rounded-md bg-slate-100 px-2 py-1">{activity.durationMinutes}min</span> : null}
                <span>{new Date(activity.occurredAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function timelineLabels(activities: Activity[]) {
  const labels = activities.slice(0, 4).map((activity) => new Date(activity.occurredAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase());
  while (labels.length < 4) labels.push("TODAY");
  return labels;
}
