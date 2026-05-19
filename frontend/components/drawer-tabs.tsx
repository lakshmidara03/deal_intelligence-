import { Activity, CheckSquare, Edit3, FileText, TriangleAlert } from "lucide-react";

export const drawerTabs = ["Brief", "Warnings", "Playbook", "Activity", "Update CRM"] as const;
export type DrawerTab = (typeof drawerTabs)[number];

const tabIcons = {
  Brief: FileText,
  Warnings: TriangleAlert,
  Playbook: CheckSquare,
  Activity,
  "Update CRM": Edit3
};

export function DrawerTabs({ active, onChange, warningCount = 0 }: { active: DrawerTab; onChange: (tab: DrawerTab) => void; warningCount?: number }) {
  return (
    <div className="flex border-b border-slate-200 bg-slate-50">
      {drawerTabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`flex min-h-[72px] flex-1 items-center justify-center gap-2.5 border-b-[3px] px-4 text-sm transition ${
            active === tab ? "border-blue-500 bg-white text-slate-900" : "border-transparent text-slate-500 hover:bg-white/70"
          }`}
        >
          {(() => {
            const Icon = tabIcons[tab];
            return <Icon size={18} strokeWidth={1.8} />;
          })()}
          <span>{tab}</span>
          {tab === "Warnings" && warningCount > 0 ? (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-100 px-2 text-sm font-medium text-red-600">{warningCount}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
