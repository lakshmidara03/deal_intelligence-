"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Bell, ChevronRight, Check, DollarSign, Edit3, GraduationCap, GripVertical, LayoutGrid, Phone, Search, MoreVertical, X } from "lucide-react";
import { toast } from "sonner";

type BoardCard = {
  id: string;
  title: string;
  description: string;
  owner: string;
  lastModified: string;
  action: "Edit" | "View";
  editable: boolean;
  href: string;
  notificationCount: number;
  audience: "AE" | "Manager" | "Exec";
  locked?: boolean;
  featured?: boolean;
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  boardId?: string;
  actionLabel?: string;
  read: boolean;
};

const initialBoards: BoardCard[] = [
  {
    id: "my-deals",
    title: "My Deals",
    description: "Personal pipeline board for AEs - active deals only",
    owner: "Sarah K.",
    lastModified: "Modified 2h ago",
    action: "Edit",
    editable: true,
    href: "/boards/my-deals",
    notificationCount: 3,
    audience: "AE"
  },
  {
    id: "enterprise-deals-q2",
    title: "Enterprise Deals Q2",
    description: "All enterprise opportunities for Q2 2026",
    owner: "Sarah Chen",
    lastModified: "Modified yesterday",
    action: "View",
    editable: false,
    href: "/boards/my-deals?board=enterprise-deals-q2",
    notificationCount: 1,
    audience: "Manager"
  },
  {
    id: "team-pipeline-west",
    title: "Team Pipeline - West",
    description: "Manager-level view across all reps - this quarter",
    owner: "Marcus L.",
    lastModified: "Modified 4h ago",
    action: "View",
    editable: false,
    href: "/boards/my-deals?board=team-pipeline-west",
    notificationCount: 2,
    audience: "Manager",
    featured: true
  },
  {
    id: "strategic-accounts",
    title: "Strategic Accounts",
    description: "High-value strategic account opportunities",
    owner: "RevOps",
    lastModified: "Modified 3 days ago",
    action: "Edit",
    editable: true,
    href: "/boards/my-deals?board=strategic-accounts",
    notificationCount: 0,
    audience: "Exec",
    locked: true
  }
];

const navItems = [
  { icon: ChevronRight, href: "/boards" },
  { icon: LayoutGrid, href: "/boards" },
  { icon: Phone, href: "/boards/my-deals?board=team-pipeline-west" },
  { icon: DollarSign, href: "/boards/my-deals", active: true },
  { icon: GraduationCap, href: "/boards/my-deals?board=strategic-accounts" }
];

const storageKey = "dealboards.custom-boards";
const notificationsKey = "dealboards.notifications";

const initialNotifications: NotificationItem[] = [
  {
    id: "n1",
    title: "My Deals board updated",
    message: "2 deals crossed the close-date threshold this morning.",
    time: "10m ago",
    boardId: "my-deals",
    actionLabel: "Open board",
    read: false
  },
  {
    id: "n2",
    title: "CRM sync ready",
    message: "There are unsynced changes waiting in Update CRM.",
    time: "1h ago",
    boardId: "my-deals",
    actionLabel: "Review CRM",
    read: false
  },
  {
    id: "n3",
    title: "FAQ and setup help",
    message: "Open the help guide for login, HubSpot, and board usage.",
    time: "Today",
    actionLabel: "Open FAQ",
    read: true
  }
];

export default function BoardsPage() {
  const router = useRouter();
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [owner, setOwner] = useState("All owners");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [boards, setBoards] = useState<BoardCard[]>(initialBoards);
  const [actionMenuBoardId, setActionMenuBoardId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as BoardCard[];
        if (Array.isArray(parsed) && parsed.length) setBoards(parsed);
      }
    } catch {
      // optional persistence
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(boards));
    } catch {
      // ignore storage issues
    }
  }, [boards]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(notificationsKey);
      if (raw) {
        const parsed = JSON.parse(raw) as NotificationItem[];
        if (Array.isArray(parsed) && parsed.length) setNotifications(parsed);
      }
    } catch {
      // ignore optional storage
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(notificationsKey, JSON.stringify(notifications));
    } catch {
      // ignore storage issues
    }
  }, [notifications]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!notificationsOpen) return;
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    const closeMenu = () => setActionMenuBoardId(null);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActionMenuBoardId(null);
    };

    window.addEventListener("pointerdown", closeMenu);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", closeMenu);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const owners = useMemo(() => ["All owners", ...new Set(boards.map((board) => board.owner))], [boards]);
  const filteredBoards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return boards.filter((board) => {
      const matchesSearch =
        !q ||
        board.title.toLowerCase().includes(q) ||
        board.description.toLowerCase().includes(q) ||
        board.owner.toLowerCase().includes(q);
      const matchesOwner = owner === "All owners" || board.owner === owner;
      return matchesSearch && matchesOwner;
    });
  }, [boards, owner, search]);

  const duplicateBoard = (board: BoardCard) => {
    const copy: BoardCard = {
      ...board,
      id: `${board.id}-copy-${Date.now()}`,
      title: `${board.title} (Copy)`,
      description: `${board.description} - duplicated for quick edits`,
      lastModified: "Just now",
      notificationCount: 0,
      action: "Edit",
      editable: true,
      locked: false,
      featured: false
    };
    setBoards((current) => [copy, ...current]);
    toast.success(`${board.title} duplicated`);
  };

  const unreadCount = notifications.filter((item) => !item.read).length;

  const openNotification = (item: NotificationItem) => {
    setNotifications((current) => current.map((notification) => (notification.id === item.id ? { ...notification, read: true } : notification)));
    if (item.boardId) {
      router.push(item.boardId === "my-deals" ? "/boards/my-deals" : `/boards/my-deals?board=${item.boardId}`);
      return;
    }
    router.push("/help");
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-[88px] border-r border-slate-200 bg-white pt-[64px] md:block">
        <nav className="space-y-0">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                type="button"
                onClick={() => router.push(item.href)}
                className={`relative flex h-[64px] w-full items-center justify-center text-slate-500 ${item.active ? "bg-blue-50 text-blue-800" : "hover:bg-slate-50"}`}
              >
                {item.active ? <span className="absolute left-0 h-10 w-1.5 rounded-r-full bg-blue-700" /> : null}
                <Icon size={24} strokeWidth={item.icon === DollarSign ? 2 : 1.8} />
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="px-6 py-7 md:ml-[88px]">
        <header className="border-b border-slate-200 bg-white px-7 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-[28px] font-semibold leading-tight text-slate-950">Deal Boards</h1>
              <p className="mt-2 text-base text-slate-600">Manage and track your deals across different boards</p>
            </div>
            <div ref={notificationPanelRef} className="relative flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((current) => !current)}
                  aria-expanded={notificationsOpen}
                  aria-label="Open notifications"
                  className={`relative rounded-full border px-3 py-3 transition ${
                    notificationsOpen ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Bell size={20} />
                  {unreadCount > 0 ? <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white" /> : null}
                </button>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">{unreadCount} notifications</span>

              {notificationsOpen ? (
                <div className="absolute right-0 top-14 z-20 w-[360px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
                      <p className="text-xs text-slate-500">Board updates, CRM changes, and help</p>
                    </div>
                    <button type="button" onClick={() => setNotificationsOpen(false)} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="mt-3 max-h-[320px] space-y-3 overflow-y-auto pr-1">
                    {notifications.map((item) => (
                      <article key={item.id} className={`rounded-xl border p-3 ${item.read ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                            <p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p>
                          </div>
                          {item.read ? <Check size={16} className="mt-1 shrink-0 text-emerald-600" /> : <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-xs text-slate-400">{item.time}</span>
                          <button
                            type="button"
                            onClick={() => openNotification(item)}
                            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            {item.actionLabel ?? "Open"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                    <button
                      type="button"
                      onClick={() => setNotifications((current) => current.map((item) => ({ ...item, read: true })))}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Mark all read
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/help")}
                      className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Open FAQ
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[minmax(240px,1fr)_220px]">
            <label className="relative block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search boards..."
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-400"
              />
            </label>
            <select
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none focus:border-blue-400"
            >
              {owners.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        </header>

        <div className="grid gap-6 px-7 py-7 lg:grid-cols-2 xl:grid-cols-3">
          {filteredBoards.map((board) => (
            <article
              key={board.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(board.href)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") router.push(board.href);
              }}
              className={`group relative min-h-[220px] cursor-pointer rounded-[18px] border bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg ${
                board.featured ? "border-blue-500 shadow-[0_16px_34px_rgba(37,99,235,0.14)]" : "border-slate-200 shadow-sm"
              }`}
            >
              <div className="absolute right-6 top-6 z-10">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setActionMenuBoardId((current) => (current === board.id ? null : board.id));
                  }}
                  aria-label={`Open actions for ${board.title}`}
                  aria-expanded={actionMenuBoardId === board.id}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  <MoreVertical size={24} />
                </button>

                {actionMenuBoardId === board.id ? (
                  <div
                    role="menu"
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                    className="absolute right-0 top-12 w-60 rounded-xl border border-slate-200 bg-white py-2 shadow-[0_18px_40px_rgba(15,23,42,0.16)]"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setActionMenuBoardId(null);
                        router.push(board.href);
                      }}
                      className="block w-full px-6 py-3 text-left text-lg text-slate-900 hover:bg-slate-50"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setActionMenuBoardId(null);
                        router.push(board.href);
                      }}
                      className="block w-full px-6 py-3 text-left text-lg text-slate-900 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setActionMenuBoardId(null);
                        duplicateBoard(board);
                      }}
                      className="block w-full px-6 py-3 text-left text-lg text-slate-900 hover:bg-slate-50"
                    >
                      Duplicate
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-indigo-50">
                    <BarChart3 size={26} className="text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-serif text-[22px] font-semibold leading-tight text-slate-950">{board.title}</h2>
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                      <Edit3 size={17} className="text-blue-500" />
                      <span>{board.editable ? "Edit" : "View"}</span>
                      {board.locked ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Locked</span> : null}
                    </div>
                  </div>
                </div>
                <GripVertical size={20} className="mr-9 shrink-0 text-slate-500" />
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">{board.description}</p>

              <div className="mt-5 flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">{board.audience}</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">{board.notificationCount} alerts</span>
              </div>

              <div className="mt-5 border-t border-slate-200 pt-5">
                <p className="text-sm text-slate-400">
                  Owner: <span className="font-medium text-slate-800">{board.owner}</span>
                </p>
                <p className="mt-2 text-xs text-slate-400">{board.lastModified}</p>
              </div>

              <div className="mt-3 text-xs text-slate-400">Click card to open</div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
