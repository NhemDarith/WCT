"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Store,
  Layers,
  Users,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";

const NAV = [
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Management",
    items: [
      { href: "/validate-stores", label: "Validate Stores", icon: Store },
      { href: "/manage-categories", label: "Manage Categories", icon: Layers },
    ],
  },
  {
    title: "Users",
    items: [{ href: "/users", label: "All Users", icon: Users }],
  },
];

function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const activeLabel = useMemo(() => {
    for (const g of NAV) {
      for (const i of g.items) {
        if (isActive(pathname, i.href)) return i.label;
      }
    }
    return "Admin";
  }, [pathname]);

  const Side = (
    <aside
      className={[
        "h-full flex flex-col bg-slate-950 text-white border-r border-white/10",
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-72",
      ].join(" ")}
    >
      {/* Brand */}
      <div className="px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 grid place-items-center font-extrabold text-lg shadow-lg shrink-0">
            P
          </div>

          {!collapsed ? (
            <div className="min-w-0">
              <div className="text-lg font-bold truncate">PharmaAdmin</div>
              <div className="text-xs text-white/50 truncate">{activeLabel}</div>
            </div>
          ) : null}
        </div>

        {/* Collapse (desktop) */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="hidden md:inline-flex p-2 rounded-xl hover:bg-white/10 transition"
          title={collapsed ? "Expand" : "Collapse"}
        >
          <ChevronLeft
            size={18}
            className={["transition-transform", collapsed ? "rotate-180" : ""].join(" ")}
          />
        </button>

        {/* Close (mobile) */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-2 rounded-xl hover:bg-white/10"
          title="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto">
        {NAV.map((group) => (
          <div key={group.title}>
            {!collapsed ? (
              <div className="px-3 mb-2 text-[11px] font-semibold tracking-widest uppercase text-white/40">
                {group.title}
              </div>
            ) : (
              <div className="h-2" />
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={item.label}
                    className={[
                      "relative group flex items-center gap-3 rounded-xl px-3 py-2.5",
                      "transition-all duration-200",
                      active
                        ? "bg-gradient-to-r from-sky-500/20 to-blue-600/10 ring-1 ring-sky-500/20"
                        : "hover:bg-white/5",
                    ].join(" ")}
                  >
                    {/* Active bar */}
                    <span
                      className={[
                        "absolute left-0 top-2 bottom-2 w-1 rounded-r-full",
                        active ? "bg-sky-400" : "bg-transparent",
                      ].join(" ")}
                    />

                    <Icon
                      size={18}
                      className={[
                        "transition",
                        active
                          ? "text-sky-300"
                          : "text-white/60 group-hover:text-white",
                      ].join(" ")}
                    />

                    {!collapsed ? (
                      <span
                        className={[
                          "text-sm font-medium",
                          active ? "text-white" : "text-white/80",
                        ].join(" ")}
                      >
                        {item.label}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b px-4 py-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        >
          <Menu size={18} />
          Menu
        </button>

        <div className="text-sm font-bold text-slate-900">PharmaAdmin</div>
        <div className="w-10" />
      </div>

      {/* Desktop */}
      <div className="hidden md:block">{Side}</div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0">{Side}</div>
        </div>
      ) : null}
    </>
  );
}
