"use client";

import Link from "next/link";
import { ArrowLeft, BadgeCheck, BookOpenText, Database, Globe, LockKeyhole, RefreshCw, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";

const faqs = [
  {
    question: "What login should a sales rep use?",
    answer: "Use sales.rep@example.com with the demo password SalesRep@123. The app validates empty fields and blocks suspicious input."
  },
  {
    question: "Why do I see My Deals - Q2?",
    answer: "That is the default personal board for the sales rep view. It shows the working set of deals assigned to the rep."
  },
  {
    question: "What does the locked badge mean?",
    answer: "Locked means the board is preset for the current user or role. It is meant to guide the view without letting the user accidentally change the board scope."
  },
  {
    question: "How do filters work?",
    answer: "Use Stage, Forecast Category, Close Date, Amount, and search to narrow the deal list. Grouping changes how the table is organized."
  },
  {
    question: "What happens when I click Refresh AI?",
    answer: "The backend recalculates the AI summary, warnings, and suggested next step for that deal, then refreshes the drawer data."
  },
  {
    question: "Can the sales rep add new playbook steps?",
    answer: "No. For this view the playbook is read-only for steps. The rep can work the existing steps and mark them done, but not add new ones."
  },
  {
    question: "What does Save to CRM do?",
    answer: "It updates the CRM fields in the connected HubSpot deal and creates history so the change is visible later."
  },
  {
    question: "How do we keep deal history?",
    answer: "Each save should create a CRM note or timeline entry and also log the change locally in the app audit history."
  },
  {
    question: "Do I need a paid HubSpot license?",
    answer: "No. You can start with HubSpot's free CRM and a private app token for server-side updates."
  },
  {
    question: "What if HubSpot is not connected yet?",
    answer: "The app can still run with local data, but CRM sync will be limited until the HubSpot private app token is configured in backend/.env."
  },
  {
    question: "What does the notifications bell show?",
    answer: "It shows board updates, CRM sync reminders, and help links. Clicking a notification can open the related board or the FAQ."
  },
  {
    question: "How do I get help fast?",
    answer: "Open this FAQ page, or use the notification panel's Open FAQ button. It covers login, boards, CRM sync, and HubSpot setup."
  }
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <section className="mx-auto max-w-5xl rounded-[20px] border border-slate-200 bg-white px-8 py-7 shadow-sm">
        <Link href="/boards" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} />
          Back to Deal Boards
        </Link>

        <header className="mt-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            <BadgeCheck size={16} />
            Sales Rep Guide
          </div>
          <h1 className="mt-4 font-serif text-[32px] font-semibold leading-tight text-slate-950">Questions and Answers</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            This page collects the most likely questions about login, deal boards, CRM updates, and HubSpot sync so you can use the app without guessing.
          </p>
        </header>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{faq.question}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">{faq.answer}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <QuickTip icon={LockKeyhole} title="Login" text="Use the demo sales rep credentials and avoid direct-login shortcuts." />
          <QuickTip icon={RefreshCw} title="AI refresh" text="Refresh AI reruns the local or remote prediction flow for the open deal." />
          <QuickTip icon={Database} title="CRM sync" text="Saving CRM should update HubSpot, add a note, and write a local sync log." />
          <QuickTip icon={Globe} title="HubSpot setup" text="A free HubSpot CRM account plus a private app token is enough to start." />
          <QuickTip icon={Sparkles} title="Deal work" text="Warnings and playbook items are actionable, but playbook steps stay controlled." />
          <QuickTip icon={ShieldCheck} title="Safety" text="Empty inputs and suspicious login text are blocked before auth runs." />
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
            <BookOpenText size={16} />
            Fast Reference
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <SmallRow label="Login" value="sales.rep@example.com / SalesRep@123" />
            <SmallRow label="HubSpot" value="Free CRM + private app token" />
            <SmallRow label="CRM save" value="Update deal, add note, log sync" />
            <SmallRow label="Notifications" value="Board alerts, CRM reminders, FAQ shortcut" />
          </div>
        </div>
      </section>
    </main>
  );
}

function QuickTip({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon size={18} />
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{text}</p>
    </article>
  );
}

function SmallRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-sm text-slate-800">{value}</span>
    </div>
  );
}
