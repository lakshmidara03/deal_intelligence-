import Link from "next/link";
import { Activity, BarChart3, Bot, BriefcaseBusiness, LayoutDashboard, Settings, TrendingUp, Sparkles, Radio } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { RunAgentsButton } from "@/components/ai/run-agents-button";

const nav = [
  { href: "/dashboard", label: "Command", icon: LayoutDashboard },
  { href: "/deals", label: "Deals", icon: BriefcaseBusiness },
  { href: "/deal-score", label: "Deal Score", icon: Activity },
  { href: "/win-probability", label: "Win Probability", icon: TrendingUp },
  { href: "/autopilot", label: "Autopilot", icon: Radio },
  { 
    href: "/roadmap", 
    label: "AI Roadmap", 
    icon: Sparkles,
    children: [
      { href: "/roadmap/01", label: "Emotion Tracker" },
      { href: "/roadmap/02", label: "Ghost Detector" },
      { href: "/roadmap/03", label: "Pressure Test" },
      { href: "/roadmap/04", label: "Outreach Clock" },
      { href: "/roadmap/05", label: "Signal Radar" }
    ]
  },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-background/82 px-4 py-5 backdrop-blur-xl lg:block overflow-y-auto">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">DealIQ</p>
            <p className="text-xs text-muted-foreground">AI revenue cockpit</p>
          </div>
        </div>

        <nav className="space-y-1">
          {nav.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
              {item.children && (
                <div className="ml-9 mt-1 space-y-1 border-l border-white/5 pl-2">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block rounded-md px-3 py-1.5 text-xs text-slate-500 transition hover:bg-muted hover:text-slate-300"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b bg-background/76 px-5 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Enterprise Deal Intelligence</p>
              <h1 className="text-lg font-semibold">AI Forecast & Risk Command Center</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <RunAgentsButton />
            </div>
          </div>
        </header>
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
